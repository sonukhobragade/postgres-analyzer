import React from 'react';
import { InfoTooltip } from '../Tooltip';
import Pagination from '../Pagination';

/**
 * Component for displaying PostgreSQL table statistics
 * 
 * @param {Object} props Component properties
 * @param {Array} props.tables Array of table statistics
 * @param {Object} props.currentPage Current page information
 * @param {Function} props.setCurrentPage Function to update current page
 * @param {number} props.itemsPerPage Number of items to display per page
 * @returns {JSX.Element} Tables panel component
 */
const TablesPanel = ({ tables, currentPage, setCurrentPage, itemsPerPage }) => {
  if (!tables || !Array.isArray(tables) || tables.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
        <h5 className="font-bold text-gray-700 mb-3 pb-2 border-b">Tables Statistics</h5>
        <p className="text-gray-500">No table statistics available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
      <h5 className="font-bold text-gray-700 mb-3 pb-2 border-b flex items-center">
        Tables Statistics 
        <InfoTooltip content="Statistics about your tables including size, scan methods, and tuple counts" />
      </h5>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Table Name
                <InfoTooltip content="Name of the table in the database" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Size
                <InfoTooltip content="Size of the table on disk" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Live Tuples
                <InfoTooltip content="Number of active rows in the table" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dead Tuples
                <InfoTooltip content="Number of deleted rows not yet vacuumed" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Seq Scan Ratio
                <InfoTooltip content="Percentage of full table scans vs index scans. Lower is better." />
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tables
              .slice(
                (currentPage.tables - 1) * itemsPerPage,
                currentPage.tables * itemsPerPage
              )
              .map((table, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{table.tablename}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{table.size}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{table.live_tuples}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{table.dead_tuples}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {table.seq_scan_ratio}%
                    {table.seq_scan_ratio > 90 && table.size.includes('MB') && (
                      <span className="ml-2 text-amber-600">⚠️ High <InfoTooltip 
                        content="This table has a high sequential scan ratio. Consider adding an index."
                      /></span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      
      {tables.length > itemsPerPage && (
        <div className="mt-4">
          <Pagination 
            currentPage={currentPage.tables} 
            totalPages={Math.ceil(tables.length / itemsPerPage)}
            onPageChange={(page) => setCurrentPage(prev => ({ ...prev, tables: page }))}
          />
        </div>
      )}
    </div>
  );
};

export default TablesPanel;
