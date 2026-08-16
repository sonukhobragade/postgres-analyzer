const express = require('express');
const { Pool } = require('pg');
const { performanceQueries } = require('../utils/queries');
const dotenv = require('dotenv');

// Ensure environment variables are loaded
dotenv.config();

const router = express.Router();

// Test database connection
router.post('/test-connection', async (req, res) => {
  const { host, port, database, username, password } = req.body;
  
  const pool = new Pool({
    host,
    port: parseInt(port),
    database,
    user: username,
    password,
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    await pool.end();
    
    res.json({ success: true, message: 'Connection successful' });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: 'Connection failed', 
      error: error.message 
    });
  }
});

// Analyze database performance
router.post('/analyze', async (req, res) => {
  const { host, port, database, username, password } = req.body;
  
  // Create a pool with the provided credentials
  
  const pool = new Pool({
    host,
    port: parseInt(port),
    database,
    user: username,
    password,
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();
    
    // Execute all performance queries
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
    
    // Check if pg_stat_statements extension is available
    try {
      const extensionCheck = await client.query(`
        SELECT count(*) as count FROM pg_extension WHERE extname = 'pg_stat_statements'
      `);
      
      if (parseInt(extensionCheck.rows[0].count) > 0) {
        // Extension exists, run the slow queries analysis
        const slowQueries = await client.query(performanceQueries.slowQueries);
        results.slowQueries = slowQueries.rows;
      } else {
        // Extension doesn't exist, provide a helpful message
        results.slowQueries = [{
          query_preview: 'pg_stat_statements extension is not enabled. Enable it with: CREATE EXTENSION pg_stat_statements;',
          calls: 0,
          total_time: 0,
          avg_time: 0,
          max_time: 0,
          percentage: 0
        }];
        console.log('pg_stat_statements extension not available');
      }
    } catch (error) {
      // Handle any errors during the extension check
      console.error('Error checking for pg_stat_statements extension:', error);
      results.slowQueries = [{
        query_preview: 'Could not check for pg_stat_statements extension. Error: ' + error.message,
        calls: 0,
        total_time: 0,
        avg_time: 0,
        max_time: 0,
        percentage: 0
      }];
    }
    
    // Index usage
    const indexes = await client.query(performanceQueries.indexUsage);
    results.indexes = indexes.rows;
    
    // Connection stats
    const connections = await client.query(performanceQueries.connectionStats);
    results.connections = connections.rows[0];
    
    // Locks
    try {
      const locks = await client.query(performanceQueries.lockStats);
      results.locks = locks.rows;
    } catch (locksError) {
      console.error("Error getting locks information:", locksError);
      results.locks = [];
    }
    
    // Partitioning information
    try {
      const partitioning = await client.query(performanceQueries.partitioningInfo);
      results.partitioning = partitioning.rows;
    } catch (partitionError) {
      console.error("Error getting partition information:", partitionError);
      results.partitioning = [];
    }
    
    // Blocking queries
    try {
      const blockingQueries = await client.query(performanceQueries.blockingQueries);
      results.blockingQueries = blockingQueries.rows;
    } catch (blockingError) {
      console.error("Error getting blocking queries:", blockingError);
      results.blockingQueries = [];
    }
    
    // User statistics
    try {
      const users = await client.query(performanceQueries.userStats);
      results.users = users.rows;
    } catch (usersError) {
      console.error("Error getting user statistics:", usersError);
      results.users = [];
    }
    
    client.release();
    await pool.end();
    
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Analysis failed', 
      error: error.message 
    });
  }
});

