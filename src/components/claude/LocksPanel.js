import React from 'react';
import { InfoTooltip } from '../Tooltip';

/**
 * Component for displaying PostgreSQL locks information
 * 
 * @param {Object} props Component properties
 * @param {Array} props.locks Array of database lock information
 * @returns {JSX.Element} Locks panel component
 */
const LocksPanel = ({ locks }) => {
  // Ensure locks is an array
  const locksArray = Array.isArray(locks) ? locks : [];

  if (!locksArray || locksArray.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
        <h5 className="font-bold text-gray-700 mb-3 pb-2 border-b">Database Locks</h5>
        <p className="text-gray-500">No active locks detected.</p>
      </div>
    );
  }

  // Count lock types
  const lockTypes = locksArray.reduce((acc, lock) => {
    acc[lock.mode] = (acc[lock.mode] || 0) + 1;
    return acc;
  }, {});
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
      <h5 className="font-bold text-gray-700 mb-3 pb-2 border-b flex items-center">
        Database Locks
        <InfoTooltip content="Information about locks held by sessions. Excessive or long-held locks can cause blocking and performance issues." />
      </h5>
      
      {/* Lock Summary */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-700">Total Locks</div>
            <div className="text-2xl font-bold text-blue-800">{locksArray.length}</div>
          </div>
          
          {Object.entries(lockTypes).map(([type, count]) => (
            <div 
              key={type}
              className="p-3 bg-gray-50 text-gray-700 rounded-lg"
            >
              <div className="text-sm">{type}</div>
              <div className="text-2xl font-bold">{count}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Lock Details Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Database
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Relation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transaction ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Granted
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {locksArray.map((lock, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lock.database || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{lock.relation || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    lock.mode.includes('exclusive') ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {lock.mode}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lock.transactionid || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {lock.granted ? (
                    <span className="text-green-600">✓ Yes</span>
                  ) : (
                    <span className="text-red-600">✗ No <InfoTooltip content="This lock is waiting to be granted, which may indicate blocking" /></span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LocksPanel;
