import React from 'react';
import { AlertTriangle } from 'lucide-react';

const CriticalIssues = ({ issues }) => {
  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'HIGH': return 'bg-red-200 text-red-800';
      case 'MEDIUM': return 'bg-yellow-200 text-yellow-800';
      case 'LOW': return 'bg-blue-200 text-blue-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  if (!issues || issues.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold mb-4 flex items-center text-red-600">
        <AlertTriangle className="mr-2 h-5 w-5" />
        Critical Performance Issues
      </h3>
      <div className="space-y-4">
        {issues.map((issue, idx) => (
          <div key={idx} className="border border-red-200 rounded-lg p-4 bg-red-50">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-red-800">
                  {issue.table}: {issue.issue}
                </h4>
                <p className="text-red-700 text-sm">{issue.impact}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(issue.severity)}`}>
                {issue.severity}
              </span>
            </div>
            <div className="mt-3 p-3 bg-white rounded border border-red-200">
              <p className="text-sm font-mono text-gray-800">{issue.fix}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CriticalIssues;