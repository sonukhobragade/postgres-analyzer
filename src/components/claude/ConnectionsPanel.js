import React, { useState } from 'react';
import { InfoTooltip } from '../Tooltip';

// Import individual components
import { 
  ConnectionMetrics,
  UsersList,
  PartitionsList,
  BlockingQueriesList,
  ActiveConnectionsList,
  BestPracticeInfo
} from './connections';

/**
 * Component for displaying PostgreSQL connection statistics
 * 
 * @param {Object} props Component properties
 * @param {Object} props.connections Connection statistics data
 * @param {Array} props.activeConnections List of active database connections
 * @param {Array} props.partitions Table partition information
 * @param {Array} props.blockingQueries Information about blocking queries
 * @param {Array} props.users Database user information
 * @returns {JSX.Element} Connections panel component
 */
const ConnectionsPanel = ({ 
  connections, 
  activeConnections = [], 
  partitions = [],
  blockingQueries = [],
  users = []
}) => {
  // State for collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    users: true,
    partitions: true,
    blockingQueries: true,
    activeConnections: false // Start with Active Connections collapsed by default
  });
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  if (!connections) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
        <h5 className="font-bold text-gray-700 mb-3 pb-2 border-b">Connection Details</h5>
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="text-gray-400 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-gray-500">No connection data available.</p>
          <p className="text-sm text-gray-400 mt-1">Try running an analysis to see connection details.</p>
        </div>
      </div>
    );
  }

  /**
   * Helper to determine color based on value and thresholds
   * @param {number} value - The value to evaluate
   * @param {string} type - Type of metric being evaluated
   * @returns {string} CSS class for background color
   */
  const getStateColor = (value, type) => {
    if (!value) return 'bg-gray-100';
    
    switch(type) {
      case 'new':
        return value > 20 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
      case 'active':
        return value > 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
      case 'stale':
        return value > 5 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
      case 'hung':
        return value > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  /**
   * Gets an icon based on trend and status
   * @param {string} status - Status indicator (increase, decrease, stable)
   * @returns {JSX.Element} SVG icon component
   */
  const getStatusIcon = (status) => {
    if (status === 'increase') {
      return (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
        </svg>
      );
    } else if (status === 'decrease') {
      return (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6"></path>
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14"></path>
        </svg>
      );
    }
  };
  
  // Calculate health status based on connection metrics
  const connectionHealth = 
    connections.stale_connections > 10 ? 'critical' :
    connections.stale_connections > 5 ? 'warning' :
    connections.hung_transactions > 0 ? 'warning' : 'healthy';
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
      <h5 className="font-bold text-gray-700 mb-3 pb-2 border-b flex items-center">
        <span className="mr-1">Connection Details</span>
        <span className={`ml-2 inline-flex px-2 text-xs font-semibold rounded-full ${
          connectionHealth === 'critical' ? 'bg-red-100 text-red-800' :
          connectionHealth === 'warning' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {connectionHealth === 'critical' ? 'Critical' : 
           connectionHealth === 'warning' ? 'Warning' : 'Healthy'}
        </span>
        <InfoTooltip content="Detailed information about database connections, their status, and statistics" />
      </h5>
      
      {/* Connection Summary - Main Metrics */}
      <ConnectionMetrics 
        connections={connections} 
        getStateColor={getStateColor} 
        getStatusIcon={getStatusIcon} 
      />
      
      {/* Blocking Queries Section */}
      <BlockingQueriesList blockingQueries={blockingQueries} />
      
      {/* Partitions Section */}
      {partitions && partitions.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h6 className="font-medium text-gray-700">Table Partitions</h6>
            <button 
              onClick={() => toggleSection('partitions')} 
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transform ${expandedSections.partitions ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {expandedSections.partitions && <PartitionsList partitions={partitions} />}
        </div>
      )}
      
      {/* Users Section */}
      {users && users.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h6 className="font-medium text-gray-700">Database Users</h6>
            <button 
              onClick={() => toggleSection('users')} 
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transform ${expandedSections.users ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {expandedSections.users && <UsersList users={users} />}
        </div>
      )}
      
      {/* Active Connections */}
      {activeConnections && activeConnections.length > 0 && (
        <ActiveConnectionsList 
          activeConnections={activeConnections} 
          expanded={expandedSections.activeConnections} 
          toggleSection={() => toggleSection('activeConnections')} 
        />
      )}
      
      {/* Best Practices Info Box */}
      <BestPracticeInfo connections={connections} />
    </div>
  );
};

export default ConnectionsPanel;