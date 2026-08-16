import React from 'react';
import { InfoTooltip } from '../Tooltip';
import Pagination from '../Pagination';

/**
 * Component for displaying slow PostgreSQL queries
 * 
 * @param {Object} props Component properties
 * @param {Array} props.slowQueries Array of slow query information
 * @param {Object} props.currentPage Current page information
 * @param {Function} props.setCurrentPage Function to update current page
 * @param {number} props.itemsPerPage Number of items to display per page
 * @param {Function} props.viewQueryDetails Function to view full query details
 * @returns {JSX.Element} Slow queries panel component
 */
const SlowQueriesPanel = ({ 
  slowQueries, 
  currentPage, 
  setCurrentPage, 
  itemsPerPage,
  viewQueryDetails
}) => {
  if (!slowQueries || !Array.isArray(slowQueries) || slowQueries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
        <h5 className="font-bold text-gray-700 mb-3 pb-2 border-b">Slow Queries</h5>
        <p className="text-gray-500">
          No slow query data available. This may be because pg_stat_statements extension is not enabled.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
      <h5 className="font-bold text-gray-700 mb-3 pb-2 border-b flex items-center">
        Slow Queries
        <InfoTooltip content="Queries that consume significant database time and may benefit from optimization" />
      </h5>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Query
                <InfoTooltip content="SQL query text (truncated). Click 'View Full Query' to see the complete query." />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Calls
                <InfoTooltip content="Number of times this query has been executed since the last server restart or stats reset" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg Time (ms)
                <InfoTooltip content="Average execution time of this query in milliseconds. Lower is better." />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Database Time %
                <InfoTooltip content="Percentage of total database execution time consumed by this query. Queries with high percentages are prime candidates for optimization." />
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {slowQueries
              .slice(
                (currentPage.slowQueries - 1) * itemsPerPage,
                currentPage.slowQueries * itemsPerPage
              )
              .map((query, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="max-w-xs truncate">{query.query_preview || query.query}</div>
                    <button 
                      className="mt-1 px-2 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 flex items-center"
                      onClick={() => viewQueryDetails(query, query.avg_time, query.percentage)}
                    >
                      <span className="mr-1">📋</span> View Full Query
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{query.calls}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{query.avg_time} ms</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {query.percentage}%
                    {query.percentage > 10 && (
                      <span className="ml-2 text-amber-600">⚠️ High <InfoTooltip 
                        content={
                          <div>
                            <p>This query consumes a significant portion of your database time.</p>
                            <p className="mt-2">Consider optimizing it by examining the execution plan.</p>
                          </div>
                        }
                      /></span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      
      {slowQueries.length > itemsPerPage && (
        <div className="mt-4">
          <Pagination 
            currentPage={currentPage.slowQueries} 
            totalPages={Math.ceil(slowQueries.length / itemsPerPage)}
            onPageChange={(page) => setCurrentPage(prev => ({ ...prev, slowQueries: page }))}
          />
        </div>
      )}
    </div>
  );
};

export default SlowQueriesPanel;
