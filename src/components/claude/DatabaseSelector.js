import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Database selector component for choosing which database to analyze
 * 
 * @param {Object} props - Component properties
 * @param {string} props.selectedConnection - Currently selected connection ID
 * @param {Function} props.onConnectionChange - Callback for connection change
 * @returns {JSX.Element} Database selector component
 */
const DatabaseSelector = ({ selectedConnection, onConnectionChange }) => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch available database connections from the backend.
   *
   * useCallback keeps the identity stable so the mount effect below can
   * declare it as a dependency honestly instead of suppressing the warning.
   */
  const fetchConnections = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/connections');
      
      if (!response.ok) {
        throw new Error(`Error fetching connections: ${response.status}`);
      }
      
      // Check for proxy errors before parsing JSON
      const responseText = await response.text();
      
      // Check if response looks like a proxy error or HTML instead of JSON
      if (responseText.includes('Proxy Error') || responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
        console.error('Received proxy error or HTML instead of JSON:', responseText.substring(0, 150));
        throw new Error('Connection error: Received unexpected response format');
      }
      
      // Now parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError, 'Response was:', responseText.substring(0, 150));
        throw new Error('Failed to parse server response as JSON');
      }
      
      if (data.success && data.connections) {
        // Convert from object to array for easier mapping
        const connectionsList = Object.entries(data.connections).map(([id, conn]) => ({
          id,
          ...conn
        }));
        
        setConnections(connectionsList);
      } else {
        setError('Failed to load database connections: ' + (data.message || 'No connections available'));
      }
    } catch (err) {
      console.error('Error fetching database connections:', err);
      setError('Failed to load database connections');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load once on mount.
  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Auto-select the first connection once they arrive. Kept separate from the
  // fetch so that selecting a connection does not trigger another fetch.
  useEffect(() => {
    if (!selectedConnection && connections.length > 0) {
      onConnectionChange(connections[0].id);
    }
  }, [connections, selectedConnection, onConnectionChange]);

  /**
   * Handle connection selection change
   * 
   * @param {Event} e - Change event
   */
  const handleConnectionChange = (e) => {
    onConnectionChange(e.target.value);
  };

  // Find the currently selected connection
  const currentConnection = connections.find(conn => conn.id === selectedConnection) || {};

  return (
    <div className="mb-4">
      <label htmlFor="dbConnectionSelect" className="block mb-2 text-sm font-medium text-gray-700">
        Database Connection
      </label>
      
      <div className="flex items-center gap-3">
        <select
          id="dbConnectionSelect"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-64 p-2.5"
          value={selectedConnection || ''}
          onChange={handleConnectionChange}
          disabled={loading || connections.length === 0}
        >
          {connections.length === 0 && (
            <option value="" disabled>No connections available</option>
          )}
          
          {connections.map((conn) => (
            <option key={conn.id} value={conn.id}>
              {conn.name} ({conn.host}:{conn.port}/{conn.database})
            </option>
          ))}
        </select>
        
        {loading && (
          <div className="text-sm text-gray-500">Loading...</div>
        )}
        
        {error && (
          <div className="text-sm text-red-500">{error}</div>
        )}
      </div>
      
      {selectedConnection && (
        <div className="mt-2 text-xs text-gray-500">
          <div><span className="font-medium">Host:</span> {currentConnection.host}</div>
          <div><span className="font-medium">Database:</span> {currentConnection.database}</div>
          <div><span className="font-medium">User:</span> {currentConnection.user}</div>
        </div>
      )}
    </div>
  );
};

DatabaseSelector.propTypes = {
  selectedConnection: PropTypes.string,
  onConnectionChange: PropTypes.func.isRequired
};

export default DatabaseSelector;
