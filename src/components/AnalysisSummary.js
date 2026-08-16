import React from 'react';

/**
 * Renders a summary of database analysis with recommendations
 * 
 * @param {Object} props Component properties
 * @param {Object} props.analysisData The complete analysis data
 * @returns {JSX.Element} Analysis summary component
 */
const AnalysisSummary = ({ analysisData }) => {
  if (!analysisData) return null;
  
  const { cacheHitRatio, tables, slowQueries, indexes, connections } = analysisData;
  
  // Calculate issues and recommendations
  const issues = [];
  const recommendations = [];
  
  // Cache hit ratio issues
  if (cacheHitRatio < 95) {
    issues.push('Low cache hit ratio');
    recommendations.push({
      issue: 'Low cache hit ratio',
      solution: 'Increase shared_buffers in postgresql.conf. Recommended value is 25% of system RAM for dedicated database servers.',
      priority: 'High'
    });
  }
  
  // Dead tuples issues
  const tablesWithHighDeadTuples = tables?.filter(t => t.dead_tuple_ratio > 20) || [];
  if (tablesWithHighDeadTuples.length > 0) {
    issues.push('High dead tuple ratio in tables');
    recommendations.push({
      issue: `High dead tuple ratio in ${tablesWithHighDeadTuples.length} tables`,
      solution: `Run VACUUM on affected tables: ${tablesWithHighDeadTuples.slice(0, 3).map(t => t.tablename).join(', ')}${tablesWithHighDeadTuples.length > 3 ? '...' : ''}`,
      priority: 'Medium'
    });
  }
  
  // Sequential scan issues
  const tablesWithHighSeqScans = tables?.filter(t => t.seq_scan_ratio > 50 && t.live_tuples > 1000) || [];
  if (tablesWithHighSeqScans.length > 0) {
    issues.push('High sequential scan ratio');
    recommendations.push({
      issue: `High sequential scan ratio in ${tablesWithHighSeqScans.length} tables`,
      solution: `Consider adding indexes to: ${tablesWithHighSeqScans.slice(0, 3).map(t => t.tablename).join(', ')}${tablesWithHighSeqScans.length > 3 ? '...' : ''}`,
      priority: 'Medium'
    });
  }
  
  // Slow queries issues
  const significantSlowQueries = slowQueries?.filter(q => q.percentage > 10) || [];
  if (significantSlowQueries.length > 0) {
    issues.push('Significant slow queries detected');
    recommendations.push({
      issue: `${significantSlowQueries.length} queries consuming significant database time`,
      solution: 'Optimize these queries by adding indexes, rewriting them, or using materialized views',
      priority: 'High'
    });
  }
  
  // Unused indexes
  const unusedIndexes = indexes?.filter(i => i.index_scans === 0) || [];
  if (unusedIndexes.length > 0) {
    issues.push('Unused indexes detected');
    recommendations.push({
      issue: `${unusedIndexes.length} unused indexes consuming space`,
      solution: `Consider dropping unused indexes to improve write performance and save space`,
      priority: 'Low'
    });
  }
  
  // Idle in transaction
  if (connections?.idle_in_transaction > 0) {
    issues.push('Idle in transaction connections');
    recommendations.push({
      issue: `${connections.idle_in_transaction} connections idle in transaction`,
      solution: 'Check for abandoned transactions and implement connection timeouts',
      priority: 'Medium'
    });
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
      <h5 className="font-bold text-gray-700 mb-3 pb-2 border-b">Analysis Summary & Recommendations</h5>
      
      {/* Why PostgreSQL Analysis is Important - Hidden as requested */}
      <div className="mb-4" style={{ display: 'none' }}>
        <h6 className="font-semibold text-gray-700 mb-2">Why Database Analysis is Required</h6>
        <p className="text-sm text-gray-600 mb-2">
          Regular PostgreSQL database analysis helps identify performance issues that can slow down your application.
          Think of it as a health check-up for your database that helps prevent problems before users notice them.
        </p>
        <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mb-3">
          <h6 className="font-semibold text-blue-800 mb-1">Key Database Metrics Explained</h6>
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
            <li>
              <span className="font-medium">Cache Hit Ratio:</span> Percentage of data found in memory vs. disk. 
              Higher is better (aim for &gt;95%). Low values mean your database is reading from disk too often, which is slow.
            </li>
            <li>
              <span className="font-medium">Sequential Scan Ratio:</span> How often tables are read from start to end instead of using indexes. 
              High values for large tables mean missing indexes, causing slower performance.
            </li>
            <li>
              <span className="font-medium">Dead Tuples:</span> Rows that were deleted or updated but space hasn't been reclaimed. 
              Too many dead tuples waste space and slow down queries.
            </li>
            <li>
              <span className="font-medium">Slow Queries:</span> Database operations taking excessive time.
              These create bottlenecks for your entire application.
            </li>
            <li>
              <span className="font-medium">Unused Indexes:</span> Indexes that take up space but aren't being used.
              They slow down writes without helping reads.
            </li>
          </ul>
        </div>
        <p className="text-sm text-gray-600 font-medium">Benefits of regular database analysis:</p>
        <ul className="list-disc pl-5 text-sm text-gray-600">
          <li>Faster application response times</li>
          <li>Lower database server costs (by optimizing resources)</li>
          <li>Better user experience with consistent performance</li>
          <li>Prevention of database outages and downtime</li>
          <li>Early warning of growing problems before they become critical</li>
        </ul>
      </div>
      
      {/* Issues Detected */}
      <div className="mb-4">
        <h6 className="font-semibold text-gray-700 mb-2">
          Issues Detected {issues.length === 0 && <span className="text-green-600">(None)</span>}
        </h6>
        {issues.length > 0 && (
          <ul className="list-disc pl-5 text-sm text-gray-600">
            {issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Recommendations */}
      <div>
        <h6 className="font-semibold text-gray-700 mb-2">Recommended Actions</h6>
        {recommendations.length === 0 ? (
          <p className="text-sm text-green-600">No actions needed! Your database appears to be well-optimized.</p>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Based on the analysis, here are specific actions you can take to improve your database performance.
              Focus on high-priority items first for the biggest impact.
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">What This Means</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recommended Solution</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recommendations.map((rec, index) => {
                    // Add explanations based on issue type
                    let explanation = '';
                    if (rec.issue.includes('cache hit ratio')) {
                      explanation = 'Your database is reading too much from disk instead of memory cache.';
                    } else if (rec.issue.includes('sequential scan')) {
                      explanation = 'Tables are being read from start to end instead of using efficient indexes.';
                    } else if (rec.issue.includes('dead tuple')) {
                      explanation = 'Old deleted/updated rows are taking up space and slowing queries.';
                    } else if (rec.issue.includes('slow queries')) {
                      explanation = 'These queries are taking too long and slowing down your application.';
                    } else if (rec.issue.includes('unused indexes')) {
                      explanation = 'These indexes waste space and slow down writes without helping reads.';
                    } else if (rec.issue.includes('idle in transaction')) {
                      explanation = 'Connections are stuck in the middle of transactions, potentially holding locks.';
                    }
                    
                    return (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 text-sm text-gray-900">{rec.issue}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{explanation}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{rec.solution}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            rec.priority === 'High' ? 'bg-red-100 text-red-800' :
                            rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {rec.priority}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      {/* Next Steps */}
      <div className="mt-4 pt-3 border-t" style={{ display: 'none' }}>
        <h6 className="font-semibold text-gray-700 mb-2">Next Steps for Database Optimization</h6>
        
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-md border border-green-100 mb-3">
          <h6 className="font-semibold text-gray-800 mb-2">Practical Action Plan</h6>
          
          <div className="mb-3">
            <p className="font-medium text-gray-700 mb-1">1. Immediate Actions (Today)</p>
            <ul className="list-disc pl-5 text-sm text-gray-600">
              <li>Address any high-priority issues identified in the recommendations</li>
              <li>Run <code className="bg-gray-100 px-1 py-0.5 rounded">VACUUM ANALYZE</code> on tables with high dead tuple ratios</li>
              <li>Check for any long-running transactions that might be blocking other operations</li>
            </ul>
          </div>
          
          <div className="mb-3">
            <p className="font-medium text-gray-700 mb-1">2. Short-term Improvements (This Week)</p>
            <ul className="list-disc pl-5 text-sm text-gray-600">
              <li>Review and optimize the slow queries identified in the analysis</li>
              <li>Add indexes to tables with high sequential scan ratios</li>
              <li>Consider dropping unused indexes to improve write performance</li>
              <li>If cache hit ratio is low, consider increasing <code className="bg-gray-100 px-1 py-0.5 rounded">shared_buffers</code> in PostgreSQL configuration</li>
            </ul>
          </div>
          
          <div>
            <p className="font-medium text-gray-700 mb-1">3. Long-term Strategy (Monthly)</p>
            <ul className="list-disc pl-5 text-sm text-gray-600">
              <li>Schedule automatic <code className="bg-gray-100 px-1 py-0.5 rounded">VACUUM</code> and <code className="bg-gray-100 px-1 py-0.5 rounded">ANALYZE</code> operations</li>
              <li>Set up monitoring alerts for database performance metrics</li>
              <li>Review application code that generates slow queries</li>
              <li>Consider partitioning very large tables for better performance</li>
              <li>Run this PostgreSQL Analyzer tool regularly to track improvements</li>
            </ul>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-3 rounded-md border border-yellow-100 mb-3" style={{ display: 'none' }}>
          <h6 className="font-semibold text-yellow-800 mb-1">Need Help?</h6>
          <p className="text-sm text-gray-700">
            If you're not familiar with database optimization, consider:
          </p>
          <ul className="list-disc pl-5 text-sm text-gray-600">
            <li>Consulting PostgreSQL documentation at <a href="https://www.postgresql.org/docs/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">postgresql.org/docs</a></li>
            <li>Engaging a database administrator (DBA) for complex optimizations</li>
            <li>Using managed database services that handle optimization automatically</li>
          </ul>
        </div>
        
        <div className="bg-purple-50 p-3 rounded-md border border-purple-100 mb-3" style={{ display: 'none' }}>
          <h6 className="font-semibold text-purple-800 mb-2">Understanding PostgreSQL Performance Metrics</h6>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white p-2 rounded shadow-sm">
              <h6 className="font-medium text-purple-700 mb-1">Dead Tuples</h6>
              <p className="text-sm text-gray-700">
                <strong>What they are:</strong> When rows are updated or deleted, PostgreSQL doesn't immediately remove them. 
                The old versions become "dead tuples" that take up space until a VACUUM operation.
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <strong>Impact:</strong> High dead tuple counts waste disk space, slow down queries, and increase table bloat.
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <strong>Solution:</strong> Run <code className="bg-gray-100 px-1 rounded">VACUUM ANALYZE</code> on affected tables 
                and ensure autovacuum is properly configured.
              </p>
            </div>
            
            <div className="bg-white p-2 rounded shadow-sm">
              <h6 className="font-medium text-purple-700 mb-1">Sequential Scans</h6>
              <p className="text-sm text-gray-700">
                <strong>What they are:</strong> When PostgreSQL reads a table from start to end instead of using an index.
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <strong>Impact:</strong> Very inefficient for large tables, causing high disk I/O and slow query performance.
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <strong>Solution:</strong> Create indexes on columns used in WHERE, JOIN, and ORDER BY clauses.
              </p>
            </div>
            
            <div className="bg-white p-2 rounded shadow-sm">
              <h6 className="font-medium text-purple-700 mb-1">Cache Hit Ratio</h6>
              <p className="text-sm text-gray-700">
                <strong>What it is:</strong> Percentage of data found in memory cache vs. having to read from disk.
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <strong>Impact:</strong> Low values mean excessive disk reads, which are much slower than memory access.
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <strong>Solution:</strong> Increase <code className="bg-gray-100 px-1 rounded">shared_buffers</code> in PostgreSQL configuration 
                or add more RAM to your database server.
              </p>
            </div>
            
            <div className="bg-white p-2 rounded shadow-sm">
              <h6 className="font-medium text-purple-700 mb-1">Unused Indexes</h6>
              <p className="text-sm text-gray-700">
                <strong>What they are:</strong> Indexes that take up space but aren't being used by queries.
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <strong>Impact:</strong> Waste disk space and slow down write operations without providing query benefits.
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <strong>Solution:</strong> Drop unused indexes after confirming they're not needed for infrequent operations.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-indigo-50 p-3 rounded-md border border-indigo-100" style={{ display: 'none' }}>
          <h6 className="font-semibold text-indigo-800 mb-2">Useful PostgreSQL Queries</h6>
          <p className="text-sm text-gray-700 mb-2">
            Run these queries directly in your PostgreSQL database to get more detailed insights:
          </p>
          
          <div className="mb-3">
            <p className="font-medium text-gray-700 mb-1 text-sm">Find Tables That Need Indexing:</p>
            <pre className="bg-gray-800 text-green-400 p-2 rounded text-xs overflow-x-auto">
              {`SELECT
  schemaname,
  relname as table_name,
  seq_scan,
  idx_scan,
  n_live_tup as rows_in_table,
  ROUND((seq_scan * 100.0) / NULLIF(seq_scan + idx_scan, 0), 2) as seq_scan_percentage
FROM pg_stat_user_tables
WHERE n_live_tup > 10000
  AND seq_scan > idx_scan
ORDER BY seq_scan_percentage DESC
LIMIT 10;`}
            </pre>
          </div>
          
          <div className="mb-3">
            <p className="font-medium text-gray-700 mb-1 text-sm">Check Tables With High Dead Tuple Ratios:</p>
            <pre className="bg-gray-800 text-green-400 p-2 rounded text-xs overflow-x-auto">
              {`SELECT
  schemaname,
  relname as table_name,
  n_live_tup as live_tuples,
  n_dead_tup as dead_tuples,
  ROUND((n_dead_tup * 100.0) / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_tuple_percentage,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY dead_tuple_percentage DESC
LIMIT 10;`}
            </pre>
          </div>
          
          <div>
            <p className="font-medium text-gray-700 mb-1 text-sm">Find Unused Indexes:</p>
            <pre className="bg-gray-800 text-green-400 p-2 rounded text-xs overflow-x-auto">
              {`SELECT
  s.schemaname,
  s.relname as table_name,
  s.indexrelname as index_name,
  s.idx_scan as index_scans,
  pg_size_pretty(pg_relation_size(i.indexrelid)) as index_size
FROM pg_stat_user_indexes s
JOIN pg_index i ON s.indexrelid = i.indexrelid
WHERE s.idx_scan < 50
  AND NOT i.indisprimary
  AND NOT i.indisunique
ORDER BY s.idx_scan, pg_relation_size(i.indexrelid) DESC
LIMIT 10;`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisSummary;