// Direct analyze endpoint using environment variables
router.get('/direct-analyze', async (req, res) => {
  // Origin and method only. Logging req.headers wholesale wrote every header
  // to stdout, which now includes the x-api-token used to authenticate this
  // very request — and any Authorization header a proxy adds in front of it.
  // Credentials in logs outlive the request and end up wherever logs go.
  console.log(`Direct analyze endpoint called (${req.method} from ${req.headers.origin || 'no origin'})`);
  
  console.log('Attempting to connect with env variables:', {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER
  });

  // Use environment variables for connection
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionTimeoutMillis: parseInt(process.env.DB_TIMEOUT || '10000'),
    // Add SSL options for PostgreSQL with more detailed configuration
    ssl: process.env.DB_USE_SSL === 'true' ? {
      rejectUnauthorized: false,
      // Add more detailed logging for SSL connection
      sslmode: 'require'
    } : false,
  });

  try {
    console.log('Attempting to connect with env variables:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      // Password hidden for security
      ssl: process.env.DB_USE_SSL === 'true' ? 'enabled' : 'disabled'
    });
    
    // Log the full connection config for debugging
    console.log('Full connection config:', {
      ...pool.options,
      // Hide actual password
      password: '***HIDDEN***'
    });
    
    // Test connection with a simple query first
    console.log('Testing connection with a simple query...');
    
    const client = await pool.connect();
    console.log('Database connection successful');
    
    // Execute all performance queries
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
    
    // Check if pg_stat_statements extension is available
    try {
      const extensionCheck = await client.query(`
        SELECT count(*) as count FROM pg_extension WHERE extname = 'pg_stat_statements'
      `);
      
      if (parseInt(extensionCheck.rows[0].count) > 0) {
        // Extension exists, run the slow queries analysis
        const slowQueries = await client.query(performanceQueries.slowQueries);
        results.slowQueries = slowQueries.rows;
      } else {
        // Extension doesn't exist, provide a helpful message
        results.slowQueries = [{
          query_preview: 'pg_stat_statements extension is not enabled. Enable it with: CREATE EXTENSION pg_stat_statements;',
          calls: 0,
          total_time: 0,
          avg_time: 0,
          max_time: 0,
          percentage: 0
        }];
        console.log('pg_stat_statements extension not available');
      }
    } catch (error) {
      // Handle any errors during the extension check
      console.error('Error checking for pg_stat_statements extension:', error);
      results.slowQueries = [{
        query_preview: 'Could not check for pg_stat_statements extension. Error: ' + error.message,
        calls: 0,
        total_time: 0,
        avg_time: 0,
        max_time: 0,
        percentage: 0
      }];
    } // Closing brace for pg_stat_statements extension check
    
    // Partitioning information
    try {
      const partitioning = await client.query(performanceQueries.partitioningInfo);
      results.partitioning = partitioning.rows;
    } catch (partitionError) {
      console.error("Error getting partition information:", partitionError);
      results.partitioning = [];
    }
    
    // Blocking queries
    try {
      const blockingQueries = await client.query(performanceQueries.blockingQueries);
      results.blockingQueries = blockingQueries.rows;
    } catch (blockingError) {
      console.error("Error getting blocking queries:", blockingError);
      results.blockingQueries = [];
    }
    
    // Index usage
    const indexes = await client.query(performanceQueries.indexUsage);
    results.indexes = indexes.rows;
    
    // Connection stats
    const connections = await client.query(performanceQueries.connectionStats);
    results.connections = connections.rows[0];
    
    // Locks
    const locks = await client.query(performanceQueries.lockStats);
    results.locks = locks.rows;
    
    client.release();
    await pool.end();
    
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Direct analysis error:', error);
    
    // Extract detailed error information
    const errorDetails = {
      message: error.message,
      code: error.code,
      detail: error.detail || null,
      hint: error.hint || null,
      position: error.position || null,
      file: error.file || null,
      line: error.line || null,
      routine: error.routine || null
    };
    
    res.status(500).json({ 
      success: false, 
      message: 'Analysis failed', 
      error: error.message,
      details: error,
      // These are the SERVER's own environment values, not anything the
      // caller supplied, so returning them tells whoever asked the hostname
      // and username of a database they may know nothing about. Off unless
      // explicitly enabled. (The equivalent block further down echoes the
      // connection details from the request body, which the caller already
      // has, and is left alone.)
      ...(process.env.DEBUG_CONNECTION_DETAILS === 'true' ? {
        config: {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT,
          database: process.env.DB_NAME,
          user: process.env.DB_USER,
          // Password hidden for security
          ssl: process.env.DB_USE_SSL === 'true' ? 'enabled' : 'disabled'
        },
        troubleshooting: {
          suggestions: [
            'Verify the database credentials are correct',
            'Check if the PostgreSQL instance is running',
            'Ensure the IP address of this server is allowed in firewall rules',
            'Verify SSL settings are appropriate for your PostgreSQL instance',
            'Try connecting with psql command line tool to isolate the issue'
          ],
          command: `PGPASSWORD="your_password" psql -h ${process.env.DB_HOST} -p ${process.env.DB_PORT} -U ${process.env.DB_USER} -d ${process.env.DB_NAME} -c "SELECT 1"`
        }
      } : {
        troubleshooting: {
          suggestions: [
            'Verify the database credentials are correct',
            'Check if the PostgreSQL instance is running',
            'Ensure the IP address of this server is allowed in firewall rules',
            'Verify SSL settings are appropriate for your PostgreSQL instance',
            'Set DEBUG_CONNECTION_DETAILS=true to include the resolved connection settings here'
          ]
        }
      })
    });
  }
});

