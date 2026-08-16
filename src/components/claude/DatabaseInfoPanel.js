import React from 'react';
import { InfoTooltip } from '../Tooltip';

/**
 * Component displaying database information
 * 
 * @param {Object} props Component properties
 * @param {Object} props.databaseInfo Database information data
 * @returns {JSX.Element} Database information panel
 */
const DatabaseInfoPanel = ({ databaseInfo }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
      <h5 className="font-bold text-gray-700 mb-3 pb-2 border-b flex items-center">
        Database Information
        <InfoTooltip content="General information about your PostgreSQL database instance" />
      </h5>
      <div className="space-y-2">
        <p><span className="font-medium">Version:</span> {databaseInfo?.version || 'N/A'}</p>
        <p><span className="font-medium">Size:</span> {databaseInfo?.size || 'N/A'}</p>
        <p><span className="font-medium">Max Connections:</span> {databaseInfo?.max_connections || 'N/A'}</p>
      </div>
    </div>
  );
};

export default DatabaseInfoPanel;
