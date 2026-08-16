import React from 'react';

/**
 * Displays information about blocking/blocked queries in the database
 * 
 * @param {Object} props Component properties
 * @param {Array} props.blockingQueries The blocking queries data
 * @returns {JSX.Element} BlockingQueries component
 */
const BlockingQueries = ({ blockingQueries }) => {
  if (!blockingQueries || blockingQueries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
        <h5 className="font-bold text-gray-700 mb-3">Blocking Queries</h5>
        <div className="text-gray-600 italic text-sm">
          No blocking queries detected at this time.
        </div>
      </div>
    );
  }

  // Format duration to be more human-readable
  const formatDuration = (seconds) => {
    if (seconds < 60) return `${Math.round(seconds)} sec`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
      <h5 className="font-bold text-gray-700 mb-3">Blocking Queries</h5>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs uppercase bg-gray-50">
            <tr>
              <th className="py-2 px-3">Duration</th>
              <th className="py-2 px-3">Blocking PID</th>
              <th className="py-2 px-3">Blocked PID</th>
              <th className="py-2 px-3">Blocking Query</th>
              <th className="py-2 px-3">Blocked Query</th>
            </tr>
          </thead>
          <tbody>
            {blockingQueries.map((query, idx) => (
              <tr key={idx} className={`bg-white border-b hover:bg-gray-50 ${idx % 2 === 0 ? '' : 'bg-gray-50'}`}>
                <td className="py-2 px-3 font-medium text-red-600">
                  {formatDuration(query.blocked_duration_seconds)}
                </td>
                <td className="py-2 px-3">
                  {query.blocking_pid}
                  {/* A blocker that is itself waiting is a link in a chain, not
                      the thing to go and deal with. Without this the list gives
                      no way to tell them apart, and the obvious action — kill
                      the blocker — targets a session that is also stuck. */}
                  {query.blocker_is_also_blocked === false && (
                    <span className="text-xs block font-medium text-red-700">root cause</span>
                  )}
                  {query.blocker_is_also_blocked === true && (
                    <span className="text-xs block text-gray-500">also blocked</span>
                  )}
                  <span className="text-xs block text-gray-500">{query.blocking_user}</span>
                </td>
                <td className="py-2 px-3">
                  {query.blocked_pid}
                  <span className="text-xs block text-gray-500">{query.blocked_user}</span>
                </td>
                <td className="py-2 px-3 font-mono text-xs max-w-xs truncate">
                  {query.blocking_query || 'N/A'}
                </td>
                <td className="py-2 px-3 font-mono text-xs max-w-xs truncate">
                  {query.blocked_query || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 p-3 bg-yellow-50 rounded-md text-sm text-gray-700">
        <p className="font-semibold text-amber-800 mb-1">Understanding Blocking Queries</p>
        <p>
          Blocking queries occur when one database session holds locks that prevent other 
          sessions from proceeding. Long-running blocking queries can cause significant performance issues.
        </p>
        <p className="mt-1 font-semibold">Common causes:</p>
        <ul className="list-disc pl-5 mt-1">
          <li>Long-running transactions that don't commit or rollback</li>
          <li>Poorly designed application logic that holds locks unnecessarily</li>
          <li>Missing indexes causing table-level locks</li>
          <li>Deadlocks between competing transactions</li>
        </ul>
        <p className="mt-2 font-medium text-red-700">
          {blockingQueries.length > 5 ? 
            'Warning: A high number of blocking queries indicates a potential issue with your application or database design!' : 
            'Tip: Monitor this section regularly to identify performance bottlenecks.'}
        </p>
      </div>
    </div>
  );
};

export default BlockingQueries;
