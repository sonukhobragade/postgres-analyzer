import React from 'react';
import { InfoTooltip } from '../../Tooltip';

/**
 * Component for displaying active PostgreSQL connections
 * 
 * @param {Object} props Component properties
 * @param {Array} props.activeConnections List of active database connections
 * @param {boolean} props.expanded Whether this section is expanded
 * @param {Function} props.toggleSection Function to toggle section expansion
 * @returns {JSX.Element} Active connections list component
 */
const ActiveConnectionsList = ({ activeConnections, expanded, toggleSection }) => {
  // Count connections by state
  const activeCount = activeConnections.filter(conn => conn.state === 'active').length;
  const idleCount = activeConnections.filter(conn => conn.state === 'idle').length;
  const otherCount = activeConnections.length - activeCount - idleCount;
  
  // Get unique users
  const uniqueUsers = [...new Set(activeConnections.map(conn => conn.usename))].length;
  
  return (
    <div className="mt-5 border rounded-lg p-4 bg-white">
      <div className="flex justify-between items-center mb-3">
        <h6 className="font-medium text-gray-700 flex items-center">
          <span>Active Connections</span>
          <span className="ml-2 text-xs font-normal text-gray-500">({activeConnections.length})</span>
          <InfoTooltip content="Connections currently active in the database" />
        </h6>
        <button 
          onClick={() => toggleSection('activeConnections')}
          className="p-1 rounded-full hover:bg-gray-100 focus:outline-none flex items-center"
          aria-label={expanded ? 'Collapse connections list' : 'Expand connections list'}
        >
          {!expanded && <span className="text-xs text-blue-600 mr-1">Show details</span>}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 transform ${expanded ? 'rotate-180' : ''} text-gray-500`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      
      {/* Connection summary shown when collapsed */}
      {!expanded && activeConnections.length > 0 && (
        <div className="flex flex-wrap gap-3 text-sm mb-1 ml-1">
          <div className="flex items-center">
            <span className="h-3 w-3 rounded-full bg-green-400 mr-2"></span>
            <span>{activeCount} active</span>
          </div>
          <div className="flex items-center">
            <span className="h-3 w-3 rounded-full bg-gray-300 mr-2"></span>
            <span>{idleCount} idle</span>
          </div>
          {otherCount > 0 && (
            <div className="flex items-center">
              <span className="h-3 w-3 rounded-full bg-orange-300 mr-2"></span>
              <span>{otherCount} other</span>
            </div>
          )}
          <div className="ml-auto text-gray-500 text-xs">{uniqueUsers} unique user{uniqueUsers !== 1 ? 's' : ''}</div>
        </div>
      )}
      
      {expanded && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeConnections.map((conn, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm">{conn.client_addr || 'local'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">{conn.usename}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      conn.state === 'active' ? 'bg-green-100 text-green-800' : 
                      conn.state === 'idle' ? 'bg-gray-100 text-gray-800' : 
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {conn.state}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {conn.duration ? `${Math.floor(conn.duration / 60)}m ${conn.duration % 60}s` : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ActiveConnectionsList;
