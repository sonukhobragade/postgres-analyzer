import React, { useState } from 'react';
import { InfoTooltip } from '../Tooltip';
import { Activity, CheckCircle, AlertTriangle, AlertCircle, Clipboard } from 'lucide-react';

/**
 * Component for displaying PostgreSQL performance recommendations
 * 
 * @param {Object} props Component properties
 * @param {Array} props.recommendations Array of database recommendations
 * @param {Function} props.showSqlQuery Function to display SQL query details
 * @returns {JSX.Element} Recommendations panel component
 */
const RecommendationsPanel = ({ recommendations, showSqlQuery }) => {
  const [activeFilters, setActiveFilters] = useState(['All']);
  const [expandedRecs, setExpandedRecs] = useState({});
  
  if (!recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-5 mb-6">
        <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
          <Activity size={20} /> Recommended Actions
          <InfoTooltip content="Actionable recommendations based on your database analysis" />
        </h4>
        <div className="text-center py-8 text-gray-500">
          <CheckCircle size={40} className="mx-auto mb-3 text-green-500 opacity-80" />
          <p className="text-lg">No optimization actions needed</p>
          <p className="text-sm">Your database appears to be running optimally</p>
        </div>
      </div>
    );
  }
  
  // Group recommendations by priority
  const priorityGroups = {
    High: recommendations.filter(rec => rec.priority === 'High'),
    Medium: recommendations.filter(rec => rec.priority === 'Medium'),
    Low: recommendations.filter(rec => rec.priority === 'Low' || !rec.priority)
  };
  
  const toggleFilter = (filter) => {
    if (filter === 'All') {
      setActiveFilters(['All']);
    } else {
      const newFilters = activeFilters.includes('All') 
        ? [filter]
        : activeFilters.includes(filter)
          ? activeFilters.filter(f => f !== filter)
          : [...activeFilters, filter];
      
      setActiveFilters(newFilters.length === 0 ? ['All'] : newFilters);
    }
  };
  
  const toggleExpanded = (index) => {
    setExpandedRecs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        // Notify user with a small notification
        const notification = document.createElement('div');
        notification.textContent = 'Copied to clipboard!';
        notification.style.cssText = 'position: fixed; bottom: 20px; right: 20px; padding: 10px 15px; background: #4ade80; color: white; border-radius: 4px; z-index: 1000;';
        document.body.appendChild(notification);
        
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 2000);
      });
  };
  
  // Filter recommendations based on active filters
  const filteredRecs = activeFilters.includes('All')
    ? recommendations
    : recommendations.filter(rec => activeFilters.includes(rec.priority));

  return (
    <div className="bg-white rounded-lg shadow-sm border p-5 mb-6">
      <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-2">
        <Activity size={20} /> Recommended Actions
        <InfoTooltip content="Actionable recommendations based on your database analysis" />
        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
          {recommendations.length} action{recommendations.length !== 1 ? 's' : ''}
        </span>
      </h4>
      
      {/* Priority filter buttons */}
      <div className="flex flex-wrap gap-2 mb-4 mt-3">
        <button 
          onClick={() => toggleFilter('All')} 
          className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
            activeFilters.includes('All') ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          All
        </button>
        <button 
          onClick={() => toggleFilter('High')} 
          className={`px-3 py-1 text-xs font-medium rounded-full transition-colors flex items-center gap-1 ${
            activeFilters.includes('High') && !activeFilters.includes('All') ? 'bg-red-800 text-white' : 'bg-red-50 text-red-700'
          }`}
        >
          <AlertCircle size={12} /> High Priority ({priorityGroups.High.length})
        </button>
        <button 
          onClick={() => toggleFilter('Medium')} 
          className={`px-3 py-1 text-xs font-medium rounded-full transition-colors flex items-center gap-1 ${
            activeFilters.includes('Medium') && !activeFilters.includes('All') ? 'bg-amber-700 text-white' : 'bg-amber-50 text-amber-700'
          }`}
        >
          <AlertTriangle size={12} /> Medium Priority ({priorityGroups.Medium.length})
        </button>
        <button 
          onClick={() => toggleFilter('Low')} 
          className={`px-3 py-1 text-xs font-medium rounded-full transition-colors flex items-center gap-1 ${
            activeFilters.includes('Low') && !activeFilters.includes('All') ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-700'
          }`}
        >
          <Activity size={12} /> Low Priority ({priorityGroups.Low.length})
        </button>
      </div>
      
      <div className="space-y-4">
        {filteredRecs.map((rec, index) => {
          const isExpanded = expandedRecs[index] || false;
          return (
            <div key={index} className={`bg-white rounded-lg border p-4 transition-all ${isExpanded ? 'shadow-md' : ''}`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${
                    rec.priority === 'High' ? 'bg-red-100 text-red-800' : 
                    rec.priority === 'Medium' ? 'bg-amber-100 text-amber-800' : 
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {rec.priority === 'High' && <AlertCircle size={12} />}
                    {rec.priority === 'Medium' && <AlertTriangle size={12} />}
                    {(!rec.priority || rec.priority === 'Low') && <Activity size={12} />}
                    <span>{rec.priority || 'Low'} Priority</span>
                  </div>
                  <h5 className="font-semibold">{rec.issue}</h5>
                </div>
                <button 
                  onClick={() => toggleExpanded(index)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg 
                    className={`h-5 w-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              
              <p className="text-sm text-gray-700 mb-3">{rec.solution}</p>
              
              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 mt-3">
                {rec.query && (
                  <>
                    <button 
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded hover:bg-blue-100 transition flex items-center gap-1"
                      onClick={() => showSqlQuery(rec.query, `${rec.issue} - Solution Query`)}
                    >
                      <span className="text-xs font-semibold">SQL</span> View Query
                    </button>
                    <button 
                      className="px-3 py-1.5 bg-gray-50 text-gray-700 text-sm rounded hover:bg-gray-100 transition flex items-center gap-1"
                      onClick={() => copyToClipboard(rec.query)}
                    >
                      <Clipboard size={14} /> Copy SQL
                    </button>
                  </>
                )}
                {isExpanded && rec.details && (
                  <div className="w-full mt-3 bg-gray-50 p-3 rounded text-sm">
                    <h6 className="font-semibold mb-1">Additional Details:</h6>
                    <p>{rec.details}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Empty state for when filters return no results */}
      {filteredRecs.length === 0 && (
        <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
          <p>No recommendations match the selected filters</p>
        </div>
      )}
    </div>
  );
};

export default RecommendationsPanel;
