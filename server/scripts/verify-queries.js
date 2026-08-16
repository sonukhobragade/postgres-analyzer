#!/usr/bin/env node
/**
 * Run every analysis query against a real PostgreSQL and report what it found.
 *
 *   docker compose -f docker-compose.test.yml up -d
 *   node scripts/verify-queries.js
 *
 * Why this exists: the unit tests check the code around the queries, not the
 * queries themselves. A query can be valid SQL, pass every test, and still be
 * wrong — or fail outright on a schema nobody thought to try. All three of the
 * bugs listed at the bottom of this file were found by running this, after the
 * unit suite was green.
 *
 * The fixture is deliberately awkward: a table named "Weird.Name", an index
 * nothing uses, a table with no primary key. Ordinary databases contain all of
 * these.
 */

const { Client } = require('pg');
const { performanceQueries } = require('../utils/queries');

const CONFIG = {
  host: process.env.VERIFY_DB_HOST || '127.0.0.1',
  port: parseInt(process.env.VERIFY_DB_PORT || '55432', 10),
  user: process.env.VERIFY_DB_USER || 'postgres',
  password: process.env.VERIFY_DB_PASSWORD || 'testpass',
  database: process.env.VERIFY_DB_NAME || 'analyzer_test',
};

const FIXTURE = `
  DROP TABLE IF EXISTS orders, customers, "Weird.Name" CASCADE;
  CREATE TABLE orders (id serial primary key, sku text, qty int, created timestamptz default now());
  CREATE TABLE customers (id serial primary key, name text, region text);
  INSERT INTO orders (sku, qty) SELECT 'SKU-'||i, i%7 FROM generate_series(1,20000) i;
  INSERT INTO customers (name, region) SELECT 'Customer '||i, 'r'||(i%5) FROM generate_series(1,5000) i;
  CREATE INDEX idx_orders_unused ON orders(qty);
  -- A quoted identifier. This one crashed the table-statistics query, because
  -- it built schemaname||'.'||relname and PostgreSQL read the result as a
  -- cross-database reference. One awkward table broke the panel for every table.
  CREATE TABLE "Weird.Name" (id int);
  INSERT INTO "Weird.Name" SELECT generate_series(1,100);
  ANALYZE;
  SELECT count(*) FROM orders WHERE sku LIKE '%99%';
  SELECT count(*) FROM customers WHERE region = 'r3';
`;

const connect = () => new Client(CONFIG);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runAll(client) {
  console.log('\n--- every query, against a live server -------------------------------');
  let passed = 0;
  const failures = [];

  for (const [name, sql] of Object.entries(performanceQueries)) {
    if (typeof sql !== 'string') continue;
    try {
      const res = await client.query(sql);
      console.log(`  PASS  ${name.padEnd(20)} ${String(res.rows.length).padStart(3)} rows`);
      passed += 1;
    } catch (err) {
      console.log(`  FAIL  ${name.padEnd(20)} ${err.message.split('\n')[0]}`);
      failures.push(name);
    }
  }
  return { passed, failures };
}

/**
 * Wait for the statistics collector to catch up.
 *
 * pg_stat_user_tables is updated asynchronously, so reading it immediately
 * after an INSERT can report the old counts. This is a property of PostgreSQL,
 * not of the queries under test — but without the wait this script reports a
 * failure that disappears when you run it again, which is worse than no check.
 */
async function waitForStats(client, table, expected, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { rows } = await client.query(
      'SELECT n_live_tup FROM pg_stat_user_tables WHERE relname = $1', [table]);
    if (rows.length && Number(rows[0].n_live_tup) >= expected) return true;
    await sleep(400);
  }
  return false;
}

