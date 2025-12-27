const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { convertNaturalLanguageToSQL } = require('./nlp-query-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 26257,
  database: process.env.DB_NAME || 'pod_market',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  application_name: 'pod-market-api'
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ Connected to CockroachDB successfully');
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'POD Market API is running' });
});

app.get('/api/stores', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stores ORDER BY code');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stores:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/query', async (req, res) => {
  try {
    const { query: naturalQuery } = req.body;
    
    if (!naturalQuery) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`📝 Natural Language Query: "${naturalQuery}"`);

    const { sql, explanation } = convertNaturalLanguageToSQL(naturalQuery);
    
    console.log(`🔍 Generated SQL: ${sql}`);

    const startTime = Date.now();
    const result = await pool.query(sql);
    const executionTime = Date.now() - startTime;

    res.json({
      success: true,
      naturalQuery,
      sql,
      explanation,
      data: result.rows,
      rowCount: result.rows.length,
      executionTime: `${executionTime}ms`
    });

  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      naturalQuery: req.body.query
    });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM stores) AS stores_count,
        (SELECT COUNT(*) FROM products) AS products_count,
        (SELECT COUNT(*) FROM sales) AS sales_count,
        (SELECT COUNT(*) FROM sale_items) AS sale_items_count,
        (SELECT SUM(total) FROM sales) AS total_revenue
    `);
    
    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Connected to CockroachDB at ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 26257}`);
});

