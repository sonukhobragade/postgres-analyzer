import React from 'react';

/**
 * Renders connection details information.
 * 
 * @param {Object} props Component properties
 * @param {Object} props.connections Connection statistics data
 * @param {Array} props.partitions Table partition information
 * @param {Array} props.blockingQueries Information about blocking queries
 * @param {Array} props.users Database user information
 * @returns {JSX.Element} ConnectionDetails component
 */
const ConnectionDetails = ({ connections, partitions, blockingQueries, users }) => {
  // Initialize data if it's missing
  const connectionData = connections || {
    total: 0,
    active: 0,
    idle: 0,
    idle_in_transaction: 0,
    new_connections: 0,
    active_connections: 0,
    stale_connections: 0,
    hung_transactions: 0
  };
  
  // Safe access to data - determine whether to show the data or placeholders
  const hasBlockingQueries = blockingQueries && blockingQueries.length > 0;
  const hasPartitions = partitions && partitions.length > 0;
  const hasUsers = users && users.length > 0;

  // Helper to determine color based on value and thresholds
  const getStateColor = (value, type) => {
    if (!value) return 'bg-gray-100';
    
    switch(type) {
      case 'new':
        return value > 20 ? 'bg-yellow-100' : 'bg-green-100';
      case 'active':
        return value > 50 ? 'bg-yellow-100' : 'bg-green-100';
      case 'stale':
        return value > 5 ? 'bg-red-100' : 'bg-green-100';
      case 'hung':
        return value > 0 ? 'bg-red-100' : 'bg-green-100';
      default:
        return 'bg-blue-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
      <h5 className="font-bold text-gray-700 mb-3">Connection Details</h5>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className={`p-3 rounded-lg ${connectionData && getStateColor(connectionData.total, 'total')}`}>
          <div className="text-sm font-medium text-gray-500">Total</div>
          <div className="text-2xl font-bold">{connectionData.total || 0}</div>
        </div>
        
        <div className={`p-3 rounded-lg ${getStateColor(connectionData.new_connections, 'new')}`}>
          <div className="text-sm font-medium text-gray-500">New <span className="text-xs">(last 5m)</span></div>
          <div className="text-2xl font-bold">{connectionData.new_connections || 0}</div>
        </div>
        
        <div className={`p-3 rounded-lg ${getStateColor(connectionData.active_connections, 'active')}`}>
          <div className="text-sm font-medium text-gray-500">Active</div>
          <div className="text-2xl font-bold">{connectionData.active_connections || 0}</div>
        </div>
        
        <div className={`p-3 rounded-lg ${getStateColor(connectionData.stale_connections, 'stale')}`}>
          <div className="text-sm font-medium text-gray-500">Stale <span className="text-xs">({'>'}1 day)</span></div>
          <div className="text-2xl font-bold">{connectionData.stale_connections || 0}</div>
        </div>
      </div>
      
      {/* Connection Stats Section */}
      <div className="mt-4">
        <h6 className="font-medium text-gray-700 mb-2">Connection Stats</h6>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className={`p-3 rounded-lg ${getStateColor(connectionData.new_connections, 'new')}`}>
            <div className="text-sm font-medium text-gray-500">New</div>
            <div className="text-xl font-bold">{connectionData.new_connections || 0}</div>
            <div className="text-xs text-gray-500">Last 5 minutes</div>
          </div>
          
          <div className={`p-3 rounded-lg ${getStateColor(connectionData.active_connections, 'active')}`}>
            <div className="text-sm font-medium text-gray-500">Active</div>
            <div className="text-xl font-bold">{connectionData.active_connections || 0}</div>
          </div>
          
          <div className={`p-3 rounded-lg bg-blue-100`}>
            <div className="text-sm font-medium text-gray-500">Closed</div>
            <div className="text-xl font-bold">{connectionData.total ? (connectionData.total - connectionData.active - connectionData.idle) : 0}</div>
            <div className="text-xs text-gray-500">Recently terminated</div>
          </div>
          
          <div className={`p-3 rounded-lg ${getStateColor(connectionData.stale_connections, 'stale')}`}>
            <div className="text-sm font-medium text-gray-500">Stale</div>
            <div className="text-xl font-bold">{connectionData.stale_connections || 0}</div>
            <div className="text-xs text-gray-500">Over 1 day old</div>
          </div>
        </div>
      </div>

      {/* Users Section */}
      <div className="mt-4">
        <h6 className="font-medium text-gray-700 mb-2">Database Users</h6>
        {hasUsers ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700">
              <thead className="text-xs uppercase bg-gray-50">
                <tr>
                  <th className="py-2 px-3">Username</th>
                  <th className="py-2 px-3">Active Connections</th>
                  <th className="py-2 px-3">Client IP</th>
                  <th className="py-2 px-3">Application</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={index} className={`bg-white border-b hover:bg-gray-50 ${index % 2 === 1 ? 'bg-gray-50' : ''}`}>
                    <td className="py-2 px-3 font-medium">{user.usename}</td>
                    <td className="py-2 px-3">{user.connection_count}</td>
                    <td className="py-2 px-3 text-xs">{user.client_addr || 'localhost'}</td>
                    <td className="py-2 px-3 text-xs">{user.application_name || 'postgres'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-gray-500 text-sm italic">
            No user information available.
          </div>
        )}
      </div>

      {/* Partitions Section */}
      <div className="mt-4">
        <h6 className="font-medium text-gray-700 mb-2">Table Partitions</h6>
        {hasPartitions ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700">
              <thead className="text-xs uppercase bg-gray-50">
                <tr>
                  <th className="py-2 px-3">Table</th>
                  <th className="py-2 px-3">Partitioning Type</th>
                  <th className="py-2 px-3">Partition Key</th>
                  <th className="py-2 px-3">Partitions Count</th>
                </tr>
              </thead>
              <tbody>
                {partitions.map((partition, index) => (
                  <tr key={index} className={`bg-white border-b hover:bg-gray-50 ${index % 2 === 1 ? 'bg-gray-50' : ''}`}>
                    <td className="py-2 px-3 font-medium">{partition.table_name || partition.parent_table}</td>
                    <td className="py-2 px-3">{partition.partition_strategy || partition.partition_type}</td>
                    <td className="py-2 px-3">{partition.partition_key || partition.partition_column}</td>
                    <td className="py-2 px-3">{partition.partition_count || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-gray-500 text-sm italic">
            No partitioned tables found in this database.
          </div>
        )}
      </div>

      {/* Blocking Queries Section */}
      <div className="mt-4">
        <h6 className="font-medium text-gray-700 mb-2">Blocking Queries</h6>
        {hasBlockingQueries ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700">
              <thead className="text-xs uppercase bg-gray-50">
                <tr>
                  <th className="py-2 px-3">Blocked User</th>
                  <th className="py-2 px-3">Blocking User</th>
                  <th className="py-2 px-3">Duration (s)</th>
                  <th className="py-2 px-3">Blocking Query</th>
                </tr>
              </thead>
              <tbody>
                {blockingQueries.map((query, index) => (
                  <tr key={index} className={`bg-white border-b hover:bg-gray-50 ${index % 2 === 1 ? 'bg-gray-50' : ''}`}>
                    <td className="py-2 px-3 font-medium">{query.blocked_user || query.blocked_pid}</td>
                    <td className="py-2 px-3">{query.blocking_user || query.blocking_pid}</td>
                    <td className="py-2 px-3">
                      <span className={query.blocked_duration_seconds > 60 ? 'text-red-600 font-medium' : ''}>
                        {query.blocked_duration_seconds?.toFixed(1) || query.wait_time || '0'}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="truncate max-w-xs" title={query.blocking_query}>
                        {query.blocking_query?.substring(0, 50) || 'N/A'}...
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-gray-500 text-sm italic">
            No blocking queries detected.
          </div>
        )}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm text-gray-700">
        <p className="font-semibold text-blue-800 mb-1">About Database Connections</p>
        <p>
          Managing PostgreSQL connections efficiently is crucial for database performance.
          Too many connections can exhaust server resources, while idle connections waste resources.
        </p>
        
        <p className="mt-2 font-semibold">Best practices:</p>
        <ul className="list-disc pl-5 mt-1">
          <li>Use connection pooling (e.g., pgBouncer) in production</li>
          <li>Close idle transactions promptly</li>
          <li>Monitor and kill stale connections</li>
          <li>Set appropriate connection timeouts</li>
        </ul>
        
        {connectionData.stale_connections > 0 && (
          <p className="mt-2 text-red-700 font-medium">
            Warning: You have {connectionData.stale_connections} stale connections. Consider implementing connection timeouts or connection pooling.
          </p>
        )}
      </div>
    </div>
  );
};

export default ConnectionDetails;
