import React from 'react';

/**
 * Component for displaying connection best practices and warnings
 * 
 * @param {Object} props Component properties
 * @param {Object} props.connections Connection statistics data
 * @returns {JSX.Element} Best practices info component
 */
const BestPracticeInfo = ({ connections }) => {
  return (
    <div className="mt-6 p-4 bg-blue-50 rounded-md text-sm text-gray-700">
      <p className="font-semibold text-blue-800 mb-1">About Database Connections</p>
      <p>
        Managing PostgreSQL connections efficiently is crucial for database performance.
        Too many connections can exhaust server resources, while idle connections waste resources.
      </p>
      
      <p className="mt-2 font-semibold">Best practices:</p>
      <ul className="list-disc pl-5 mt-1">
        <li>Use connection pooling (e.g., pgBouncer) in production</li>
        <li>Close idle transactions promptly</li>
        <li>Monitor and kill stale connections</li>
        <li>Set appropriate connection timeouts</li>
      </ul>
      
      {connections.stale_connections > 0 && (
        <p className="mt-2 text-red-700 font-medium">
          Warning: You have {connections.stale_connections} stale connections. Consider implementing connection timeouts or connection pooling.
        </p>
      )}
    </div>
  );
};

export default BestPracticeInfo;
