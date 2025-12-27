function convertNaturalLanguageToSQL(naturalQuery) {
  const query = naturalQuery.toLowerCase().trim();
  let sql = '';
  let explanation = '';

  if (query.match(/sales?\s+(in|during|for)\s+(today|yesterday|this\s+week|this\s+month|last\s+month)/i)) {
    let dateFilter = '';
    if (query.includes('today')) {
      dateFilter = "DATE(txn_ts) = CURRENT_DATE";
    } else if (query.includes('yesterday')) {
      dateFilter = "DATE(txn_ts) = CURRENT_DATE - INTERVAL '1 day'";
    } else if (query.includes('this week')) {
      dateFilter = "txn_ts >= DATE_TRUNC('week', CURRENT_DATE)";
    } else if (query.includes('this month')) {
      dateFilter = "txn_ts >= DATE_TRUNC('month', CURRENT_DATE)";
    } else if (query.includes('last month')) {
      dateFilter = "txn_ts >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND txn_ts < DATE_TRUNC('month', CURRENT_DATE)";
    }
    
    if (dateFilter) {
      sql = `SELECT DATE(txn_ts) AS date, COUNT(*) AS transaction_count, SUM(total) AS total_revenue 
             FROM sales 
             WHERE ${dateFilter} 
             GROUP BY DATE(txn_ts) 
             ORDER BY date DESC`;
      explanation = `Showing sales for the specified time period`;
    }
  }
  
  else if (query.match(/sales?\s+(at|in|for)\s+(.+?)(\s+market|\s+store|$)/i) || 
      query.match(/what\s+are\s+the\s+sales?\s+(at|in|for)\s+(.+)/i) ||
      query.match(/revenue\s+(at|in|for)\s+(.+)/i)) {
    
    const storeMatch = query.match(/(?:at|in|for)\s+(.+?)(?:\s+market|\s+store|$)/);
    if (storeMatch) {
      const storeName = storeMatch[1].trim();
      if (storeName.includes('tempe')) {
        sql = `SELECT store_code, SUM(total) AS total_revenue, COUNT(*) AS transaction_count 
               FROM sales 
               WHERE store_code = 'POD-TEMPE' 
               GROUP BY store_code`;
        explanation = `Showing total sales for POD Market - Tempe`;
      } else if (storeName.includes('poly') || storeName.includes('polytechnic')) {
        sql = `SELECT store_code, SUM(total) AS total_revenue, COUNT(*) AS transaction_count 
               FROM sales 
               WHERE store_code = 'POD-POLY' 
               GROUP BY store_code`;
        explanation = `Showing total sales for POD Market - Polytechnic`;
      } else if (storeName.includes('west') || storeName.includes('wv')) {
        sql = `SELECT store_code, SUM(total) AS total_revenue, COUNT(*) AS transaction_count 
               FROM sales 
               WHERE store_code = 'POD-WV' 
               GROUP BY store_code`;
        explanation = `Showing total sales for POD Market - West Valley`;
      } else if (storeName.includes('downtown') || storeName.includes('dtphx')) {
        sql = `SELECT store_code, SUM(total) AS total_revenue, COUNT(*) AS transaction_count 
               FROM sales 
               WHERE store_code = 'POD-DTPHX' 
               GROUP BY store_code`;
        explanation = `Showing total sales for POD Market - Downtown Phoenix`;
      } else {
        sql = `SELECT sa.store_code, s.name, SUM(sa.total) AS total_revenue, COUNT(*) AS transaction_count 
               FROM sales sa 
               JOIN stores s ON sa.store_code = s.code 
               GROUP BY sa.store_code, s.name 
               ORDER BY total_revenue DESC`;
        explanation = `Showing total sales for all stores`;
      }
    } else {
      sql = `SELECT sa.store_code, s.name, SUM(sa.total) AS total_revenue, COUNT(*) AS transaction_count 
             FROM sales sa 
             JOIN stores s ON sa.store_code = s.code 
             GROUP BY sa.store_code, s.name 
             ORDER BY total_revenue DESC`;
      explanation = `Showing total sales for all stores`;
    }
  }
  
  
  else if (query.match(/total\s+(sales?|revenue)/i) || query.match(/how\s+much\s+(revenue|sales?)/i)) {
    sql = `SELECT SUM(total) AS total_revenue, COUNT(*) AS total_transactions, AVG(total) AS avg_transaction 
           FROM sales`;
    explanation = `Showing total revenue across all stores`;
  }
  
  
  else if (query.match(/top\s+(\d+)?\s*(selling\s+)?products?/i) || 
           query.match(/most\s+sold\s+products?/i) ||
           query.match(/best\s+selling\s+products?/i)) {
    const match = query.match(/top\s+(\d+)/);
    const limit = match ? parseInt(match[1]) : 10;
    sql = `SELECT p.name, 
           COALESCE((SELECT COUNT(*) FROM sale_items si WHERE si.product_id = p.product_id), 0) AS times_sold,
           COALESCE((SELECT SUM(si.qty) FROM sale_items si WHERE si.product_id = p.product_id), 0) AS total_quantity
           FROM products p 
           ORDER BY times_sold DESC, p.name ASC
           LIMIT ${limit}`;
    explanation = `Showing top ${limit} products by sales`;
  }
  
  
  else if (query.match(/sales?\s+by\s+promotion/i) || query.match(/promotion\s+performance/i)) {
    sql = `SELECT promotion, COUNT(*) AS transaction_count, SUM(total) AS total_revenue, AVG(total) AS avg_revenue 
           FROM sales 
           GROUP BY promotion 
           ORDER BY total_revenue DESC`;
    explanation = `Showing sales performance by promotion type`;
  }
  
  
  else if (query.match(/member\s+(sales?|revenue)/i) || query.match(/sales?\s+by\s+member/i)) {
    sql = `SELECT member, COUNT(*) AS transaction_count, SUM(total) AS total_revenue, AVG(total) AS avg_revenue 
           FROM sales 
           GROUP BY member 
           ORDER BY total_revenue DESC`;
    explanation = `Comparing sales between members and non-members`;
  }
  
  
  else if (query.match(/all\s+stores?/i) || query.match(/store\s+summary/i) || query.match(/list\s+stores?/i)) {
    sql = `SELECT s.code AS store_code, s.name, s.region, 
           (SELECT COUNT(*) FROM sales WHERE store_code = s.code) AS transaction_count,
           (SELECT SUM(total) FROM sales WHERE store_code = s.code) AS total_revenue
           FROM stores s 
           ORDER BY s.code`;
    explanation = `Showing summary for all stores`;
  }
  
  
  else if (query.match(/products?\s+(with|containing|like)\s+(.+)/i)) {
    const productMatch = query.match(/(?:with|containing|like)\s+(.+)/);
    if (productMatch) {
      const productName = productMatch[1].trim().replace(/['"]/g, '');
      sql = `SELECT p.name, COUNT(*) AS times_sold, SUM(si.qty) AS total_quantity 
             FROM sale_items si 
             JOIN products p ON si.product_id = p.product_id 
             WHERE p.name ILIKE '%${productName}%' 
             GROUP BY p.name 
             ORDER BY times_sold DESC 
             LIMIT 20`;
      explanation = `Showing sales for products matching "${productName}"`;
    }
  }
  
  else {
    sql = `SELECT store_code, st.name AS store_name, total, txn_ts, promotion, member 
           FROM sales 
           JOIN stores st ON sales.store_code = st.code 
           ORDER BY txn_ts DESC 
           LIMIT 100`;
    explanation = `Showing recent sales transactions (limited to 100 rows)`;
  }

  return { sql, explanation };
}

module.exports = { convertNaturalLanguageToSQL };

