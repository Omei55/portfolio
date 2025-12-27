import React, { useState } from 'react';
import './QueryInterface.css';

const EXAMPLE_QUERIES = [
  "What are the sales at Tempe market?",
  "Total revenue across all stores",
  "Top 10 selling products",
  "Sales by promotion type",
  "Member vs non-member sales",
  "All stores summary",
  "Sales for this month"
];

function QueryInterface({ onQuery, loading }) {
  const [query, setQuery] = useState('');
  const [showExamples, setShowExamples] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onQuery(query.trim());
    }
  };

  const handleExampleClick = (example) => {
    setQuery(example);
    onQuery(example);
    setShowExamples(false);
  };

  return (
    <div className="query-interface">
      <form onSubmit={handleSubmit} className="query-form">
        <div className="query-input-wrapper">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about your sales data... (e.g., 'What are the sales at Tempe market?')"
            className="query-input"
            disabled={loading}
          />
          <button 
            type="submit" 
            className="query-submit"
            disabled={loading || !query.trim()}
          >
            {loading ? '⏳ Querying...' : '🔍 Query'}
          </button>
        </div>
      </form>

      <div className="examples-section">
        <button
          className="examples-toggle"
          onClick={() => setShowExamples(!showExamples)}
        >
          {showExamples ? '▼' : '▶'} Example Queries
        </button>
        
        {showExamples && (
          <div className="examples-grid">
            {EXAMPLE_QUERIES.map((example, index) => (
              <button
                key={index}
                className="example-query"
                onClick={() => handleExampleClick(example)}
                disabled={loading}
              >
                {example}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default QueryInterface;

