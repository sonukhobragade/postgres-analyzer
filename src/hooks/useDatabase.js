import { useState } from 'react';

export const useDatabase = () => {
  const [dbConfig, setDbConfig] = useState({
    host: '',
    port: '5432',
    database: '',
    username: '',
    password: ''
  });
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  // Analysis using connection parameters provided by the user
  const analyzeWithParams = async () => {
    setLoading(true);
    setError(null);
    console.log('Starting database analysis with provided parameters...');
    
    try {
      // Use the analysis endpoint which takes parameters from the request body
      console.log('Fetching from /api/claude/analyze-for-claude with parameters:', {
        ...dbConfig,
        password: '***HIDDEN***'
      });
      
      const response = await fetch('/api/claude/analyze-for-claude', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          username: dbConfig.username,
          password: dbConfig.password,
          useSSL: true // Enable SSL for PostgreSQL
        }),
        // Add credentials to ensure cookies are sent
        credentials: 'include'
      });
      
      console.log('Response received:', response.status, response.statusText);
      console.log('Response headers:', response.headers);
      
      try {
        // Check if response is ok before trying to parse JSON
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        // Parse the JSON response
        const data = await response.json();
        console.log('Response data:', data);
        
        // Check if the response indicates an error
        if (!data.success) {
          // Create a more detailed error message if available
          let errorMessage = data.error || data.message || 'Failed to connect to the database';
          
          // If we have detailed error information, add it to the message
          if (data.details) {
            errorMessage += `: ${data.details.message || ''}`;
            if (data.details.hint) {
              errorMessage += ` (Hint: ${data.details.hint})`;
            }
          }
          
          setError(errorMessage);
          setLoading(false);
          return;
        }
        
        // Success! Set the results
        setResults(data.data);
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        setError(`Error parsing server response: ${jsonError.message}`);
      }
    } catch (fetchError) {
      console.error('Network error during analysis:', fetchError);
      setError(`Network error: ${fetchError.message}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    dbConfig,
    setDbConfig,
    results,
    loading,
    error,
    showHelp,
    setShowHelp,
    analyzeWithParams
  };
};