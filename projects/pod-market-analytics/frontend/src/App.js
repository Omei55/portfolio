import React, { useState, useEffect } from 'react';
import './App.css';
import QueryInterface from './components/QueryInterface';
import ResultsDisplay from './components/ResultsDisplay';
import StatsPanel from './components/StatsPanel';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function App() {
  const [queryResult, setQueryResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleQuery = async (query) => {
    setLoading(true);
    setQueryResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      setQueryResult(data);
      
      if (data.success) {
        fetchStats();
      }
    } catch (error) {
      setQueryResult({
        success: false,
        error: error.message,
        naturalQuery: query
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🏪 POD Market Analytics</h1>
        <p>Ask questions in natural language about your sales data</p>
      </header>

      <StatsPanel stats={stats} />

      <main className="App-main">
        <QueryInterface 
          onQuery={handleQuery} 
          loading={loading}
        />

        <ResultsDisplay 
          result={queryResult}
          loading={loading}
        />
      </main>

      <footer className="App-footer">
        <p>Powered by CockroachDB Multi-Node Cluster | Multi-Region Data Distribution</p>
      </footer>
    </div>
  );
}

export default App;

