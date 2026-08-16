import React from 'react';

const HelpModal = ({ showHelp, setShowHelp }) => {
  if (!showHelp) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">PostgreSQL Performance Help</h2>
          <button onClick={() => setShowHelp(false)} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">Understanding the Analysis</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Performance Score:</strong> Overall database health (0-100). Above 80 is good, below 60 needs attention.</li>
              <li><strong>Critical Issues:</strong> Problems causing immediate performance impact. Fix these first.</li>
              <li><strong>Sequential Scans:</strong> When PostgreSQL reads entire tables instead of using indexes.</li>
              <li><strong>Dead Tuples:</strong> Old row versions taking up space. High percentages slow down queries.</li>
              <li><strong>Cache Hit Ratio:</strong> Percentage of data served from memory vs disk. Target >95%.</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Before Running Commands</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-orange-700">
              <li><strong>Always backup</strong> your database before making changes</li>
              <li><strong>Test on staging</strong> environment first if possible</li>
              <li><strong>Monitor disk space</strong> - VACUUM and index creation need extra space</li>
              <li><strong>Plan downtime</strong> for configuration changes that require restart</li>
              <li><strong>Monitor performance</strong> after changes to verify improvements</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Security Note</h3>
            <p className="text-sm text-red-700">
              This tool connects directly to your PostgreSQL database. Ensure you're using appropriate credentials 
              and network security. Never use superuser accounts for analysis in production environments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;