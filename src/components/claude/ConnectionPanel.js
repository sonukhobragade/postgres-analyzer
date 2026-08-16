import React from 'react';
import { Database, AlertCircle, CheckCircle } from 'lucide-react';
import { InfoTooltip } from '../Tooltip';

/**
 * Component displaying connection details and controls for the configured database
 * 
 * @param {Object} props Component properties
 * @param {Object} props.serverConnection Connection details for the configured database
 * @param {boolean} props.loading Whether connection check is loading
 * @param {Function} props.checkConnectionHealth Function to check connection health
 * @param {Function} props.runAnalysis Function to run database analysis
 * @param {Object} props.connectionStatus Current connection status
 * @param {Object} props.error Any error that occurred
 * @returns {JSX.Element} Connection panel component
 */
const ConnectionPanel = ({ 
  serverConnection, 
  loading, 
  checkConnectionHealth, 
  runAnalysis, 
  connectionStatus, 
  error 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
        <Database size={20} /> PostgreSQL Connection
        <InfoTooltip content="This uses the connection details stored on the server." />
      </h3>
      
      {/* Connection Details */}
      {serverConnection && (
        <div className="mb-4">
          <h4 className="text-md font-semibold mb-2">Connection Details:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
            <div className="text-sm"><span className="font-medium">Host:</span> {serverConnection.host}</div>
            <div className="text-sm"><span className="font-medium">Port:</span> {serverConnection.port}</div>
            <div className="text-sm"><span className="font-medium">Database:</span> {serverConnection.database}</div>
            <div className="text-sm"><span className="font-medium">User:</span> {serverConnection.user}</div>
          </div>
          
          {/* Connection Status */}
          {connectionStatus && (
            <div className={`p-3 mt-2 mb-2 rounded text-sm flex items-start gap-2 
              ${connectionStatus.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {connectionStatus.success ? 
                <CheckCircle size={16} className="mt-0.5" /> : 
                <AlertCircle size={16} className="mt-0.5" />
              }
              <div>
                <div className="font-medium">{connectionStatus.success ? 'Connected' : 'Connection Failed'}</div>
                <div className="text-xs mt-1">{connectionStatus.message}</div>
                {connectionStatus.version && (
                  <div className="text-xs mt-1">PostgreSQL {connectionStatus.version}</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5" />
          <div>{error}</div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={checkConnectionHealth}
          disabled={loading}
          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition flex items-center gap-1"
        >
          {loading ? 'Testing...' : 'Test Connection'}
        </button>
        
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-1"
        >
          {loading ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </div>
    </div>
  );
};

export default ConnectionPanel;
