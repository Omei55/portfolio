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

# Configure multi-region FIRST (needed before creating REGIONAL BY ROW tables)
echo "Configuring multi-region settings..."
cockroach sql --insecure --host=$HOST --database=$DB <<EOF
-- Set primary region
ALTER DATABASE $DB SET PRIMARY REGION "us-west1";
-- Add other regions
ALTER DATABASE $DB ADD REGION IF NOT EXISTS "us-central1";
ALTER DATABASE $DB ADD REGION IF NOT EXISTS "us-east1";
EOF

# Create schema
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

-- Create products table
CREATE TABLE products (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name STRING UNIQUE NOT NULL
);

-- Create sales table with computed region column for REGIONAL BY ROW
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

-- Create sale_items table (without region column initially)
CREATE TABLE sale_items (
    sale_id UUID NOT NULL,
    product_id UUID NOT NULL,
    qty INT NOT NULL,
    PRIMARY KEY (sale_id, product_id),
    FOREIGN KEY (sale_id) REFERENCES sales(sale_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);
EOF

# Add region column to sale_items and set table localities
echo "Setting table localities..."
cockroach sql --insecure --host=$HOST --database=$DB <<EOF
-- Add computed region column to sale_items
ALTER TABLE sale_items ADD COLUMN crdb_region crdb_internal_region AS (
    (SELECT crdb_region FROM sales WHERE sales.sale_id = sale_items.sale_id)
) STORED NOT NULL;

-- Set products table to GLOBAL locality (replicated across all regions)
ALTER TABLE products SET LOCALITY GLOBAL;

-- Set sales table to REGIONAL BY ROW
ALTER TABLE sales SET LOCALITY REGIONAL BY ROW AS crdb_region;

-- Set sale_items table to REGIONAL BY ROW
ALTER TABLE sale_items SET LOCALITY REGIONAL BY ROW AS crdb_region;
EOF

echo "✅ Database schema created with multi-region configuration!"

