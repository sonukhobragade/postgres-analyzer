const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const databaseRoutes = require('./routes/database');
const claudeRoutes = require('./routes/claude');
const connectionsRoutes = require('./routes/connections');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Bind to loopback by default.
//
// This process holds database credentials and will connect to any database it
// is told to. app.listen(PORT) alone binds 0.0.0.0, which put an unauthenticated
// tool on every interface of the machine — reachable by anything on the same
// network, including a coffee-shop LAN. Set HOST explicitly if you know you
// want that.
const HOST = process.env.HOST || '127.0.0.1';

// Same reasoning for CORS. Bare cors() allows every origin, so any page open in
// the browser could drive this server: enumerate connections, run the analysis
// queries, and read the results back. Only the local dev server is allowed
// unless ALLOWED_ORIGINS says otherwise.
// Port 3001: that is what `npm start` runs the React dev server on
// (PORT=3001 in package.json), not the CRA default of 3000. Defaulting to 3000
// would have blocked every request from the UI this repository ships.
const allowedOrigins = (process.env.ALLOWED_ORIGINS ||
  'http://localhost:3001,http://127.0.0.1:3001')
  .split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // No Origin header: curl, a health probe, same-origin. Not a browser
    // cross-origin request, so there is nothing for CORS to protect against.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} is not allowed`));
  },
}));

app.use(express.json());

// Optional shared secret. Off by default because the server is on loopback,
// but anyone binding to another interface needs it: without it every route
// below is unauthenticated.
const API_TOKEN = process.env.API_TOKEN || '';
if (API_TOKEN) {
  app.use('/api', (req, res, next) => {
    const provided = req.get('x-api-token');
    if (provided && provided === API_TOKEN) return next();
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  });
  console.log('API token required for /api routes');
} else if (HOST !== '127.0.0.1' && HOST !== 'localhost') {
  console.warn(
    `WARNING: listening on ${HOST} with no API_TOKEN set. Every route is ` +
    `unauthenticated and this process can reach your databases.`
  );
}

// Routes
app.use('/api/database', databaseRoutes);
app.use('/api/claude', claudeRoutes);
app.use('/api/connections', connectionsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down server gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Keep the process running
process.stdin.resume();