import React, { useState } from 'react';
import { Loader2, Zap, Settings } from 'lucide-react';

const DatabaseConnection = ({ dbConfig, setDbConfig, onAnalyzeWithParams, loading, error }) => {
  const [loadingConfig, setLoadingConfig] = useState(false);
  
  // State for connection loading feedback
  const [connectionFeedback, setConnectionFeedback] = useState(null);

  // Function to load connection details from server environment variables
  const loadConnectionDetails = async () => {
    setLoadingConfig(true);
    setConnectionFeedback(null);
    
    try {
      console.log('Fetching connection details from server...');
      const response = await fetch('/api/database/connection-config');
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      // Try to parse the JSON response
      let data;
      try {
        data = await response.json();
        console.log('Connection details response:', data);
      } catch (jsonError) {
        console.error('Error parsing JSON:', jsonError);
        throw new Error(`Failed to parse server response: ${jsonError.message}`);
      }
      
      if (data.success) {
        const newConfig = {
          host: data.config.host,
          port: data.config.port,
          database: data.config.database,
          username: data.config.user,
          password: data.config.password
        };
        console.log('Setting new database config:', newConfig);
        setDbConfig(newConfig);
        setConnectionFeedback({
          type: 'success',
          message: 'Connection details loaded. You can modify them if needed before analyzing.'
        });
        
        // Auto-hide feedback after 5 seconds
        setTimeout(() => setConnectionFeedback(null), 5000);
      } else {
        console.error('Failed to load connection details:', data.message || 'Unknown error');
        setConnectionFeedback({
          type: 'error',
          message: data.message || 'Failed to load connection details'
        });
      }
    } catch (err) {
      console.error('Error loading connection details:', err);
      setConnectionFeedback({
        type: 'error',
        message: 'Error loading connection details: ' + err.message
      });
    } finally {
      setLoadingConfig(false);
    }
  };
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Database Connection</h2>
        <button
          onClick={loadConnectionDetails}
          disabled={loadingConfig}
          className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-md text-sm"
        >
          {loadingConfig ? (
            <Loader2 className="animate-spin mr-1 h-4 w-4" />
          ) : (
            <Settings className="mr-1 h-4 w-4" />
          )}
          Load Saved Connection
        </button>
      </div>
      
      {/* Connection feedback message */}
      {connectionFeedback && (
        <div className={`mb-4 p-3 rounded-md text-sm ${connectionFeedback.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {connectionFeedback.message}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <input
          placeholder="Host"
          value={dbConfig.host}
          onChange={(e) => setDbConfig({...dbConfig, host: e.target.value})}
          className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <input
          placeholder="Port (default: 5432)"
          value={dbConfig.port}
          onChange={(e) => setDbConfig({...dbConfig, port: e.target.value})}
          className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <input
          placeholder="Database name"
          value={dbConfig.database}
          onChange={(e) => setDbConfig({...dbConfig, database: e.target.value})}
          className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <input
          placeholder="Username"
          value={dbConfig.username}
          onChange={(e) => setDbConfig({...dbConfig, username: e.target.value})}
          className="border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div className="mb-4">
        <input
          type="password"
          placeholder="Password"
          value={dbConfig.password}
          onChange={(e) => setDbConfig({...dbConfig, password: e.target.value})}
          className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-md text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <button
          onClick={onAnalyzeWithParams}
          disabled={loading || !dbConfig.host || !dbConfig.database || !dbConfig.username || !dbConfig.password}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-md font-medium text-lg flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin mr-3 h-6 w-6" />
              Analyzing database...
            </>
          ) : (
            <>
              <Zap className="mr-3 h-6 w-6" />
              Connect to PostgreSQL
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DatabaseConnection;