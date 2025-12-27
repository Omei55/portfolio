#!/usr/bin/env python3

import csv
import os
import psycopg2
from psycopg2.extras import execute_values
import glob
import sys

DB_CONFIG = {
    'host': 'localhost',
    'port': 26257,
    'database': 'pod_market',
    'user': 'root',
    'password': '',
    'sslmode': 'disable'
}

DATA_DIR = 'out'

def connect_db():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.set_session(autocommit=True)
        print("✅ Connected to CockroachDB")
        return conn
    except Exception as e:
        print(f"❌ Connection error: {e}")
        sys.exit(1)

def load_stores(conn):
    print("\n📥 Loading stores...")
    filepath = os.path.join(DATA_DIR, 'stores.csv')
    
    if not os.path.exists(filepath):
        print(f"⚠️  File not found: {filepath}")
        return
    
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = []
        for row in reader:
            rows.append((
                row['store_id'],
                row['code'],
                row['name'],
                row['region']
            ))
    
    if rows:
        cur = conn.cursor()
        execute_values(
            cur,
            "INSERT INTO stores (store_id, code, name, region) VALUES %s ON CONFLICT (store_id) DO NOTHING",
            rows
        )
        print(f"  ✅ Loaded {len(rows)} stores")

def load_products(conn):
    print("\n📥 Loading products...")
    filepath = os.path.join(DATA_DIR, 'products.csv')
    
    if not os.path.exists(filepath):
        print(f"⚠️  File not found: {filepath}")
        return
    
    rows = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append((
                row['product_id'],
                row['name']
            ))
    
    if rows:
        cur = conn.cursor()
        batch_size = 1000
        for i in range(0, len(rows), batch_size):
            batch = rows[i:i+batch_size]
            execute_values(
                cur,
                "INSERT INTO products (product_id, name) VALUES %s ON CONFLICT (product_id) DO NOTHING",
                batch
            )
        print(f"  ✅ Loaded {len(rows)} products")

def load_sales(conn):
    print("\n📥 Loading sales data...")
    files = sorted(glob.glob(os.path.join(DATA_DIR, 'sales_*.csv')))
    
    if not files:
        print(f"⚠️  No sales files found in {DATA_DIR}/")
        return
    
    total_rows = 0
    cur = conn.cursor()
    
    for filepath in files:
        filename = os.path.basename(filepath)
        print(f"  Loading {filename}...", end=' ')
        
        rows = []
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                rows.append((
                    row['sale_id'],
                    row['store_code'],
                    float(row['total']),
                    row['txn_ts'],
                    row['promotion'] if row['promotion'] != 'None' else None,
                    row['member']
                ))
        
        if rows:
            batch_size = 500
            for i in range(0, len(rows), batch_size):
                batch = rows[i:i+batch_size]
                execute_values(
                    cur,
                    """INSERT INTO sales (sale_id, store_code, total, txn_ts, promotion, member) 
                       VALUES %s ON CONFLICT (sale_id) DO NOTHING""",
                    batch
                )
            total_rows += len(rows)
            print(f"✅ {len(rows)} rows")
    
    print(f"\n  ✅ Total sales loaded: {total_rows}")

def load_sale_items(conn):
    print("\n📥 Loading sale_items data...")
    files = sorted(glob.glob(os.path.join(DATA_DIR, 'sale_items_*.csv')))
    
    if not files:
        print(f"⚠️  No sale_items files found in {DATA_DIR}/")
        return
    
    total_rows = 0
    cur = conn.cursor()
    
    for filepath in files:
        filename = os.path.basename(filepath)
        print(f"  Loading {filename}...", end=' ')
        
        rows = []
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                rows.append((
                    row['sale_id'],
                    row['product_id'],
                    int(row['qty'])
                ))
        
        if rows:
            batch_size = 1000
            for i in range(0, len(rows), batch_size):
                batch = rows[i:i+batch_size]
                execute_values(
                    cur,
                    """INSERT INTO sale_items (sale_id, product_id, qty) 
                       VALUES %s ON CONFLICT (sale_id, product_id) DO NOTHING""",
                    batch
                )
            total_rows += len(rows)
            print(f"✅ {len(rows)} rows")
    
    print(f"\n  ✅ Total sale_items loaded: {total_rows}")

def show_statistics(conn):
    print("\n📊 Data Summary:")
    cur = conn.cursor()
    
    queries = [
        ("Stores", "SELECT COUNT(*) FROM stores"),
        ("Products", "SELECT COUNT(*) FROM products"),
        ("Sales", "SELECT COUNT(*) FROM sales"),
        ("Sale Items", "SELECT COUNT(*) FROM sale_items"),
        ("Total Revenue", "SELECT SUM(total) FROM sales")
    ]
    
    for label, query in queries:
        cur.execute(query)
        result = cur.fetchone()[0]
        if label == "Total Revenue" and result:
            print(f"  {label}: ${float(result):,.2f}")
        else:
            print(f"  {label}: {result:,}")

def main():
    print("🚀 Starting CSV Data Loading...")
    print(f"📁 Data directory: {DATA_DIR}/")
    
    if not os.path.exists(DATA_DIR):
        print(f"❌ Error: Data directory '{DATA_DIR}' not found!")
        sys.exit(1)
    
    conn = connect_db()
    
    try:
        load_stores(conn)
        load_products(conn)
        load_sales(conn)
        load_sale_items(conn)
        show_statistics(conn)
        
        print("\n✅ Data loading complete!")
        
    except Exception as e:
        print(f"\n❌ Error during loading: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        conn.close()

if __name__ == '__main__':
    main()

