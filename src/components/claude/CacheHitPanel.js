import React from 'react';
import { InfoTooltip } from '../Tooltip';

/**
 * Component displaying cache hit ratio information
 * 
 * @param {Object} props Component properties
 * @param {number} props.cacheHitRatio Cache hit ratio percentage
 * @returns {JSX.Element} Cache hit ratio panel
 */
const CacheHitPanel = ({ cacheHitRatio }) => {
  // Helper function to determine cache hit status and color
  const getCacheStatus = (ratio) => {
    if (ratio >= 99) return { status: 'Excellent', color: 'green' };
    if (ratio >= 95) return { status: 'Good', color: 'green' };
    if (ratio >= 90) return { status: 'Average', color: 'yellow' };
    return { status: 'Poor', color: 'red' };
  };
  
  const { status, color } = getCacheStatus(cacheHitRatio);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
      <h5 className="font-bold text-gray-700 mb-3 pb-2 border-b flex items-center">
        Cache Hit Ratio
        <InfoTooltip content="Percentage of database reads served from memory cache vs disk. Higher is better." />
      </h5>
      <div className="flex items-center mb-2">
        <div className="text-3xl font-bold mr-2">{cacheHitRatio?.toFixed(2) || 'N/A'}%</div>
        <div className={`text-sm px-2 py-0.5 rounded-full ${
          color === 'green' ? 'bg-green-100 text-green-800' : 
          color === 'yellow' ? 'bg-yellow-100 text-yellow-800' : 
          'bg-red-100 text-red-800'
        }`}>
          {status}
        </div>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        {cacheHitRatio < 95 ? 
          'Consider increasing shared_buffers in PostgreSQL configuration.' : 
          'Your cache hit ratio is good, no action needed.'}
      </p>
    </div>
  );
};

export default CacheHitPanel;
