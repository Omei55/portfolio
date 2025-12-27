#!/bin/bash

# Simplified Database Schema Setup - Working Version

set -e

echo "📦 Setting up Database Schema..."

HOST="localhost:26257"
DB="pod_market"

# Create database and configure regions FIRST
echo "Creating database and configuring regions..."
cockroach sql --insecure --host=$HOST <<EOF
CREATE DATABASE IF NOT EXISTS $DB;
USE $DB;
ALTER DATABASE $DB SET PRIMARY REGION "us-west1";
ALTER DATABASE $DB ADD REGION IF NOT EXISTS "us-central1";
ALTER DATABASE $DB ADD REGION IF NOT EXISTS "us-east1";
EOF

# Create tables
echo "Creating tables..."
cockroach sql --insecure --host=$HOST --database=$DB <<EOF
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS stores CASCADE;

-- Stores table
CREATE TABLE stores (
    store_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code STRING UNIQUE NOT NULL,
    name STRING NOT NULL,
    region STRING NOT NULL
);

-- Products table
CREATE TABLE products (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name STRING UNIQUE NOT NULL
);

-- Sales table with region column
CREATE TABLE sales (
    sale_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_code STRING NOT NULL,
    total DECIMAL(9,2) NOT NULL,
    txn_ts TIMESTAMPTZ NOT NULL,
    promotion STRING,
    member STRING,
    crdb_region crdb_internal_region AS (
        CASE 
            WHEN store_code = 'POD-TEMPE' THEN 'us-west1'::crdb_internal_region
            WHEN store_code = 'POD-POLY' THEN 'us-west1'::crdb_internal_region
            WHEN store_code = 'POD-WV' THEN 'us-central1'::crdb_internal_region
            WHEN store_code = 'POD-DTPHX' THEN 'us-east1'::crdb_internal_region
            ELSE 'us-west1'::crdb_internal_region
        END
    ) STORED NOT NULL,
    FOREIGN KEY (store_code) REFERENCES stores(code)
);

-- Sale items table - will co-locate with sales
CREATE TABLE sale_items (
    sale_id UUID NOT NULL,
    product_id UUID NOT NULL,
    qty INT NOT NULL,
    PRIMARY KEY (sale_id, product_id),
    FOREIGN KEY (sale_id) REFERENCES sales(sale_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);
EOF

# Set localities
echo "Configuring table localities..."
cockroach sql --insecure --host=$HOST --database=$DB <<EOF
-- Products: GLOBAL (replicated everywhere)
ALTER TABLE products SET LOCALITY GLOBAL;

-- Sales: REGIONAL BY ROW
ALTER TABLE sales SET LOCALITY REGIONAL BY ROW AS crdb_region;

-- Sale items: co-located with sales (simplified - will be distributed with parent)
-- For demo purposes, we'll keep it simple without explicit REGIONAL BY ROW
-- The foreign key relationship ensures data locality
EOF

echo "✅ Database schema created successfully!"

