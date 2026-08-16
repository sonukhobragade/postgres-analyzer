/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import ConnectionPanel from './ConnectionPanel';
import DatabaseInfoPanel from './DatabaseInfoPanel';
import CacheHitPanel from './CacheHitPanel';
import TablesPanel from './TablesPanel';
import SlowQueriesPanel from './SlowQueriesPanel';
import IndexesPanel from './IndexesPanel';
import ConnectionsPanel from './ConnectionsPanel';
import LocksPanel from './LocksPanel';
import RecommendationsPanel from './RecommendationsPanel';
import SqlModal from './SqlModal';
import AnalysisSummary from '../AnalysisSummary';
import DatabaseSelector from './DatabaseSelector';

/**
 * Main component for Claude-like analysis of PostgreSQL database
 * Refactored into smaller, modular components
 * 
 * @returns {JSX.Element} Claude Analysis component
 */
const ClaudeAnalysis = () => {
  const [connectionDetails, setConnectionDetails] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('unknown');
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);
  
  // SQL query display modal state
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [currentSql, setCurrentSql] = useState('');
  const [sqlDescription, setSqlDescription] = useState('');
  
  // Add state for active tooltips
  const [activeTooltip, setActiveTooltip] = useState(null);
  
  // Function to toggle tooltip visibility
  const toggleTooltip = (id) => {
    setActiveTooltip(activeTooltip === id ? null : id);
  };
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState({
    tables: 1,
    slowQueries: 1,
    indexes: 1
  });
  
  const ITEMS_PER_PAGE = 5;
  const [serverConnection, setGcpConnection] = useState(null);
  const [loadingConnection, setLoadingConnection] = useState(false);
  
  // Load connections on component mount
  useEffect(() => {
    // First load the connection
    loadGcpConnection().then(() => {
      // Don't auto-run analysis anymore, wait for user to select a database and click Analyze
      console.log('Connections loaded, waiting for user selection...');
    });
  }, []);
  
  // Function to show SQL query in modal
  const showSqlQuery = (sql, description) => {
    // Ensure SQL is a string and properly formatted
    const formattedSql = typeof sql === 'string' ? sql : JSON.stringify(sql, null, 2);
    setCurrentSql(formattedSql);
    setSqlDescription(description || 'SQL Query');
    setShowSqlModal(true);
  };
  
  // Function to view full query details from slow queries table
  const viewQueryDetails = (query, avgTime, dbTime) => {
    // Use query_full if available, otherwise fall back to query
    const queryText = query?.query_full || query || 'Query details not available';
    const description = `Slow query (${avgTime}ms, ${dbTime}% DB time)`;
    showSqlQuery(queryText, description);
  };
  
  // Function to copy SQL to clipboard
  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(currentSql)
      .then(() => {
        // Use a more subtle notification instead of an alert
        const notification = document.createElement('div');
        notification.textContent = 'SQL copied to clipboard!';
        notification.style.cssText = 'position: fixed; bottom: 20px; right: 20px; padding: 10px 15px; background: #4ade80; color: white; border-radius: 4px; z-index: 1000;';
        document.body.appendChild(notification);
        
        // Remove the notification after 2 seconds
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy SQL:', err);
      });
  };

  /**
   * Load connection details from backend
   * @returns {Promise} Promise that resolves when connection is loaded
   */
  const loadGcpConnection = async () => {
    setLoadingConnection(true);
    setError(null);
    
    try {
      // We're now using the connections API which gives us all available connections
      const response = await fetch('/api/connections');
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.connections) {
        // Store the connections and select the local one by default
        const connections = data.connections;
        setGcpConnection(connections);
        
        // Set local connection as default if available
        if (connections.local) {
          setSelectedConnection('local');
        } else if (Object.keys(connections).length > 0) {
          // Otherwise select the first available connection
          setSelectedConnection(Object.keys(connections)[0]);
        }
        
        console.log('Database connections loaded:', connections);
        return Promise.resolve(true);
      } else {
        setError(data.error || 'Failed to load database connections');
        return Promise.resolve(false);
      }
    } catch (err) {
      console.error('Error loading database connections:', err);
      setError('Failed to load database connections: ' + err.message);
      return Promise.resolve(false);
    } finally {
      setLoadingConnection(false);
    }
  };

  /**
   * Check the database connection health for the selected connection
   * @returns {Promise<boolean>} Promise that resolves to true if connected successfully
   */
  const checkConnectionHealth = async () => {
    if (!selectedConnection) {
      setError('No database connection selected');
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Test the selected connection
      const response = await fetch(`/api/connections/test/${selectedConnection}`);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Connection health check:', data);
      
      setConnectionStatus(data);
      
      return data.connected === true;
    } catch (err) {
      console.error('Connection health check failed:', err);
      setError(`Connection failed: ${err.message}`);
      setConnectionStatus({
        connected: false,
        error: err.message
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Trigger analysis of the selected database
   */
  const runAnalysis = async () => {
    if (!selectedConnection) {
      setError('Please select a database connection first');
      return;
    }
    
    setLoading(true);
    setError(null);
    setAnalysisData(null); // Clear previous results
    
    try {
      console.log(`Running database analysis on connection: ${selectedConnection}...`);
      
      // First check connection health
      const isConnected = await checkConnectionHealth();
      
      if (!isConnected) {
        throw new Error('Database connection failed. Please check your connection settings.');
      }
      
      // Run analysis with selected connection
      const response = await fetch('/api/claude/analyze-for-claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionId: selectedConnection }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Server returned ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Analysis results:', data);
      console.log('Response structure:', Object.keys(data));
      
      if (data.success && data.data) {
        // The actual analysis data is nested under the 'data' property
        console.log('Analysis data properties:', Object.keys(data.data));
        console.log('Data sample:', {
          tables: Array.isArray(data.data.tables) ? `${data.data.tables.length} items` : 'Missing',
          slowQueries: Array.isArray(data.data.slowQueries) ? `${data.data.slowQueries.length} items` : 'Missing',
          indexes: Array.isArray(data.data.indexes) ? `${data.data.indexes.length} items` : 'Missing',
          cacheHitRatio: data.data.cacheHitRatio || 'Missing'
        });
        
        setAnalysisData(data.data);
      } else {
        throw new Error(data.error || 'Unknown error during analysis');
      }
    } catch (err) {
      console.error('Error running analysis:', err);
      
      // Format the error message for display
      let errorMessage = err.message || 'Unknown error';
      
      // Check for specific proxy-related errors
      if (errorMessage.includes('Proxy') || 
          errorMessage.includes('invalid response') ||
          errorMessage.includes('Unexpected token')) {
        errorMessage = 'Connection blocked by a proxy. Try connecting through a VPN or request network access to this database.';
      }
      
      setError('Failed to run analysis: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate recommendations based on analysis data
   * Returns detailed, actionable recommendations with priority levels and SQL queries
   * @returns {Array} Array of recommendation objects
   */
  const generateRecommendations = () => {
    if (!analysisData) return [];
    
    const recommendations = [];
    
    // Check cache hit ratio
    if (analysisData?.cacheHitRatio && analysisData.cacheHitRatio < 95) {
      recommendations.push({
        issue: `Low cache hit ratio: ${analysisData.cacheHitRatio}%`,
        solution: "Increase shared_buffers in PostgreSQL configuration to improve memory caching",
        priority: analysisData.cacheHitRatio < 80 ? 'High' : 'Medium',
        details: `Your cache hit ratio is ${analysisData.cacheHitRatio}%, which indicates that PostgreSQL isn't finding data in memory often enough. This leads to more disk reads and slower query performance. Increasing shared_buffers allows PostgreSQL to cache more data in memory.`,
        query: `-- Check cache hit ratio
SELECT 
  ROUND((sum(blks_hit) * 100.0) / (sum(blks_hit) + sum(blks_read)), 2) as cache_hit_ratio 
FROM pg_stat_database 
WHERE datname = current_database();

-- Increase shared_buffers in postgresql.conf
-- shared_buffers = 1GB  -- Adjust based on available RAM (25% of RAM is common)`
      });
    }
    
    // Check for tables without primary keys
    if (analysisData?.tables && analysisData.tables.some(t => !t.has_primary_key)) {
      // tableStats returns the name as `tablename`; `table_name` was always
      // undefined, so this listed "undefined, undefined, undefined".
      const tablesWithoutPK = analysisData.tables
        .filter(t => !t.has_primary_key)
        .map(t => t.tablename || t.table_name)
        .filter(Boolean);
      if (tablesWithoutPK.length > 0) {
        recommendations.push({
          issue: `${tablesWithoutPK.length} tables missing primary keys`,
          solution: `Add primary keys to tables: ${tablesWithoutPK.slice(0, 3).join(', ')}${tablesWithoutPK.length > 3 ? '...' : ''}`,
          priority: 'High',
          details: `Tables without primary keys can cause performance issues and make it harder to maintain data integrity. Primary keys provide a unique identifier for each row and automatically create an index, improving query performance.`,
          query: `-- Find all tables without primary keys
SELECT
  t.table_schema,
  t.table_name
FROM information_schema.tables t
LEFT JOIN information_schema.table_constraints c ON
  c.table_schema = t.table_schema AND
  c.table_name = t.table_name AND
  c.constraint_type = 'PRIMARY KEY'
WHERE
  t.table_schema NOT IN ('pg_catalog', 'information_schema') AND
  t.table_type = 'BASE TABLE' AND
  c.constraint_name IS NULL
ORDER BY t.table_schema, t.table_name;`
        });
      }
    }
    
    // Check for slow queries
    if (analysisData?.slowQueries && analysisData.slowQueries.length > 0) {
      const slowestQuery = analysisData.slowQueries[0];
      if (slowestQuery && slowestQuery.avg_time > 1000) { // Queries taking more than 1 second
        recommendations.push({
          issue: `Slow query detected (${(slowestQuery.avg_time/1000).toFixed(2)}s average execution time)`,
          solution: "Optimize the query or create an index on the relevant columns",
          priority: slowestQuery.avg_time > 5000 ? 'High' : 'Medium',
          details: `This query is consuming ${slowestQuery.db_time || 0}% of total database time. Optimization could significantly improve overall database performance.`,
          query: slowestQuery.query || slowestQuery.query_text || '-- Query details not available'
        });
      }
    }
    
    // Check for unused indexes
    if (analysisData?.indexes && analysisData.indexes.some(i => i.idx_scan === 0 && !i.is_pk && i.idx_size > 1000000)) {
      const unusedIndexes = analysisData.indexes.filter(i => i.idx_scan === 0 && !i.is_pk && i.idx_size > 1000000);
      if (unusedIndexes.length > 0) {
        recommendations.push({
          issue: `${unusedIndexes.length} unused indexes consuming space`,
          solution: "Consider dropping indexes that aren't being used",
          priority: 'Medium',
          details: `Unused indexes waste disk space and can slow down write operations without providing any benefit for queries. Review these indexes and consider dropping them if they're not needed.`,
          query: `-- Find unused indexes
SELECT
  s.schemaname,
  s.relname AS tablename,
  s.indexrelname AS indexname,
  pg_size_pretty(pg_relation_size(s.indexrelid)) AS index_size
FROM pg_catalog.pg_stat_user_indexes s
JOIN pg_catalog.pg_index i ON s.indexrelid = i.indexrelid
WHERE
  s.idx_scan = 0 AND
  NOT i.indisprimary AND
  NOT i.indisunique AND
  pg_relation_size(s.indexrelid) > 1000000
ORDER BY pg_relation_size(s.indexrelid) DESC;

-- Example of dropping an unused index (replace with actual index name):
-- DROP INDEX IF EXISTS schema_name.index_name;`
        });
      }
    }
    
    // Check for bloated tables
    if (analysisData?.tables && analysisData.tables.some(t => t.bloat_ratio > 30)) {
      const bloatedTables = analysisData.tables.filter(t => t.bloat_ratio > 30);
      if (bloatedTables.length > 0) {
        recommendations.push({
          issue: `${bloatedTables.length} tables with high bloat ratio`,
          solution: "Run VACUUM FULL on bloated tables to reclaim space",
          priority: bloatedTables.some(t => t.bloat_ratio > 50) ? 'High' : 'Medium',
          details: `Table bloat occurs when space occupied by dead tuples isn't being reused efficiently. This increases disk usage and slows down queries. VACUUM FULL rebuilds the table to reclaim space, but requires an exclusive lock.`,
          query: `-- Check table bloat
SELECT
  schemaname,
  tablename,
  ROUND(CASE WHEN otta=0 THEN 0.0 ELSE sml.relpages/otta::numeric END,1) AS bloat_ratio,
  CASE WHEN relpages < otta THEN '0' ELSE pg_size_pretty((bs*(sml.relpages-otta)::bigint)::bigint) END AS bloat_size
FROM (
  SELECT
    schemaname, tablename, cc.reltuples, cc.relpages, bs,
    CEIL((cc.reltuples*((datahdr+ma-
      (CASE WHEN datahdr%ma=0 THEN ma ELSE datahdr%ma END))+nullhdr2+4))/(bs-20::float)) AS otta
  FROM (
    SELECT
      ma,bs,schemaname,tablename,
      (datawidth+(hdr+ma-(case when hdr%ma=0 THEN ma ELSE hdr%ma END)))::numeric AS datahdr,
      (maxfracsum*(nullhdr+ma-(case when nullhdr%ma=0 THEN ma ELSE nullhdr%ma END))) AS nullhdr2
    FROM (
      -- Your complex bloat calculation SQL here
      -- This is a simplified placeholder
      SELECT s.nspname AS schemaname, s.relname AS tablename, 8192 AS bs, 8 AS ma, 24 AS hdr,
      24 AS nullhdr, 50 AS datawidth, 0.99 AS maxfracsum, c.reltuples, c.relpages
      FROM pg_class c JOIN pg_namespace s ON (c.relnamespace = s.oid)
      WHERE c.relkind = 'r' AND s.nspname NOT IN ('pg_catalog', 'information_schema')
    ) AS foo
  ) AS rs
  JOIN pg_class cc ON cc.relname = rs.tablename
  JOIN pg_namespace nn ON cc.relnamespace = nn.oid AND nn.nspname = rs.schemaname
) AS sml
WHERE sml.relpages - otta > 128
ORDER BY bloat_ratio DESC LIMIT 20;

-- VACUUM FULL example (replace with actual table name):
-- VACUUM FULL schema_name.table_name;`
        });
      }
    }
    
    // Check for stale connections
    if (analysisData?.connections && analysisData.connections.stale_connections > 5) {
      recommendations.push({
        issue: `${analysisData.connections.stale_connections} stale database connections detected`,
        solution: "Review application connection pooling and implement timeout settings",
        priority: analysisData.connections.stale_connections > 20 ? 'High' : 'Medium',
        details: `Stale connections consume server resources and can prevent new connections from being established when the maximum connection limit is reached. Configure connection pooling properly in your applications and implement idle timeout settings.`,
        query: `-- Check for stale connections
SELECT 
  pid, 
  usename, 
  application_name,
  client_addr, 
  state, 
  ROUND(EXTRACT(EPOCH FROM now() - state_change)) as seconds_in_state,
  ROUND(EXTRACT(EPOCH FROM now() - query_start)) as seconds_since_query_start,
  query
FROM pg_stat_activity 
WHERE state = 'idle' AND EXTRACT(EPOCH FROM now() - state_change) > 1800 -- 30 minutes
ORDER BY seconds_in_state DESC;

-- Terminate a specific connection
-- SELECT pg_terminate_backend(pid);`
      });
    }
    
    return recommendations;
  };

  return (
    <div className="py-4">
      <h2 className="text-2xl font-bold mb-6">PostgreSQL Database Analyzer</h2>
      
      {/* Database Selection & Analyze Button */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
        <div className="flex flex-col">
          {/* Database Selector Component */}
          <DatabaseSelector 
            selectedConnection={selectedConnection} 
            onConnectionChange={setSelectedConnection} 
          />
          
          <div className="flex flex-wrap justify-between items-center mt-3">
            <div>
              {connectionStatus && connectionStatus.connected && (
                <div className="text-sm">
                  <div className="text-green-600 font-medium">✓ Connected</div>
                  <div><span className="font-semibold">Version:</span> {connectionStatus.version || 'N/A'}</div>
                </div>
              )}
              {(!connectionStatus || !connectionStatus.connected) && (
                <div className="text-sm text-amber-600">
                  Not connected. Select a database and click Analyze.
                </div>
              )}
              {error && (
                <div className="text-sm text-red-600 mt-1">
                  {error}
                </div>
              )}
            </div>
            <div>
              <button
                onClick={runAnalysis}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                disabled={loading || !selectedConnection}
              >
                {loading ? 'Running Analysis...' : 'Analyze Database'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Analysis Results */}
      {analysisData && (
        <div className="mt-6">
          <h4 className="text-lg font-bold mb-4">PostgreSQL Analysis Results</h4>
          
          {/* Debug info */}
          <div className="mb-4 p-2 bg-gray-100 rounded text-sm">
            <details>
              <summary className="cursor-pointer font-bold">Debug Info (click to expand)</summary>
              <div className="mt-2 overflow-auto">
                <p>Analysis data keys: {Object.keys(analysisData).join(', ')}</p>
                <p>Tables count: {analysisData.tables?.length || 'N/A'}</p>
                <p>Slow queries count: {analysisData.slowQueries?.length || 'N/A'}</p>
                <p>Indexes count: {analysisData.indexes?.length || 'N/A'}</p>
                <p>Cache hit ratio: {analysisData.cacheHitRatio || 'N/A'}</p>
              </div>
            </details>
          </div>
          
          {/* Recommendations Panel - Always show this */}
          <RecommendationsPanel 
            recommendations={generateRecommendations()} 
            showSqlQuery={showSqlQuery} 
          />
          
          {/* Analysis Summary */}
          <AnalysisSummary analysisData={analysisData} />
          
          {/* Database Info Panel */}
          {analysisData.databaseInfo && (
            <DatabaseInfoPanel databaseInfo={analysisData.databaseInfo} />
          )}
          
          {/* Cache Hit Ratio Panel */}
          {typeof analysisData.cacheHitRatio !== 'undefined' && (
            <CacheHitPanel cacheHitRatio={analysisData.cacheHitRatio} />
          )}
          
          {/* Tables Panel */}
          {analysisData.tables && analysisData.tables.length > 0 && (
            <TablesPanel 
              tables={analysisData.tables} 
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          )}
          
          {/* Slow Queries Panel */}
          {analysisData.slowQueries && analysisData.slowQueries.length > 0 && (
            <SlowQueriesPanel 
              slowQueries={analysisData.slowQueries} 
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemsPerPage={ITEMS_PER_PAGE}
              viewQueryDetails={viewQueryDetails}
            />
          )}
          
          {/* Indexes Panel */}
          {analysisData.indexes && analysisData.indexes.length > 0 && (
            <IndexesPanel 
              indexes={analysisData.indexes} 
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          )}
          
          {/* Connections Panel */}
          {analysisData.connections && (
            <ConnectionsPanel 
              connections={analysisData.connections}
              activeConnections={analysisData.activeConnections || []}
              partitions={analysisData.partitions || []}
              blockingQueries={analysisData.blockingQueries || []}
              users={analysisData.users || []}
            />
          )}
          
          {/* Locks Panel */}
          {analysisData.locks && analysisData.locks.length > 0 && (
            <LocksPanel locks={analysisData.locks} />
          )}
          
          {/* All specific sections are now hidden directly in their respective components */}
        </div>
      )}
      
      {/* SQL Query Modal */}
      <SqlModal 
        isOpen={showSqlModal}
        onClose={() => setShowSqlModal(false)}
        sql={currentSql}
        description={sqlDescription}
        copySqlToClipboard={copySqlToClipboard}
      />
    </div>
  );
};

export default ClaudeAnalysis;
