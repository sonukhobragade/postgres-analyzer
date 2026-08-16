import React from 'react';
// DatabaseConnection is not mounted: this build analyses the database the
// server is configured with, and does not take connection details from the UI.
import PerformanceOverview from './components/PerformanceOverview';
import CriticalIssues from './components/CriticalIssues';
import DatabaseAnalytics from './components/DatabaseAnalytics';
import HelpModal from './components/HelpModal';
import ClaudeAnalysis from './components/ClaudeAnalysis';
import { useDatabase } from './hooks/useDatabase';
import { Database, BookOpen } from 'lucide-react';

function App() {
  const {
    results,
    loading,
    showHelp,
    setShowHelp
  } = useDatabase();

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center justify-center">
          <Database className="mr-3 h-10 w-10 text-blue-600" />
          PostgreSQL Performance Analyzer
        </h1>
        <p className="text-gray-600">Real-time database performance analysis with live database connection</p>
        <button
          onClick={() => setShowHelp(true)}
          className="mt-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 flex items-center mx-auto"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Help & Guide
        </button>
      </div>

      <HelpModal showHelp={showHelp} setShowHelp={setShowHelp} />

      {/* PostgreSQL Analysis Section */}
      <div className="my-6 border-t pt-6">
        <ClaudeAnalysis />
      </div>

      {results && (
        <div className="space-y-6">
          <PerformanceOverview results={results} />
          <CriticalIssues issues={results.criticalIssues} />
          <DatabaseAnalytics data={results} loading={loading} />
        </div>
      )}
    </div>
  );
}

export default App;