import React from 'react';

/**
 * Displays PostgreSQL table partitioning information
 * 
 * @param {Object} props Component properties
 * @param {Array} props.partitioning The partitioning data
 * @returns {JSX.Element} Partitioning component
 */
const Partitioning = ({ partitioning }) => {
  if (!partitioning || partitioning.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
        <h5 className="font-bold text-gray-700 mb-3">Table Partitioning</h5>
        <div className="text-gray-600 italic text-sm">
          No partitioned tables found in this database or partitioning information not available.
        </div>
      </div>
    );
  }

  // Group partitions by parent table
  const partitionsByParent = partitioning.reduce((acc, partition) => {
    const parentKey = `${partition.parent_schema}.${partition.parent_table}`;
    if (!acc[parentKey]) {
      acc[parentKey] = [];
    }
    acc[parentKey].push(partition);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
      <h5 className="font-bold text-gray-700 mb-3">Table Partitioning</h5>
      
      <div className="space-y-4">
        {Object.entries(partitionsByParent).map(([parentKey, partitions]) => (
          <div key={parentKey} className="border-b pb-3 mb-3 last:border-0 last:mb-0 last:pb-0">
            <h6 className="font-semibold text-indigo-700 mb-2">
              Parent Table: {parentKey}
            </h6>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="text-xs uppercase bg-gray-50">
                  <tr>
                    <th className="py-2 px-3">Partition Name</th>
                    <th className="py-2 px-3">Partition Expression</th>
                    <th className="py-2 px-3">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {partitions.map((partition, idx) => (
                    <tr key={idx} className="bg-white border-b hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">
                        {partition.child_schema}.{partition.child_table}
                      </td>
                      <td className="py-2 px-3 font-mono text-xs">
                        {partition.partition_expression}
                      </td>
                      <td className="py-2 px-3">
                        {partition.partition_size}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-3 text-xs text-gray-600">
              <span className="font-semibold">Total partitions:</span> {partitions.length}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm text-gray-700">
        <p className="font-semibold text-blue-800 mb-1">About Table Partitioning</p>
        <p>
          Partitioning splits large tables into smaller, more manageable pieces while maintaining 
          the appearance of a single table. Benefits include:
        </p>
        <ul className="list-disc pl-5 mt-1">
          <li>Improved query performance through partition pruning</li>
          <li>Faster bulk operations on individual partitions</li>
          <li>More efficient maintenance of very large tables</li>
        </ul>
      </div>
    </div>
  );
};

export default Partitioning;
