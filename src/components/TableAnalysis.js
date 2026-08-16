import React from 'react';
import { Database } from 'lucide-react';

const TableAnalysis = ({ tables }) => {
  const getStatusColor = (status) => {
    switch(status) {
      case 'EXCELLENT': return 'bg-green-100 text-green-800';
      case 'GOOD': return 'bg-blue-100 text-blue-800';
      case 'WARNING': return 'bg-yellow-100 text-yellow-800';
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!tables || tables.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <Database className="mr-2 h-5 w-5 text-blue-600" />
        Table Performance Analysis
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rows</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seq Scan %</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dead Tuples %</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Vacuum</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tables.map((table, idx) => (
              <tr key={idx}>
                <td className="px-4 py-4 text-sm font-medium text-gray-900">
                  {table.schema}.{table.table}
                </td>
                <td className="px-4 py-4 text-sm text-gray-500">{table.size}</td>
                <td className="px-4 py-4 text-sm text-gray-500">{table.rowCount?.toLocaleString()}</td>
                <td className="px-4 py-4 text-sm text-gray-500">{table.seqRatio}%</td>
                <td className="px-4 py-4 text-sm text-gray-500">{table.deadTuples}%</td>
                <td className="px-4 py-4 text-sm text-gray-500">
                  {table.lastVacuum ? new Date(table.lastVacuum).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(table.status)}`}>
                    {table.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableAnalysis;