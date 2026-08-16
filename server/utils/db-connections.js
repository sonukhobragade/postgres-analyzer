/**
 * Database Connections Manager
 * Handles multiple PostgreSQL database connections
 */
const { Pool } = require('pg');
const os = require('os');

// Cache for connection pools
const connectionPools = {};

/**
 * Load all available database connections from environment variables
 * @returns {Object} Object containing connection configs
 */
const loadConnectionsFromEnv = () => {
  // Get current username for local connection
  const currentUser = os.userInfo().username;
  
  const connections = {
    // Add a local connection that should always work
    local: {
      name: 'Local PostgreSQL',
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      user: currentUser,
      password: '',
      ssl: false
    },
    default: {
      name: 'Default',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: {
        rejectUnauthorized: false
      }
    }
  };

  // Look for environment variables with pattern DBn_*
  // We'll scan up to 10 possible connections (DB1 through DB10)
  for (let i = 1; i <= 10; i++) {
    const prefix = `DB${i}_`;
    
    // Check if this connection is configured
    if (process.env[`${prefix}HOST`]) {
      connections[`db${i}`] = {
        name: process.env[`${prefix}NAME`] || `Database ${i}`,
        host: process.env[`${prefix}HOST`],
        port: parseInt(process.env[`${prefix}PORT`] || '5432'),
        database: process.env[`${prefix}DATABASE`],
        user: process.env[`${prefix}USER`] || 'postgres',
        password: process.env[`${prefix}PASSWORD`] || '',
        ssl: {
          rejectUnauthorized: false
        }
      };
    }
  }
  
  return connections;
};

/**
 * Get available connections without sensitive data like passwords
 * @returns {Object} Available connections without passwords
 */
const getAvailableConnections = () => {
  try {
    const connections = loadConnectionsFromEnv();
    
    // Validate connections object
    if (!connections || typeof connections !== 'object') {
      console.error('Invalid connections configuration:', connections);
      return {}; // Return empty object instead of null/undefined
    }
    
    // Remove sensitive data like passwords
    const safeConnections = {};
    
    for (const [id, config] of Object.entries(connections)) {
      // Skip any invalid connection configs
      if (!config || typeof config !== 'object') continue;
      
      safeConnections[id] = {
        name: config.name || 'Unnamed',
        host: config.host || 'localhost',
        port: config.port || 5432,
        database: config.database || 'postgres',
        user: config.user || 'postgres'
      };
    }
    
    return safeConnections;
  } catch (error) {
    console.error('Error in getAvailableConnections:', error);
    return {}; // Return empty object on error
  }
};

/**
 * Get a PostgreSQL connection pool for a specific connection ID
 * @param {string} connectionId - The connection ID
 * @returns {Pool} PostgreSQL connection pool
 */
const getConnectionPool = (connectionId = 'default') => {
  // If we already have this pool, return it
  if (connectionPools[connectionId]) {
    return connectionPools[connectionId];
  }
  
  // Get connection config
  const connections = loadConnectionsFromEnv();
  const config = connections[connectionId];
  
  if (!config) {
    throw new Error(`Connection ${connectionId} not found`);
  }
  
  console.log(`Creating new connection pool for ${connectionId}`);
  
  // Create a new pool with error handler
  const poolConfig = {
    ...config,
    connectionTimeoutMillis: 30000,
    max: 5,
    keepAlive: true,
    idleTimeoutMillis: 30000
  };
  
  
  const pool = new Pool(poolConfig);
  
  // Add enhanced error handler to detect proxy issues
  pool.on('error', (err, client) => {
    console.error(`Unexpected error on PostgreSQL client (${connectionId})`, err);
    
    // Check for proxy-related errors
    if (err.message.includes('proxy') || 
        err.message.includes('SSL') || 
        err.message.includes('certificate') || 
        err.code === 'ECONNREFUSED' || 
        err.message.includes('password authentication failed')) {
      console.error('Possible proxy interference detected with connection', connectionId);
      
      // Remove this pool from the cache so the next attempt will create a new connection
      delete connectionPools[connectionId];
    }
  });
  
  // Add connect handler
  pool.on('connect', (client) => {
    console.log(`New PostgreSQL client connected (${connectionId})`);
  });
  
  // Store in cache
  connectionPools[connectionId] = pool;
  
  return pool;
};

/**
 * Test a database connection
 * @param {string} connectionId - The connection ID to test
 * @returns {Promise<Object>} Connection test results
 */
const testConnection = async (connectionId = 'default') => {
  const startTime = Date.now();
  
  try {
    const pool = getConnectionPool(connectionId);
    const client = await pool.connect();
    
    const connectTime = Date.now() - startTime;
    
    // Run test query
    const queryStartTime = Date.now();
    const result = await client.query('SELECT NOW() as current_time, current_database(), version()');
    const queryTime = Date.now() - queryStartTime;
    
    // Release client
    client.release();
    
    // Get connection config (without password)
    const connections = loadConnectionsFromEnv();
    const { password, ...safeConfig } = connections[connectionId];
    
    return {
      success: true,
      connected: true,
      connectionId,
      serverTime: result.rows[0].current_time,
      database: result.rows[0].current_database,
      version: result.rows[0].version,
      diagnostics: {
        connectTimeMs: connectTime,
        queryTimeMs: queryTime,
        totalTimeMs: Date.now() - startTime,
        connectionConfig: safeConfig
      }
    };
  } catch (error) {
    console.error(`Connection test failed for ${connectionId}:`, error);
    
    // Determine the specific error type for better diagnostics
    let errorType = 'unknown';
    let suggestion = '';
    
    if (error.code === 'ECONNREFUSED') {
      errorType = 'connection_refused';
      suggestion = 'The database server is not accepting connections. Check if the server is running and network access is available.';
    } else if (error.code === 'ETIMEDOUT') {
      errorType = 'connection_timeout';
      suggestion = 'Connection timed out. This could be due to network issues or a security layer blocking the connection.';
    } else if (error.message.includes('password authentication')) {
      errorType = 'authentication_failed';
      suggestion = 'Password authentication failed. This could be due to incorrect credentials or a security layer modifying the connection.';
    } else if (error.message.includes('certificate')) {
      errorType = 'ssl_error';
      suggestion = 'SSL certificate validation failed. This could be due to SSL inspection.';
    }
    
    // Get connection config (without password)
    const connections = loadConnectionsFromEnv();
    const config = connections[connectionId] || {};
    const { password, ...safeConfig } = config;
    
    return {
      success: false,
      connected: false,
      connectionId,
      error: error.message,
      errorCode: error.code,
      errorType,
      suggestion,
      diagnostics: {
        connectionConfig: safeConfig
      }
    };
  }
};

module.exports = {
  getAvailableConnections,
  getConnectionPool,
  testConnection
};
