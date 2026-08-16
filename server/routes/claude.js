const express = require('express');
const { Pool } = require('pg');
const { performanceQueries } = require('../utils/queries');
const { getConnectionPool } = require('../utils/db-connections');

const router = express.Router();

// We now use the connection manager instead of hardcoding connection config



// Endpoint for Claude to get database analysis
router.post('/analyze-for-claude', async (req, res) => {
  try {
    // Get connection ID from request body or use 'default' if not specified
    const connectionId = req.body.connectionId || 'default';
    
    console.log(`Using database connection: ${connectionId}`);
    const pool = getConnectionPool(connectionId);
    const client = await pool.connect();
    
    // Execute performance analysis
    const results = {};
    
    // Database info
    const dbInfo = await client.query(performanceQueries.databaseInfo);
    results.databaseInfo = dbInfo.rows[0];
    
    // Cache hit ratio
    const cacheHit = await client.query(performanceQueries.cacheHitRatio);
    results.cacheHitRatio = parseFloat(cacheHit.rows[0]?.cache_hit_ratio || 0);
    
    // Table statistics
    const tables = await client.query(performanceQueries.tableStats);
    results.tables = tables.rows;
    
    // Check for pg_stat_statements
    const extensionCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
      ) as has_pg_stat_statements
    `);
    
    const hasStatStatements = extensionCheck.rows[0].has_pg_stat_statements;
    
    if (hasStatStatements) {
      const slowQueries = await client.query(performanceQueries.slowQueries);
      results.slowQueries = slowQueries.rows;
    } else {
      results.slowQueries = [];
    }
    
    // Index usage
    const indexes = await client.query(performanceQueries.indexUsage);
    results.indexes = indexes.rows;
    
    // Connection stats
    const connections = await client.query(performanceQueries.connectionStats);
    results.connections = connections.rows[0];
    
    // Get table partitioning info
    try {
      const partitionsData = await client.query(performanceQueries.partitioningInfo);
      results.partitions = partitionsData.rows;
    } catch (err) {
      console.log('Error fetching partition info:', err.message);
      results.partitions = [];
    }
    
    // Get blocking queries info
    try {
      const blockingQueries = await client.query(performanceQueries.blockingQueries);
      results.blockingQueries = blockingQueries.rows;
    } catch (err) {
      console.log('Error fetching blocking queries:', err.message);
      results.blockingQueries = [];
    }
    
    // Get user connection stats
    try {
      const userStats = await client.query(performanceQueries.userStats);
      results.users = userStats.rows;
    } catch (err) {
      console.log('Error fetching user stats:', err.message);
      results.users = [];
    }
    
    // Get active connections
    try {
      const activeConnections = await client.query(`
        SELECT 
          pid,
          usename,
          client_addr,
          application_name,
          state,
          query,
          EXTRACT(EPOCH FROM (NOW() - query_start))::INTEGER AS duration
        FROM pg_stat_activity
        WHERE pid <> pg_backend_pid()
        ORDER BY state, duration DESC
      `);
      results.activeConnections = activeConnections.rows;
    } catch (err) {
      console.log('Error fetching active connections:', err.message);
      results.activeConnections = [];
    }
    
    client.release();
    // Don't end the pool here as it's a singleton that should be reused
    
    console.log('Analysis completed successfully.');
    console.log('Results summary:', {
      tablesCount: results.tables?.length,
      slowQueriesCount: results.slowQueries?.length,
      indexesCount: results.indexes?.length,
      cacheHitRatio: results.cacheHitRatio
    });
    
    const response = {
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
      environment: 'PostgreSQL',
      hasStatStatements
    };
    
    console.log('Sending response structure:', Object.keys(response));
    res.json(response);
    
  } catch (error) {
    console.error('Analysis error:', error);
    
    // Check for proxy interference
    const isProxyError = 
      typeof error.message === 'string' && 
      (error.message.includes('Proxy') || 
       error.message.includes('HTML') || 
       error.message.includes('<!DOCTYPE') ||
       error.message.includes('<html'));
    
    const errorMessage = isProxyError ? 
      'Connection blocked by a proxy. Please ensure you have direct database access.' : 
      error.message;
      
    const suggestion = isProxyError ?
      'Try connecting through a VPN or request network access to this database endpoint.' :
      'Check the database connection details and ensure the PostgreSQL server is running.';
    
    res.status(500).json({
      success: false,
      message: 'Failed to analyze the database',
      error: errorMessage,
      isProxyError: isProxyError,
      suggestion: suggestion
    });
  }
});

/**
 * Endpoint to get connection details
 * Returns configured connections with credentials stripped.
 */
router.get('/connections', (req, res) => {
  try {
    const { getAvailableConnections } = require('../utils/db-connections');
    const connections = getAvailableConnections();
    
    res.json({
      success: true,
      data: connections
    });
  } catch (error) {
    console.error('Error getting connection details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get connection details',
      details: error.message
    });
  }
});

/**
 * Health check endpoint for PostgreSQL connection
 * Provides detailed diagnostics for troubleshooting
 */
router.get('/health', async (req, res) => {
  // Get connection ID from query parameter or use default
  const connectionId = req.query.connectionId || 'default';
  console.log(`Health check requested for connection: ${connectionId}`);
  
  try {
    const { testConnection } = require('../utils/db-connections');
    const result = await testConnection(connectionId);
    
    console.log('Health check result:', result);
    res.json(result);
  } catch (error) {
    console.error(`Health check failed for connection ${connectionId}:`, error);
    
    res.status(500).json({
      success: false,
      connected: false,
      connectionId,
      error: error.message,
      errorCode: error.code || 'unknown'
    });
  }
});

module.exports = router;
