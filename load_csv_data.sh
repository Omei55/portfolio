#!/bin/bash

# CSV Data Loading Script
# Loads all CSV files from the out/ directory into CockroachDB

set -e

HOST="localhost:26257"
DB="pod_market"
DATA_DIR="out"

echo "📥 Loading CSV data into CockroachDB..."

# Load stores
echo "Loading stores..."
cockroach sql --insecure --host=$HOST --database=$DB <<EOF
IMPORT INTO stores (store_id, code, name, region)
CSV DATA ('file://${PWD}/${DATA_DIR}/stores.csv?skip=1')
WITH skip = '1';
EOF

# Load products
echo "Loading products..."
cockroach sql --insecure --host=$HOST --database=$DB <<EOF
IMPORT INTO products (product_id, name)
CSV DATA ('file://${PWD}/${DATA_DIR}/products.csv?skip=1')
WITH skip = '1';
EOF

# Load sales files (all shards)
echo "Loading sales data..."
for file in ${DATA_DIR}/sales_*.csv; do
    if [ -f "$file" ]; then
        echo "  Loading $file..."
        cockroach sql --insecure --host=$HOST --database=$DB <<EOF
IMPORT INTO sales (sale_id, store_code, total, txn_ts, promotion, member)
CSV DATA ('file://${PWD}/${file}?skip=1')
WITH skip = '1';
EOF
    fi
done

# Load sale_items files (all shards)
echo "Loading sale_items data..."
for file in ${DATA_DIR}/sale_items_*.csv; do
    if [ -f "$file" ]; then
        echo "  Loading $file..."
        cockroach sql --insecure --host=$HOST --database=$DB <<EOF
IMPORT INTO sale_items (sale_id, product_id, qty)
CSV DATA ('file://${PWD}/${file}?skip=1')
WITH skip = '1';
EOF
    fi
done

echo "✅ Data loading complete!"

# Show statistics
echo ""
echo "📊 Data Summary:"
cockroach sql --insecure --host=$HOST --database=$DB <<EOF
SELECT 'stores' AS table_name, COUNT(*) AS row_count FROM stores
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'sales', COUNT(*) FROM sales
UNION ALL
SELECT 'sale_items', COUNT(*) FROM sale_items;
EOF

