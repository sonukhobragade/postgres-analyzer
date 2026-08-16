import React from 'react';
import { Clock } from 'lucide-react';

const SlowQueries = ({ queries }) => {
  if (!queries || queries.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <Clock className="mr-2 h-5 w-5 text-orange-600" />
        Slowest Queries
      </h3>
      <div className="space-y-4">
        {queries.map((query, idx) => (
          <div key={idx} className="border rounded-lg p-4 bg-gray-50">
            <div className="mb-2">
              <p className="font-mono text-sm text-gray-700">{query.query}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Avg Time:</span>
                <span className="font-semibold ml-1">{query.avgTime}ms</span>
              </div>
              <div>
                <span className="text-gray-600">Max Time:</span>
                <span className="font-semibold ml-1">{query.maxTime}ms</span>
              </div>
              <div>
                <span className="text-gray-600">Calls:</span>
                <span className="font-semibold ml-1">{query.calls}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Time:</span>
                <span className="font-semibold ml-1">{(query.totalTime/1000).toFixed(1)}s</span>
              </div>
              <div>
                <span className="text-gray-600">% of Total:</span>
                <span className="font-semibold ml-1">{query.percentage}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SlowQueries;