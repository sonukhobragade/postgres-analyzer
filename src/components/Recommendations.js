import React from 'react';
import { Zap } from 'lucide-react';

const Recommendations = ({ recommendations }) => {
  if (!recommendations) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <Zap className="mr-2 h-5 w-5 text-yellow-600" />
        Performance Recommendations
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border rounded-lg p-4 bg-red-50 border-red-200">
          <h4 className="font-semibold text-red-800 mb-2">Immediate Actions</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
            {recommendations.immediate.length > 0 ? (
              recommendations.immediate.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))
            ) : (
              <li>No immediate actions required</li>
            )}
          </ul>
        </div>
        <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
          <h4 className="font-semibold text-yellow-800 mb-2">This Week</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
            {recommendations.thisWeek.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
        <div className="border rounded-lg p-4 bg-green-50 border-green-200">
          <h4 className="font-semibold text-green-800 mb-2">This Month</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
            {recommendations.thisMonth.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Recommendations;