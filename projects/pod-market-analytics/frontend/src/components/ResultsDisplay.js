import React from 'react';
import './ResultsDisplay.css';

function ResultsDisplay({ result, loading }) {
  if (loading) {
    return (
      <div className="results-container loading">
        <div className="spinner"></div>
        <p>Executing query...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="results-container empty">
        <p>👆 Enter a query above to see results</p>
      </div>
    );
  }

  if (!result.success) {
    return (
      <div className="results-container error">
        <h3>❌ Query Error</h3>
        <p className="error-message">{result.error}</p>
        {result.naturalQuery && (
          <p className="query-attempt">Query attempted: "{result.naturalQuery}"</p>
        )}
      </div>
    );
  }

  const { data, naturalQuery, sql, explanation, rowCount, executionTime } = result;

  if (!data || data.length === 0) {
    return (
      <div className="results-container empty">
        <h3>✅ Query executed successfully</h3>
        <p>{explanation}</p>
        <p className="execution-info">No results found. (Executed in {executionTime})</p>
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <div className="results-container">
      <div className="results-header">
        <h3>✅ Query Results</h3>
        <div className="result-meta">
          <span className="explanation">{explanation}</span>
          <span className="row-count">{rowCount} row{rowCount !== 1 ? 's' : ''}</span>
          <span className="execution-time">⏱️ {executionTime}</span>
        </div>
      </div>

      <div className="query-details">
        <div className="query-detail">
          <strong>Natural Language Query:</strong>
          <p>"{naturalQuery}"</p>
        </div>
        <details className="sql-details">
          <summary>View Generated SQL</summary>
          <pre className="sql-code">{sql}</pre>
        </details>
      </div>

      <div className="table-wrapper">
        <table className="results-table">
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th key={index}>{formatColumnName(col)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col, colIndex) => (
                  <td key={colIndex}>{formatCellValue(row[col])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatColumnName(name) {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

function formatCellValue(value) {
  if (value === null || value === undefined) {
    return <em>null</em>;
  }
  
  if (typeof value === 'number') {
    if (value.toString().includes('.') && value < 10000) {
      return `$${value.toFixed(2)}`;
    }
    return value.toLocaleString();
  }
  
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    return new Date(value).toLocaleString();
  }
  
  return value;
}

export default ResultsDisplay;

