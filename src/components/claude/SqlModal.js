import React from 'react';
import { Code, Copy, X } from 'lucide-react';

/**
 * Modal component for displaying SQL queries
 * 
 * @param {Object} props Component properties
 * @param {boolean} props.isOpen Whether the modal is open
 * @param {Function} props.onClose Function to close the modal
 * @param {string} props.sql SQL query to display
 * @param {string} props.description Description of the SQL query
 * @param {Function} props.copySqlToClipboard Function to copy SQL to clipboard
 * @returns {JSX.Element} SQL modal component
 */
const SqlModal = ({ isOpen, onClose, sql, description, copySqlToClipboard }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl">
        {/* Modal header */}
        <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Code size={18} />
            {description}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={copySqlToClipboard}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Copy SQL to clipboard"
            >
              <Copy size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        
        {/* SQL code display */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-4rem)]">
          <pre className="bg-gray-50 p-4 rounded border text-sm overflow-x-auto whitespace-pre-wrap">
            <code>{sql}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default SqlModal;
