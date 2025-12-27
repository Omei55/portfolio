import React from 'react';
import './StatsPanel.css';

function StatsPanel({ stats }) {
  if (!stats) {
    return (
      <div className="stats-panel loading">
        <p>Loading statistics...</p>
      </div>
    );
  }

  const formatCurrency = (value) => {
    if (!value) return '$0.00';
    return `$${parseFloat(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatNumber = (value) => {
    if (!value) return '0';
    return parseInt(value).toLocaleString();
  };

  return (
    <div className="stats-panel">
      <div className="stat-card">
        <div className="stat-icon">🏪</div>
        <div className="stat-content">
          <div className="stat-value">{formatNumber(stats.stores_count)}</div>
          <div className="stat-label">Stores</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">📦</div>
        <div className="stat-content">
          <div className="stat-value">{formatNumber(stats.products_count)}</div>
          <div className="stat-label">Products</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">🧾</div>
        <div className="stat-content">
          <div className="stat-value">{formatNumber(stats.sales_count)}</div>
          <div className="stat-label">Transactions</div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">🛒</div>
        <div className="stat-content">
          <div className="stat-value">{formatNumber(stats.sale_items_count)}</div>
          <div className="stat-label">Items Sold</div>
        </div>
      </div>

      <div className="stat-card highlight">
        <div className="stat-icon">💰</div>
        <div className="stat-content">
          <div className="stat-value">{formatCurrency(stats.total_revenue)}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
      </div>
    </div>
  );
}

export default StatsPanel;

