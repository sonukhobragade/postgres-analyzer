import React from 'react';
import { BarChart3, Cpu } from 'lucide-react';

const PerformanceOverview = ({ results }) => {
  const getMetricColor = (value, thresholds) => {
    if (value >= thresholds.excellent) return 'text-green-600';
    if (value >= thresholds.good) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <>
      {/* Database Overview */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <BarChart3 className="mr-3 h-6 w-6 text-blue-600" />
          Database Overview: {results.databaseInfo.name}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div className="text-4xl font-bold text-blue-600">{results.overallScore}</div>
            <div className="text-sm font-medium text-blue-700">Performance Score</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold">{results.databaseInfo.size}</div>
            <div className="text-sm text-gray-600">Database Size</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold">{results.databaseInfo.connections}</div>
            <div className="text-sm text-gray-600">Connections</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold">{results.databaseInfo.version}</div>
            <div className="text-sm text-gray-600">Version</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold">{results.databaseInfo.host}</div>
            <div className="text-sm text-gray-600">Host</div>
          </div>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <Cpu className="mr-2 h-5 w-5 text-green-600" />
          Key Performance Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Cache Hit Ratio</div>
            <div className={`text-2xl font-bold ${getMetricColor(results.performanceMetrics.cacheHitRatio, {excellent: 95, good: 85})}`}>
              {results.performanceMetrics.cacheHitRatio}%
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Avg Query Time</div>
            <div className={`text-2xl font-bold ${getMetricColor(300 - results.performanceMetrics.avgQueryTime, {excellent: 200, good: 100})}`}>
              {results.performanceMetrics.avgQueryTime}ms
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Active Connections</div>
            <div className="text-2xl font-bold text-blue-600">
              {results.performanceMetrics.activeConnections}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Connection Usage</div>
            <div className={`text-2xl font-bold ${getMetricColor(80 - results.performanceMetrics.connectionUtilization, {excellent: 60, good: 20})}`}>
              {results.performanceMetrics.connectionUtilization.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PerformanceOverview;