async function checkValues(client) {
  console.log('\n--- do the numbers match the fixture? --------------------------------');
  await waitForStats(client, 'orders', 20000);
  const checks = [];

  const tables = (await client.query(performanceQueries.tableStats)).rows;
  const orders = tables.find((r) => r.tablename === 'orders');
  const weird = tables.find((r) => r.tablename === 'Weird.Name');
  checks.push(['orders reports 20000 live tuples', orders && Number(orders.live_tuples) === 20000]);
  checks.push(['a table with a dot in its name is listed', Boolean(weird)]);
  checks.push(['"Weird.Name" is correctly reported as having no primary key',
    weird && weird.has_primary_key === false]);
  checks.push(['orders is correctly reported as having a primary key',
    orders && orders.has_primary_key === true]);

  const indexes = (await client.query(performanceQueries.indexUsage)).rows;
  const unused = indexes.find((r) => r.indexname === 'idx_orders_unused');
  checks.push(['the deliberately unused index shows 0 scans',
    unused && Number(unused.index_scans) === 0]);

  // Connection counting: PostgreSQL's own background workers used to be
  // counted, so an idle server reported connections that were not connections.
  const idle = connect();
  await idle.connect();
  await sleep(300);
  const conn = (await client.query(performanceQueries.connectionStats)).rows[0];
  checks.push(['one idle client connection is counted', Number(conn.idle) === 1]);
  checks.push(['total equals the states beneath it',
    Number(conn.total) === Number(conn.active) + Number(conn.idle) +
      Number(conn.idle_in_transaction)]);
  await idle.end();

  for (const [label, ok] of checks) {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}`);
  }
  return checks.filter(([, ok]) => !ok).map(([label]) => label);
}

async function checkBlocking(client) {
  console.log('\n--- blocking detection, with real locks ------------------------------');
  const blocker = connect();
  const waiter1 = connect();
  const waiter2 = connect();
  await Promise.all([blocker.connect(), waiter1.connect(), waiter2.connect()]);

  const failures = [];
  try {
    await blocker.query('BEGIN');
    await blocker.query('UPDATE orders SET qty = qty WHERE id = 1');
    const blockerPid = (await blocker.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;

    // Two waiters behind one blocker. They queue, so the second waits on the
    // first — which is how the old query came to name a stuck session as the
    // blocker to go and kill.
    //
    // statement_timeout makes the waiters give up on their own. Without it a
    // blocked UPDATE waits forever, and the connection cannot even process the
    // ROLLBACK sent to clean it up: the cleanup queues behind the statement it
    // is trying to cancel, and the script hangs instead of finishing.
    for (const w of [waiter1, waiter2]) {
      await w.query("SET statement_timeout = '4s'");
      w.query('BEGIN')
        .then(() => w.query('UPDATE orders SET qty = qty WHERE id = 1'))
        .catch(() => {});
    }
    await sleep(1500);

    const rows = (await client.query(performanceQueries.blockingQueries)).rows;
    for (const r of rows) {
      const root = r.blocker_is_also_blocked === false ? 'ROOT CAUSE' : 'also blocked';
      console.log(`  ${r.blocking_pid} blocks ${r.blocked_pid}  (${root}, ` +
                  `waited ${Number(r.blocked_duration_seconds).toFixed(1)}s)`);
    }

    const roots = rows.filter((r) => r.blocker_is_also_blocked === false);
    const checks = [
      ['blocking is detected at all', rows.length > 0],
      ['exactly one session is identified as the root cause', roots.length === 1],
      ['and it is the session actually holding the lock',
        roots.length === 1 && String(roots[0].blocking_pid) === String(blockerPid)],
    ];
    for (const [label, ok] of checks) {
      console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}`);
      if (!ok) failures.push(label);
    }
  } finally {
    // Release the lock first so the waiters can finish, then let their
    // statement_timeout expire before closing anything.
    await blocker.query('ROLLBACK').catch(() => {});
    await sleep(500);
    for (const c of [waiter1, waiter2]) await c.query('ROLLBACK').catch(() => {});
    for (const c of [blocker, waiter1, waiter2]) {
      await Promise.race([c.end().catch(() => {}), sleep(2000)]);
    }
  }
  return failures;
}

(async () => {
  const client = connect();
  try {
    await client.connect();
  } catch (err) {
    console.error(`Cannot reach PostgreSQL at ${CONFIG.host}:${CONFIG.port} — ${err.message}`);
    console.error('Start one with: docker compose -f docker-compose.test.yml up -d');
    process.exit(2);
  }

  const version = (await client.query('SHOW server_version')).rows[0].server_version;
  console.log(`PostgreSQL ${version} at ${CONFIG.host}:${CONFIG.port}`);
  await client.query('CREATE EXTENSION IF NOT EXISTS pg_stat_statements').catch(() => {
    console.log('(pg_stat_statements not available — the slow-query panel will be empty)');
  });
  await client.query(FIXTURE);

  const { passed, failures } = await runAll(client);
  const valueFailures = await checkValues(client);
  const blockingFailures = await checkBlocking(client);

  const allFailures = [...failures, ...valueFailures, ...blockingFailures];
  console.log('\n----------------------------------------------------------------------');
  console.log(`${passed} queries executed, ${allFailures.length} checks failed`);
  await client.end();
  process.exit(allFailures.length ? 1 : 0);
})();
