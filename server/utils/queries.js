const performanceQueries = {
  databaseInfo: `
    SELECT 
      current_database() as name,
      pg_database_size(current_database()) as size,
      version() as version,
      (SELECT setting FROM pg_settings WHERE name = 'max_connections') as max_connections
  `,
  
  cacheHitRatio: `
    SELECT 
      ROUND(
        (sum(blks_hit) * 100.0) / (sum(blks_hit) + sum(blks_read)), 2
      ) as cache_hit_ratio
    FROM pg_stat_database
    WHERE datname = current_database()
  `,
  
  tableStats: `
    SELECT 
      schemaname,
      relname as tablename,
      -- relid, not schemaname||'.'||relname. Concatenating the names produces
      -- an unquoted identifier, so a table called "Weird.Name" became
      -- weird.name and PostgreSQL rejected the whole query with
      -- "cross-database references are not implemented" — the entire table
      -- panel failed for every table because one table was named awkwardly.
      -- relid is the OID and needs no quoting.
      pg_size_pretty(pg_total_relation_size(relid)) as size,
      n_live_tup as live_tuples,
      n_dead_tup as dead_tuples,
      CASE 
        WHEN n_live_tup > 0 
        THEN ROUND((n_dead_tup * 100.0) / (n_live_tup + n_dead_tup), 2)
        ELSE 0 
      END as dead_tuple_ratio,
      seq_scan,
      idx_scan,
      CASE 
        WHEN (seq_scan + idx_scan) > 0 
        THEN ROUND((seq_scan * 100.0) / (seq_scan + idx_scan), 2)
        ELSE 0 
      END as seq_scan_ratio,
      last_vacuum,
      last_analyze,
      -- The primary-key recommendation reads this column. Without it every
      -- table looked like it had no primary key, because "undefined" is
      -- falsy, and the panel listed every table in the database.
      EXISTS (
        SELECT 1
        FROM pg_index i
        WHERE i.indrelid = relid
          AND i.indisprimary
      ) as has_primary_key
    FROM pg_stat_user_tables 
    ORDER BY pg_total_relation_size(relid) DESC
    LIMIT 20
  `,
  
  slowQueries: `
    SELECT 
      query as query_full,
      LEFT(query, 100) || '...' as query_preview,
      calls,
      ROUND(total_exec_time::numeric, 2) as total_time,
      ROUND(mean_exec_time::numeric, 2) as avg_time,
      ROUND(max_exec_time::numeric, 2) as max_time,
      ROUND((100.0 * total_exec_time / sum(total_exec_time) OVER())::numeric, 2) as percentage
    FROM pg_stat_statements 
    WHERE calls > 10
    ORDER BY total_exec_time DESC 
    LIMIT 100
  `,
  
  partitioningInfo: `
    SELECT
      nmsp_parent.nspname AS parent_schema,
      parent.relname AS parent_table,
      nmsp_child.nspname AS child_schema,
      child.relname AS child_table,
      pg_get_expr(child.relpartbound, child.oid) AS partition_expression,
      pg_size_pretty(pg_table_size(child.oid)) AS partition_size
    FROM pg_inherits
    JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
    JOIN pg_class child ON pg_inherits.inhrelid = child.oid
    JOIN pg_namespace nmsp_parent ON nmsp_parent.oid = parent.relnamespace
    JOIN pg_namespace nmsp_child ON nmsp_child.oid = child.relnamespace
    WHERE parent.relkind = 'p'
    ORDER BY parent_schema, parent_table, child_schema, child_table
  `,
  
  // Uses pg_blocking_pids(), available since PostgreSQL 9.6.
  //
  // This replaces the twelve-way self-join on pg_locks that is widely copied
  // from the wiki. Two problems with that join, both confirmed against a live
  // server with one real blocker and two waiters:
  //
  //   1. It never required the blocking lock to be GRANTED, so two sessions
  //      both WAITING on the same lock matched each other and each was
  //      reported as blocking the other.
  //   2. Even with that fixed, it reported the waiting QUEUE rather than the
  //      cause: a waiter holds a transient tuple lock while it waits, so the
  //      second waiter appeared to be blocked by the first. The output named a
  //      session that was itself stuck as the thing to go and kill.
  //
  // pg_blocking_pids() answers the question actually being asked: which
  // sessions is this one waiting on.
  blockingQueries: `
    SELECT
      blocked_activity.pid AS blocked_pid,
      blocked_activity.usename AS blocked_user,
      blocked_activity.client_addr AS blocked_client_addr,
      blocked_activity.application_name AS blocked_application,
      blocked_activity.state AS blocked_state,
      blocked_activity.query AS blocked_query,
      blocking_activity.pid AS blocking_pid,
      blocking_activity.usename AS blocking_user,
      blocking_activity.client_addr AS blocking_client_addr,
      blocking_activity.application_name AS blocking_application,
      blocking_activity.state AS blocking_state,
      blocking_activity.query AS blocking_query,
      -- How long the blocked session has been WAITING (state_change), not how
      -- long the blocker has been running. The old column read
      -- now() - blocking_activity.query_start, which is a different quantity
      -- and is not the impact of the block.
      EXTRACT(EPOCH FROM (NOW() - blocked_activity.state_change)) AS blocked_duration_seconds,
      EXTRACT(EPOCH FROM (NOW() - blocking_activity.query_start)) AS blocking_query_age_seconds,
      -- True when the blocker is itself waiting on someone else, so a reader
      -- can tell a root cause from a link in the chain.
      cardinality(pg_blocking_pids(blocking_activity.pid)) > 0 AS blocker_is_also_blocked
    FROM pg_stat_activity AS blocked_activity
    CROSS JOIN LATERAL unnest(pg_blocking_pids(blocked_activity.pid)) AS blocking_pid_list(pid)
    JOIN pg_stat_activity AS blocking_activity
      ON blocking_activity.pid = blocking_pid_list.pid
    WHERE cardinality(pg_blocking_pids(blocked_activity.pid)) > 0
    ORDER BY blocked_duration_seconds DESC
  `,

  indexUsage: `
    SELECT 
      schemaname,
      relname as tablename,
      indexrelname as indexname,
      idx_scan as index_scans,
      pg_size_pretty(pg_relation_size(indexrelid)) as index_size
    FROM pg_stat_user_indexes 
    -- Ascending, not descending. The UI splits this result into used and
    -- unused indexes, but unused ones have idx_scan = 0 and sorted last, so
    -- "DESC ... LIMIT 20" excluded exactly the indexes the unused panel
    -- exists to show. Largest first within the unused group, since a big
    -- never-scanned index is the one worth dropping.
    ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC
    LIMIT 50
  `,
  
  connectionStats: `
    SELECT 
      count(*) as total,
      count(*) FILTER (WHERE state = 'active') as active,
      count(*) FILTER (WHERE state = 'idle') as idle,
      count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
      count(*) FILTER (WHERE backend_start > (now() - interval '5 minutes')) as new_connections,
      count(*) FILTER (WHERE state = 'active') as active_connections,
      -- state_change, not backend_start: how long it has been idle, not how
      -- long ago it connected. A pooled connection opened two days ago and
      -- reused every second was counted as stale.
      count(*) FILTER (
        WHERE state = 'idle' AND state_change < (now() - interval '1 day')
      ) as stale_connections,
      -- xact_start, not backend_start: how long the TRANSACTION has been open.
      -- Keyed off the connection age, a long-lived pooled connection that had
      -- just opened a transaction was reported as hung, while a connection
      -- opened a minute ago holding a transaction for that whole minute was
      -- not. The second one is the problem; the first is normal.
      count(*) FILTER (
        WHERE state = 'idle in transaction' AND xact_start < (now() - interval '1 hour')
      ) as hung_transactions
    FROM pg_stat_activity 
    WHERE pid <> pg_backend_pid()
      -- Client connections only. PostgreSQL's own background workers
      -- (checkpointer, walwriter, autovacuum launcher) appear here with a NULL
      -- state, so an idle server reported five connections of which none were
      -- active and none idle: a total that matched nothing beneath it.
      AND backend_type = 'client backend'
  `,
  
  lockStats: `
    SELECT 
      mode,
      count(*) as count
    FROM pg_locks 
    GROUP BY mode
    ORDER BY count DESC
  `,
  
  userStats: `
    SELECT 
      usename,
      count(*) as connection_count,
      string_agg(DISTINCT client_addr::text, ', ') as client_addr,
      string_agg(DISTINCT application_name, ', ') as application_name
    FROM pg_stat_activity
    WHERE pid <> pg_backend_pid()
    GROUP BY usename
    ORDER BY connection_count DESC
  `
};

module.exports = { performanceQueries };