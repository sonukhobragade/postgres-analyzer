import React from 'react';
import { InfoTooltip } from '../Tooltip';
import Pagination from '../Pagination';

/**
 * Component for displaying PostgreSQL index usage statistics
 * 
 * @param {Object} props Component properties
 * @param {Array} props.indexes Array of index usage information
 * @param {Object} props.currentPage Current page information
 * @param {Function} props.setCurrentPage Function to update current page
 * @param {number} props.itemsPerPage Number of items to display per page
 * @returns {JSX.Element} Indexes panel component
 */
const IndexesPanel = ({ 
  indexes, 
  currentPage, 
  setCurrentPage, 
  itemsPerPage 
}) => {
  if (!indexes || !Array.isArray(indexes) || indexes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
        <h5 className="font-bold text-gray-700 mb-3 pb-2 border-b">Index Usage</h5>
        <p className="text-gray-500">No index usage data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
      <h5 className="font-bold text-gray-700 mb-3 pb-2 border-b flex items-center">
        Index Usage
        <InfoTooltip content="Statistics about how frequently indexes are used vs. their maintenance overhead" />
      </h5>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Table
                <InfoTooltip content="Name of the table this index belongs to" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Index
                <InfoTooltip content="Name of the index" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Index Size
                <InfoTooltip content="Size of the index on disk" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Index Scans
                <InfoTooltip content="Number of times this index has been used for queries" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
                <InfoTooltip content="Whether the index is being used effectively or might be a candidate for removal" />
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {indexes
              .slice(
                (currentPage.indexes - 1) * itemsPerPage,
                currentPage.indexes * itemsPerPage
              )
              .map((index, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index.tablename}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index.indexname}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index.index_size}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index.index_scans}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {index.index_scans > 0 ? (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full flex items-center gap-1">
                        Unused <InfoTooltip content="This index has not been used for queries and may be a candidate for removal if it's not enforcing a constraint." />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      
      {indexes.length > itemsPerPage && (
        <div className="mt-4">
          <Pagination 
            currentPage={currentPage.indexes} 
            totalPages={Math.ceil(indexes.length / itemsPerPage)}
            onPageChange={(page) => setCurrentPage(prev => ({ ...prev, indexes: page }))}
          />
        </div>
      )}
    </div>
  );
};

export default IndexesPanel;
