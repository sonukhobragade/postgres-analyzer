/**
 * Database Connections Router
 * Handles API endpoints for managing database connections
 */
const express = require('express');
const { 
  getAvailableConnections,
  testConnection
} = require('../utils/db-connections');

const router = express.Router();

/**
 * Get available database connections
 * Returns a list of configured database connections without sensitive data
 */
router.get('/', (req, res) => {
  try {
    // Force the local connection to always be available first
    // This ensures we have at least one working connection even if the remote one fails
    const connections = getAvailableConnections();
    
    // Add debug logging
    console.log(`Retrieved ${Object.keys(connections).length} connections`);
    
    // Ensure we have at least one connection
    if (!connections || Object.keys(connections).length === 0) {
      // Create a fallback local connection if none exist
      const username = require('os').userInfo().username;
      connections.local = {
        name: 'Local PostgreSQL',
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        user: username
      };
    }
    
    // Always return a valid JSON response
    res.json({
      success: true,
      connections: connections
    });
  } catch (error) {
    // Log detailed error info
    console.error('Error getting connections:', error);
    
    // Send a properly structured error response
    res.status(500).json({
      success: false,
      error: 'Failed to get database connections',
      message: error.message || 'Unknown error occurred',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Test a specific database connection
 * @param {string} connectionId - The connection ID to test
 */
router.get('/test/:connectionId', async (req, res) => {
  const { connectionId } = req.params;
  
  try {
    const result = await testConnection(connectionId);
    res.json(result);
  } catch (error) {
    console.error(`Error testing connection ${connectionId}:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to test connection ${connectionId}`,
      message: error.message
    });
  }
});

module.exports = router;
