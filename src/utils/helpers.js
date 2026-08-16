export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const calculateAvgQueryTime = (queries) => {
  if (!queries || queries.length === 0) return 0;
  const total = queries.reduce((sum, q) => sum + (q.avg_time || 0), 0);
  return Math.round(total / queries.length);
};

export const processQueryResults = (data, dbConfig) => {
  let score = 100;
  const cacheHitRatio = data.cacheHitRatio || 0;
  
  if (cacheHitRatio < 95) score -= (95 - cacheHitRatio) * 2;
  
  const criticalIssues = [];
  const tableAnalysis = [];
  
  data.tables?.forEach(table => {
    const seqScanRatio = table.seq_scan_ratio || 0;
    const deadTupleRatio = table.dead_tuple_ratio || 0;
    
    let status = 'EXCELLENT';
    if (seqScanRatio > 50 || deadTupleRatio > 10) status = 'CRITICAL';
    else if (seqScanRatio > 20 || deadTupleRatio > 5) status = 'WARNING';
    else if (seqScanRatio > 10 || deadTupleRatio > 2) status = 'GOOD';
    
    tableAnalysis.push({
      table: table.tablename || table.relname, // Support both field names
      schema: table.schemaname,
      size: table.size,
      seqRatio: seqScanRatio,
      deadTuples: deadTupleRatio,
      status: status,
      rowCount: table.live_tuples,
      lastVacuum: table.last_vacuum,
      lastAnalyze: table.last_analyze
    });
    
    if (seqScanRatio > 50) {
      criticalIssues.push({
        severity: 'HIGH',
        table: `${table.schemaname}.${table.tablename}`,
        issue: `Sequential scan ratio: ${seqScanRatio}%`,
        impact: 'Queries may be slow due to full table scans',
        fix: `CREATE INDEX CONCURRENTLY idx_${table.tablename}_optimize ON ${table.schemaname}.${table.tablename}(column_name);`
      });
      score -= 10;
    }
    
    if (deadTupleRatio > 10) {
      criticalIssues.push({
        severity: 'HIGH',
        table: `${table.schemaname}.${table.tablename}`,
        issue: `Dead tuples: ${deadTupleRatio}%`,
        impact: 'Table bloat affecting performance',
        fix: `VACUUM ANALYZE ${table.schemaname}.${table.tablename};`
      });
      score -= 5;
    }
  });
  
  if (cacheHitRatio < 90) {
    criticalIssues.push({
      severity: 'MEDIUM',
      table: 'Global Cache',
      issue: `Cache hit ratio: ${cacheHitRatio}%`,
      impact: 'Excessive disk I/O operations',
      fix: `ALTER SYSTEM SET shared_buffers = '512MB'; SELECT pg_reload_conf();`
    });
  }
  
  const slowQueries = data.slowQueries?.map((q, idx) => ({
    queryId: idx + 1,
    query: q.query_preview,
    avgTime: q.avg_time,
    maxTime: q.max_time,
    calls: q.calls,
    totalTime: q.total_time,
    percentage: q.percentage
  })) || [];
  
  return {
    overallScore: Math.max(0, Math.round(score)),
    databaseInfo: {
      name: data.databaseInfo?.name || dbConfig.database,
      host: dbConfig.host,
      size: formatBytes(data.databaseInfo?.size || 0),
      version: data.databaseInfo?.version?.split(' ')[1] || 'PostgreSQL',
      connections: `${data.connections?.active || 0}/${data.databaseInfo?.max_connections || 100}`
    },
    performanceMetrics: {
      cacheHitRatio: cacheHitRatio,
      avgQueryTime: calculateAvgQueryTime(data.slowQueries),
      connectionUtilization: ((data.connections?.total || 0) / (data.databaseInfo?.max_connections || 100)) * 100,
      totalConnections: data.connections?.total || 0,
      activeConnections: data.connections?.active || 0,
      idleConnections: data.connections?.idle || 0
    },
    criticalIssues: criticalIssues,
    slowQueries: slowQueries,
    tableAnalysis: tableAnalysis,
    indexAnalysis: {
      used: data.indexes?.filter(idx => idx.index_scans > 0) || [],
      unused: data.indexes?.filter(idx => idx.index_scans === 0) || []
    },
    recommendations: generateRecommendations(criticalIssues, tableAnalysis, cacheHitRatio)
  };
};

const generateRecommendations = (issues, tables, cacheRatio) => {
  const immediate = [];
  const thisWeek = [];
  const thisMonth = [];
  
  issues.forEach(issue => {
    if (issue.severity === 'HIGH') {
      immediate.push(issue.fix.replace('CREATE INDEX CONCURRENTLY', 'Create index on').replace(';', ''));
    }
  });
  
  if (cacheRatio < 95) {
    thisWeek.push('Increase shared_buffers to improve cache hit ratio');
  }
  
  const bloatedTables = tables.filter(t => t.deadTuples > 5);
  if (bloatedTables.length > 0) {
    thisWeek.push(`Run VACUUM on ${bloatedTables.length} bloated tables`);
  }
  
  thisWeek.push('Set up automated statistics updates');
  thisWeek.push('Review and optimize slowest queries');
  
  thisMonth.push('Implement query performance monitoring');
  thisMonth.push('Set up automated backup verification');
  thisMonth.push('Review security policies and SSL configuration');
  
  return { immediate, thisWeek, thisMonth };
};