// POST endpoint for direct analysis with connection parameters in request body
router.post('/direct-analyze-with-params', async (req, res) => {
  // Same reasoning as the GET route above: never log the header bag, it
  // carries the API token.
  console.log(`Direct analyze with params called (${req.method} from ${req.headers.origin || 'no origin'})`);
  
  // Extract connection parameters from request body
  const { host, port, database, username, password, useSSL } = req.body;
  
  console.log('Attempting to connect with provided parameters:', {
    host,
    port,
    database,
    user: username,
    // Password hidden for security
    ssl: useSSL ? 'enabled' : 'disabled'
  });

  // Log connection attempt details
  console.log('Connection attempt details:');
  console.log('- Host:', host);
  console.log('- Port:', port);
  console.log('- Database:', database);
  console.log('- User:', username);
  console.log('- Password length:', password ? password.length : 0);
  console.log('- SSL enabled:', useSSL);
  
  // Determine if this is a local or remote connection
  const isLocalConnection = host === 'localhost' || host === '127.0.0.1';
  console.log('Connection type:', isLocalConnection ? 'LOCAL' : 'REMOTE');
  
  // Create a connection pool with appropriate settings based on connection type
  let pool;
  
  if (isLocalConnection) {
    // Local connection - simpler configuration
    console.log('Using local connection configuration...');
    pool = new Pool({
      host,
      port: parseInt(port),
      database,
      user: username,
      password,
      connectionTimeoutMillis: parseInt(process.env.DB_TIMEOUT || '10000'),
      ssl: false // No SSL for local connections
    });
  } else {
    // Remote connection - try multiple approaches
    console.log('Using remote connection configuration...');
    
    // Try to work around potential proxy issues
    if (useSSL) {
      console.log('Configuring with SSL and proxy workarounds...');
      pool = new Pool({
        host,
        port: parseInt(port),
        database,
        user: username,
        password,
        connectionTimeoutMillis: parseInt(process.env.DB_TIMEOUT || '10000'),
        ssl: {
          rejectUnauthorized: false,
          checkServerIdentity: () => undefined // Bypass server identity check
        }
      });
    } else {
      console.log('Configuring without SSL...');
      pool = new Pool({
        host,
        port: parseInt(port),
        database,
        user: username,
        password,
        connectionTimeoutMillis: parseInt(process.env.DB_TIMEOUT || '10000'),
        ssl: false
      });
    }
    
    // Set environment variables as a backup approach
    process.env.PGHOST = host;
    process.env.PGPORT = port;
    process.env.PGDATABASE = database;
    process.env.PGUSER = username;
    process.env.PGPASSWORD = password;
  }
  
  console.log('Connection details:', {
    host,
    port,
    database,
    user: username,
    // Password hidden
    ssl: false
  });
  
  console.log('Connection string format would be:', 
    `postgresql://${username}:${password ? '****' : ''}@${host}:${port}/${database}`);
  console.log('Attempting connection with SSL mode: disabled');

  try {
    // Test connection with a simple query first
    console.log('Testing connection with a simple query...');
    
    const client = await pool.connect();
    console.log('Database connection successful');
    
    // Initialize results object
    const results = {};
    
    // Database info
    const dbInfo = await client.query(performanceQueries.databaseInfo);
    results.dbInfo = dbInfo.rows[0];
    
    // Cache hit ratio
    // Partitioning information
    try {
      const partitioning = await client.query(performanceQueries.partitioningInfo);
      results.partitioning = partitioning.rows;
    } catch (partitionError) {
      console.error("Error getting partition information:", partitionError);
      results.partitioning = [];
    }
    
    // Blocking queries
    try {
      const blockingQueries = await client.query(performanceQueries.blockingQueries);
      results.blockingQueries = blockingQueries.rows;
    } catch (blockingError) {
      console.error("Error getting blocking queries:", blockingError);
      results.blockingQueries = [];
    }
    const cacheHit = await client.query(performanceQueries.cacheHitRatio);
    results.cacheHit = cacheHit.rows[0];
    
    // Table stats
    const tableStats = await client.query(performanceQueries.tableStats);
    results.tableStats = tableStats.rows;
    
    // Check if pg_stat_statements extension is available
    const checkExtension = await client.query(
      "SELECT COUNT(*) FROM pg_extension WHERE extname = 'pg_stat_statements'"
    );
    const extensionExists = parseInt(checkExtension.rows[0].count) > 0;
    
    // Slow queries (using pg_stat_statements if available)
    if (extensionExists) {
      console.log('pg_stat_statements extension is available, getting slow queries...');
      const slowQueries = await client.query(performanceQueries.slowQueries);
      results.slowQueries = slowQueries.rows;
    } else {
      console.log('pg_stat_statements extension is not available, skipping slow queries analysis');
      results.slowQueries = [{
        query: 'pg_stat_statements extension is not installed or enabled. Enable it for slow query analysis.',
        calls: 0,
        total_time: 0,
        mean_time: 0,
        max_time: 0,
        percentage: 0
      }];
    }
    
    // Index usage
    const indexes = await client.query(performanceQueries.indexUsage);
    results.indexes = indexes.rows;
    
    // Connection stats
    const connections = await client.query(performanceQueries.connectionStats);
    results.connections = connections.rows[0];
    
    // Locks
    const locks = await client.query(performanceQueries.lockStats);
    results.locks = locks.rows;
    
    client.release();
    await pool.end();
    
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Direct analysis with params error:', error);
    
    // Extract detailed error information
    const errorDetails = {
      message: error.message,
      code: error.code,
      detail: error.detail || null,
      hint: error.hint || null,
      position: error.position || null,
      file: error.file || null,
      line: error.line || null,
      routine: error.routine || null
    };
    
    // Check for specific PostgreSQL error codes
    if (error.code === '28P01') {
      console.error('Authentication failed. Please check your username and password.');
      console.error('Hint: Make sure the password does not contain any special characters that need escaping.');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      console.error('Connection error. Please check if the host is reachable and the port is correct.');
      console.error('Hint: Make sure the PostgreSQL instance is running and network access is properly configured.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused. The server may not be running or the port may be blocked.');
      console.error('Hint: Check firewall rules and make sure the PostgreSQL server is accepting connections.');
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Analysis failed', 
      error: error.message,
      details: errorDetails,
      config: {
        host,
        port,
        database,
        user: username,
        // Password hidden for security
        ssl: useSSL ? 'enabled' : 'disabled'
      },
      troubleshooting: {
        suggestions: [
          'Verify the database credentials are correct',
          'Check if the PostgreSQL instance is running',
          'Ensure the IP address of this server is allowed in firewall rules',
          'Verify SSL settings are appropriate for your PostgreSQL instance',
          'Try connecting with psql command line tool to isolate the issue'
        ],
        command: `PGPASSWORD="your_password" psql -h ${host} -p ${port} -U ${username} -d ${database} -c "SELECT 1"`
      }
    });
  }
});

// Endpoint to get database connection config from environment variables.
//
// The password is deliberately NOT returned. It used to be, which contradicted
// the README's claim that passwords are stripped from responses, and this
// route is unauthenticated, so anything it returns is readable by any client
// that can reach the server. The UI only needs to know whether a password is
// configured, not what it is.
router.get('/connection-config', (req, res) => {
  try {
    res.json({
      success: true,
      config: {
        host: process.env.DB_HOST || '',
        port: process.env.DB_PORT || '5432',
        database: process.env.DB_NAME || '',
        user: process.env.DB_USER || '',
        hasPassword: Boolean(process.env.DB_PASSWORD)
      }
    });
  } catch (error) {
    console.error('Error getting connection config:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get connection configuration', 
      error: error.message 
    });
  }
});

module.exports = router;