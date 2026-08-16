import React from 'react';
import { InfoTooltip } from '../../Tooltip';

/**
 * Component for displaying connection metrics in a grid
 * 
 * @param {Object} props Component properties
 * @param {Object} props.connections Connection statistics data
 * @param {Function} props.getStateColor Function to determine color based on metric value
 * @param {Function} props.getStatusIcon Function to get icon based on status
 * @returns {JSX.Element} Connection metrics grid component
 */
const ConnectionMetrics = ({ connections, getStateColor, getStatusIcon }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <div className="p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500">Total</span>
          <InfoTooltip content="Total number of database connections" />
        </div>
        <div className="text-2xl font-bold">{connections.total || 0}</div>
        <div className="flex items-center text-xs text-gray-500 mt-1">
          {getStatusIcon('stable')}
          <span className="ml-1">All connections</span>
        </div>
      </div>
      
      <div className={`p-3 rounded-lg border ${getStateColor(connections.active_connections, 'active')}`}>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Active</span>
          <InfoTooltip content="Connections currently executing queries" />
        </div>
        <div className="text-2xl font-bold">{connections.active_connections || 0}</div>
        <div className="flex items-center text-xs mt-1">
          {getStatusIcon('stable')}
          <span className="ml-1">{Math.round((connections.active_connections / connections.total) * 100) || 0}% of total</span>
        </div>
      </div>
      
      <div className={`p-3 rounded-lg border ${getStateColor(connections.stale_connections, 'stale')}`}>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Stale</span>
          <InfoTooltip content="Idle connections over 1 day old that may be consuming resources" />
        </div>
        <div className="text-2xl font-bold">{connections.stale_connections || 0}</div>
        <div className="flex items-center text-xs mt-1">
          {connections.stale_connections > 5 ? getStatusIcon('increase') : getStatusIcon('stable')}
          <span className="ml-1">{connections.stale_connections > 5 ? 'Should be cleared' : 'Acceptable'}</span>
        </div>
      </div>
      
      <div className={`p-3 rounded-lg border ${getStateColor(connections.hung_transactions, 'hung')}`}>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Hung</span>
          <InfoTooltip content="Idle transactions (>1h) that are holding locks and may cause problems" />
        </div>
        <div className="text-2xl font-bold">{connections.hung_transactions || 0}</div>
        <div className="flex items-center text-xs mt-1">
          {connections.hung_transactions > 0 ? getStatusIcon('increase') : getStatusIcon('stable')}
          <span className="ml-1">{connections.hung_transactions > 0 ? 'Needs attention' : 'None detected'}</span>
        </div>
      </div>
    </div>
  );
};

export default ConnectionMetrics;
