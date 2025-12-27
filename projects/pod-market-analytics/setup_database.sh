#!/bin/bash

# Database Schema Setup and Data Loading Script
# This script creates the schema, configures multi-region, and loads CSV data

set -e

echo "📦 Setting up Database Schema and Loading Data..."

# Connection string
HOST="localhost:26257"
DB="pod_market"

# Create database
echo "Creating database..."
cockroach sql --insecure --host=$HOST <<EOF
CREATE DATABASE IF NOT EXISTS $DB;
USE $DB;
EOF

# Create schema (without LOCALITY first, then we'll configure regions)
echo "Creating tables..."
cockroach sql --insecure --host=$HOST --database=$DB <<EOF
-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS stores CASCADE;

-- Create stores table
CREATE TABLE stores (
    store_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code STRING UNIQUE NOT NULL,
    name STRING NOT NULL,
    region STRING NOT NULL
);

-- Create products table with GLOBAL locality
CREATE TABLE products (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name STRING UNIQUE NOT NULL
);

-- Create sales table (we'll add region column for REGIONAL BY ROW)
CREATE TABLE sales (
    sale_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_code STRING NOT NULL,
    total DECIMAL(9,2) NOT NULL,
    txn_ts TIMESTAMPTZ NOT NULL,
    promotion STRING,
    member STRING,
    crdb_region crdb_internal_region AS (
        CASE 
            WHEN store_code = 'POD-TEMPE' OR store_code = 'POD-POLY' THEN 'us-west1'::crdb_internal_region
            WHEN store_code = 'POD-WV' THEN 'us-central1'::crdb_internal_region
            WHEN store_code = 'POD-DTPHX' THEN 'us-east1'::crdb_internal_region
            ELSE 'us-west1'::crdb_internal_region
        END
    ) STORED NOT NULL,
    FOREIGN KEY (store_code) REFERENCES stores(code)
);

-- Create sale_items table
CREATE TABLE sale_items (
    sale_id UUID REFERENCES sales(sale_id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(product_id),
    qty INT NOT NULL,
    PRIMARY KEY (sale_id, product_id)
);
EOF

# Configure multi-region (after creating database and tables)
echo "Configuring multi-region settings..."
cockroach sql --insecure --host=$HOST --database=$DB <<EOF
-- Add regions to the database
ALTER DATABASE $DB SET PRIMARY REGION "us-west1";
ALTER DATABASE $DB ADD REGION "us-central1";
ALTER DATABASE $DB ADD REGION "us-east1";

-- Set products table to GLOBAL locality (replicated across all regions)
ALTER TABLE products SET LOCALITY GLOBAL;

-- Set sales table to REGIONAL BY ROW (data stays in region of store)
ALTER TABLE sales SET LOCALITY REGIONAL BY ROW AS crdb_region;

-- Set sale_items table to REGIONAL BY ROW (follows sales table via foreign key)
-- Create a computed column that gets region from parent sales table
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS crdb_region crdb_internal_region AS (
    (SELECT crdb_region FROM sales WHERE sales.sale_id = sale_items.sale_id)
) STORED NOT NULL;
ALTER TABLE sale_items SET LOCALITY REGIONAL BY ROW AS crdb_region;
EOF

echo "✅ Database schema created with multi-region configuration!"

