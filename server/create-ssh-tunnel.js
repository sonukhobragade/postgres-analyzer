/**
 * PostgreSQL SSH Tunnel Script
 * 
 * This script establishes and maintains an SSH tunnel to the PostgreSQL database.
 * Run this script in a separate terminal window before starting your application.
 */

const { Client: SSHClient } = require('ssh2');
require('dotenv').config();

// Local port to forward to
const LOCAL_PORT = 5433;

// Get SSH configuration from environment or use defaults
const sshConfig = {
  host: process.env.SSH_HOST || 'your-ssh-server.com',  // Replace with your SSH server hostname
  port: parseInt(process.env.SSH_PORT || '22'),         // SSH port (usually 22)
  username: process.env.SSH_USER || 'your-username',    // Replace with your SSH username
  
  // CHOOSE ONE authentication method and uncomment it:
  
  // Option 1: Password authentication
  password: process.env.SSH_PASSWORD,                   // Set in .env file
  
  // Option 2: Private key authentication (uncomment if using key-based auth)
  // privateKey: require('fs').readFileSync(process.env.SSH_KEY_PATH || '/path/to/private/key'),
  
  // Uncomment if your private key has a passphrase
  // passphrase: process.env.SSH_KEY_PASSPHRASE,
};

// PostgreSQL connection settings (from .env)
const pgConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
};

/**
 * Creates and maintains an SSH tunnel
 */
async function createTunnel() {
  console.log('Setting up SSH tunnel...');
  console.log(`Will forward localhost:${LOCAL_PORT} -> ${pgConfig.host}:${pgConfig.port}`);
  
  const ssh = new SSHClient();
  
  // Handle SSH connection events
  ssh.on('ready', () => {
    console.log('✅ SSH connection established');
    
    // Set up port forwarding
    ssh.forwardOut(
      '127.0.0.1',       // Local bind address
      LOCAL_PORT,        // Local bind port
      pgConfig.host,     // Remote PostgreSQL host
      pgConfig.port,     // Remote PostgreSQL port
      (err, stream) => {
        if (err) {
          console.error('❌ Port forwarding failed:', err);
          setTimeout(() => {
            console.log('Attempting to reconnect...');
            createTunnel();
          }, 5000);
          return;
        }
        
        console.log(`✅ SSH tunnel established on localhost:${LOCAL_PORT}`);
        console.log('✅ You can now connect to PostgreSQL via localhost:' + LOCAL_PORT);
        console.log('✅ Update your .env file with:');
        console.log('   DB_HOST=localhost');
        console.log(`   DB_PORT=${LOCAL_PORT}`);
        
        // Keep the tunnel open
        stream.on('close', () => {
          console.log('⚠️ SSH tunnel closed unexpectedly');
          console.log('Attempting to reestablish tunnel...');
          setTimeout(createTunnel, 1000);
        });
      }
    );
  });
  
  ssh.on('error', (err) => {
    console.error('❌ SSH connection error:', err);
    console.log('Attempting to reconnect in 5 seconds...');
    setTimeout(createTunnel, 5000);
  });
  
  ssh.on('close', () => {
    console.log('SSH connection closed');
    console.log('Attempting to reconnect in 5 seconds...');
    setTimeout(createTunnel, 5000);
  });
  
  // Connect to the SSH server
  try {
    ssh.connect(sshConfig);
  } catch (error) {
    console.error('Failed to connect to SSH server:', error);
    console.log('Attempting to reconnect in 5 seconds...');
    setTimeout(createTunnel, 5000);
  }
}

// Handle script termination
process.on('SIGINT', () => {
  console.log('\nShutting down SSH tunnel...');
  process.exit(0);
});

// Display instructions
console.log('=== PostgreSQL SSH Tunnel ===');
console.log('This script will create and maintain an SSH tunnel to your PostgreSQL database.');
console.log('Press Ctrl+C to stop the tunnel.\n');

// Start the tunnel
createTunnel();
