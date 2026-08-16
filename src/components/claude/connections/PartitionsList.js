import React from 'react';

/**
 * Component for displaying PostgreSQL table partitions
 * 
 * @param {Object} props Component properties
 * @param {Array} props.partitions List of table partitions
 * @returns {JSX.Element} Partitions list component
 */
const PartitionsList = ({ partitions }) => {
  const hasPartitions = partitions && partitions.length > 0;

  return (
    <div className="mt-4">
      <h6 className="font-medium text-gray-700 mb-2">Table Partitions</h6>
      {hasPartitions ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="text-xs uppercase bg-gray-50">
              <tr>
                <th className="py-2 px-3">Parent Table</th>
                <th className="py-2 px-3">Child Table</th>
                <th className="py-2 px-3">Partition Expression</th>
                <th className="py-2 px-3">Size</th>
              </tr>
            </thead>
            <tbody>
              {partitions.map((partition, index) => {
                // Extract the partition type (RANGE/LIST) from the expression
                const partitionType = partition.partition_expression && 
                                     (partition.partition_expression.includes('FROM') ? 'RANGE' : 
                                      partition.partition_expression.includes('IN') ? 'LIST' : 'OTHER');
                
                // Format table name as schema.table
                const parentTableName = `${partition.parent_schema}.${partition.parent_table}`;
                const childTableName = `${partition.child_schema}.${partition.child_table}`;
                
                return (
                  <tr key={index} className={`bg-white border-b hover:bg-gray-50 ${index % 2 === 1 ? 'bg-gray-50' : ''}`}>
                    <td className="py-2 px-3 font-medium">{parentTableName}</td>
                    <td className="py-2 px-3">{childTableName}</td>
                    <td className="py-2 px-3">
                      <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 mr-1">
                        {partitionType}
                      </span>
                      {partition.partition_expression || '-'}
                    </td>
                    <td className="py-2 px-3">{partition.partition_size || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-gray-500 text-sm italic">
          No partitioned tables found in this database. Partitioning is an advanced PostgreSQL feature 
          used for dividing large tables into smaller, more manageable pieces.
        </div>
      )}
    </div>
  );
};

export default PartitionsList;
