import React from 'react';

/**
 * Component for displaying PostgreSQL blocking queries
 * 
 * @param {Object} props Component properties
 * @param {Array} props.blockingQueries List of blocking queries
 * @returns {JSX.Element} Blocking queries list component
 */
const BlockingQueriesList = ({ blockingQueries }) => {
  const hasBlockingQueries = blockingQueries && blockingQueries.length > 0;

  return (
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
                      {query.blocked_duration_seconds?.toFixed(1) || '0'}
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
          No blocking queries detected. Blocking queries occur when one query is waiting for another to release a lock.
        </div>
      )}
    </div>
  );
};

export default BlockingQueriesList;
