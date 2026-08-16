/**
 * Tests for the analysis helpers.
 *
 * processQueryResults turns raw catalogue rows into the health score, the
 * critical-issue list and the recommendations the whole UI renders. Every
 * number a user sees comes from here, so the thresholds are pinned explicitly:
 * a silent change to one of them re-grades every database this tool has ever
 * reported on.
 */

import {
  formatBytes,
  calculateAvgQueryTime,
  processQueryResults,
} from './helpers';

const dbConfig = { host: 'db.example.test', database: 'appdb' };

/** A table row in the shape server/utils/queries.js tableStats returns. */
const table = (overrides = {}) => ({
  schemaname: 'public',
  tablename: 'orders',
  size: '1 GB',
  live_tuples: 1000,
  seq_scan_ratio: 0,
  dead_tuple_ratio: 0,
  has_primary_key: true,
  ...overrides,
});

const payload = (overrides = {}) => ({
  cacheHitRatio: 99,
  tables: [],
  slowQueries: [],
  indexes: [],
  connections: { total: 10, active: 4, idle: 6 },
  databaseInfo: { name: 'appdb', size: 1024, version: 'PostgreSQL 16.2', max_connections: 100 },
  ...overrides,
});

describe('formatBytes', () => {
  test('reports zero without a unit calculation', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  test.each([
    [512, '512 B'],
    [1024, '1 KB'],
    [1536, '1.5 KB'],
    [1048576, '1 MB'],
    [1073741824, '1 GB'],
  ])('formats %i as %s', (input, expected) => {
    expect(formatBytes(input)).toBe(expected);
  });

  test('rounds to two decimal places', () => {
    expect(formatBytes(1234567)).toBe('1.18 MB');
  });
});

describe('calculateAvgQueryTime', () => {
  test('averages the supplied times', () => {
    expect(calculateAvgQueryTime([{ avg_time: 10 }, { avg_time: 20 }])).toBe(15);
  });

  test('returns zero for an empty list rather than NaN', () => {
    // A NaN here renders as "NaN ms" in the performance panel.
    expect(calculateAvgQueryTime([])).toBe(0);
  });

  test('returns zero when the list is missing entirely', () => {
    expect(calculateAvgQueryTime(undefined)).toBe(0);
  });

  test('treats a missing avg_time as zero rather than propagating undefined', () => {
    expect(calculateAvgQueryTime([{ avg_time: 10 }, {}])).toBe(5);
  });
});

describe('processQueryResults — health score', () => {
  test('a clean database scores 100', () => {
    expect(processQueryResults(payload(), dbConfig).overallScore).toBe(100);
  });

  test('a poor cache hit ratio reduces the score', () => {
    const result = processQueryResults(payload({ cacheHitRatio: 90 }), dbConfig);
    expect(result.overallScore).toBeLessThan(100);
  });

  test('the score never goes below zero', () => {
    // Otherwise a badly degraded database reports a negative percentage.
    const tables = Array.from({ length: 40 }, (_, i) =>
      table({ tablename: `t${i}`, seq_scan_ratio: 99, dead_tuple_ratio: 99 }));
    const result = processQueryResults(payload({ cacheHitRatio: 0, tables }), dbConfig);
    expect(result.overallScore).toBe(0);
  });
});

describe('processQueryResults — table status thresholds', () => {
  const statusFor = (overrides) =>
    processQueryResults(payload({ tables: [table(overrides)] }), dbConfig)
      .tableAnalysis[0].status;

  test('a healthy table is EXCELLENT', () => {
    expect(statusFor({ seq_scan_ratio: 5, dead_tuple_ratio: 1 })).toBe('EXCELLENT');
  });

  test.each([
    [{ seq_scan_ratio: 11 }, 'GOOD'],
    [{ seq_scan_ratio: 21 }, 'WARNING'],
    [{ seq_scan_ratio: 51 }, 'CRITICAL'],
    [{ dead_tuple_ratio: 3 }, 'GOOD'],
    [{ dead_tuple_ratio: 6 }, 'WARNING'],
    [{ dead_tuple_ratio: 11 }, 'CRITICAL'],
  ])('%o is graded %s', (overrides, expected) => {
    expect(statusFor(overrides)).toBe(expected);
  });

  test('the worse of the two ratios decides the grade', () => {
    expect(statusFor({ seq_scan_ratio: 5, dead_tuple_ratio: 11 })).toBe('CRITICAL');
  });
});

describe('processQueryResults — critical issues', () => {
  test('a high sequential scan ratio is reported with the table name', () => {
    const result = processQueryResults(
      payload({ tables: [table({ seq_scan_ratio: 80 })] }), dbConfig);
    const issue = result.criticalIssues.find(i => i.issue.includes('Sequential scan'));
    expect(issue).toBeDefined();
    expect(issue.table).toBe('public.orders');
    expect(issue.severity).toBe('HIGH');
  });

  test('table bloat is reported', () => {
    const result = processQueryResults(
      payload({ tables: [table({ dead_tuple_ratio: 25 })] }), dbConfig);
    expect(result.criticalIssues.some(i => i.issue.includes('Dead tuples'))).toBe(true);
  });

  test('a cache hit ratio below 90 is reported globally', () => {
    const result = processQueryResults(payload({ cacheHitRatio: 85 }), dbConfig);
    expect(result.criticalIssues.some(i => i.table === 'Global Cache')).toBe(true);
  });

  test('a healthy database reports no critical issues', () => {
    expect(processQueryResults(payload(), dbConfig).criticalIssues).toEqual([]);
  });
});

describe('processQueryResults — index split', () => {
  test('separates scanned indexes from never-scanned ones', () => {
    const result = processQueryResults(payload({
      indexes: [
        { indexname: 'used_idx', index_scans: 42 },
        { indexname: 'never_idx', index_scans: 0 },
      ],
    }), dbConfig);
    expect(result.indexAnalysis.used.map(i => i.indexname)).toEqual(['used_idx']);
    expect(result.indexAnalysis.unused.map(i => i.indexname)).toEqual(['never_idx']);
  });
});

describe('processQueryResults — missing data', () => {
  test('an empty response does not throw', () => {
    expect(() => processQueryResults({}, dbConfig)).not.toThrow();
  });

  test('falls back to the configured database name', () => {
    const result = processQueryResults({}, dbConfig);
    expect(result.databaseInfo.name).toBe('appdb');
  });

  test('missing connection counts do not produce NaN utilisation', () => {
    const result = processQueryResults({}, dbConfig);
    expect(Number.isNaN(result.performanceMetrics.connectionUtilization)).toBe(false);
  });
});
