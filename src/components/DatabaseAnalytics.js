import React from 'react';
import AnalysisSummary from './AnalysisSummary';
import TableAnalysis from './TableAnalysis';
import SlowQueries from './SlowQueries';
import Partitioning from './Partitioning';
import BlockingQueries from './BlockingQueries';
import ConnectionDetails from './ConnectionDetails';

/**
 * Main container component for all database analytics features
 * 
 * @param {Object} props Component properties
 * @param {Object} props.data The complete analysis data
 * @param {boolean} props.loading Whether data is loading
 * @returns {JSX.Element} DatabaseAnalytics component
 */
const DatabaseAnalytics = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
        <p className="mt-2">Analyzing database performance...</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="mt-4">
      <AnalysisSummary analysisData={data} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Main metrics on the left side */}
        <div>
          <TableAnalysis tables={data.tables} />
          <SlowQueries queries={data.slowQueries} />
          <ConnectionDetails 
            connections={data.connections} 
            blockingQueries={data.blockingQueries} 
            partitions={data.partitioning} 
            users={data.users}
          />
        </div>
        
        {/* Additional metrics on the right side */}
        <div>
          <BlockingQueries blockingQueries={data.blockingQueries} />
          <Partitioning partitioning={data.partitioning} />
        </div>
      </div>
    </div>
  );
};

export default DatabaseAnalytics;
