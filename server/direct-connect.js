/**
 * Direct PostgreSQL Connection Test Script
 * 
 * This script attempts to connect directly to the PostgreSQL database
 * with various connection options to help diagnose corporate proxy interference.
 */

const { Client } = require('pg');
require('dotenv').config();

// PostgreSQL connection settings from environment variables
const pgConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  // Default SSL settings
  ssl: {
    rejectUnauthorized: false
  }
};

/**
 * Test PostgreSQL connection with various configurations
 */
async function testDirectConnections() {
  console.log('Testing direct PostgreSQL connections with various configurations...');
  console.log('Connection target:', `${pgConfig.host}:${pgConfig.port}/${pgConfig.database}`);
  console.log('User:', pgConfig.user);
  
  // Test configurations
  const testConfigs = [
    {
      name: 'Standard connection',
      config: { ...pgConfig }
    },
    {
      name: 'Connection with SSL disabled',
      config: { 
        ...pgConfig,
        ssl: false
      }
    },
    {
      name: 'Connection with SSL and all verification disabled',
      config: {
        ...pgConfig,
        ssl: {
          rejectUnauthorized: false,
          checkServerIdentity: () => undefined
        }
      }
    },
    {
      name: 'Connection with explicit SSL mode',
      config: {
        ...pgConfig,
        ssl: {
          rejectUnauthorized: false,
          sslmode: 'prefer'
        }
      }
    },
    {
      name: 'Connection with connection string',
      config: {
        connectionString: `postgres://${pgConfig.user}:${encodeURIComponent(pgConfig.password)}@${pgConfig.host}:${pgConfig.port}/${pgConfig.database}?sslmode=require`
      }
    }
  ];
  
  // Run tests
  for (const test of testConfigs) {
    console.log(`\n🔍 Testing: ${test.name}`);
    
    try {
      const client = new Client(test.config);
      
      console.log('Connecting...');
      await client.connect();
      
      console.log('✅ Connection successful!');
      
      // Test a simple query
      const result = await client.query('SELECT version(), current_database()');
      console.log('PostgreSQL version:', result.rows[0].version);
      console.log('Current database:', result.rows[0].current_database);
      
      // Close the connection
      await client.end();
      console.log('Connection closed');
      
      // If we get here, we've found a working configuration
      console.log('\n🎉 SUCCESS! Found a working configuration:');
      // Password redacted: this prints to a terminal and often into CI logs.
      const { password, connectionString, ...safeConfig } = test.config;
      if (connectionString) {
        safeConfig.connectionString = connectionString.replace(/:\/\/([^:]+):[^@]*@/, '://$1:***@');
      }
      console.log(JSON.stringify({ ...safeConfig, password: password ? '***' : undefined }, null, 2));
      
      return true;
    } catch (error) {
      console.error(`❌ ${test.name} failed:`, error.message);
      console.error('Error details:', {
        code: error.code,
        detail: error.detail,
        hint: error.hint,
        file: error.file,
        line: error.line,
        routine: error.routine
      });
    }
  }
  
  console.log('\n❌ All connection attempts failed.');
  return false;
}

/**
 * Main function
 */
async function main() {
  try {
    const success = await testDirectConnections();
    
    if (!success) {
      console.log('\n=== NEXT STEPS ===');
      console.log('1. Try using an SSH tunnel to bypass the proxy');
      console.log('2. Check with your network administrator about proxy restrictions');
      console.log('3. Use a local PostgreSQL database for development');
    }
  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }
}

// Run the tests
main().catch(console.error);
