#!/bin/bash

# Simplified Multi-Node CockroachDB Cluster Setup
# For localhost development

set -e

echo "🔧 Setting up Multi-Node CockroachDB Cluster..."

# Stop any existing instances
pkill -f cockroach || true
sleep 2

# Create directories
mkdir -p pod_data/node1 pod_data/node2 pod_data/node3

# Start all three nodes with join addresses
echo "Starting Node 1 (us-west1)..."
cockroach start \
  --insecure \
  --store=pod_data/node1 \
  --listen-addr=localhost:26257 \
  --http-addr=localhost:8080 \
  --join=localhost:26257,localhost:26258,localhost:26259 \
  --locality=region=us-west1 \
  --background

sleep 3

echo "Starting Node 2 (us-central1)..."
cockroach start \
  --insecure \
  --store=pod_data/node2 \
  --listen-addr=localhost:26258 \
  --http-addr=localhost:8081 \
  --join=localhost:26257,localhost:26258,localhost:26259 \
  --locality=region=us-central1 \
  --background

sleep 3

echo "Starting Node 3 (us-east1)..."
cockroach start \
  --insecure \
  --store=pod_data/node3 \
  --listen-addr=localhost:26259 \
  --http-addr=localhost:8082 \
  --join=localhost:26257,localhost:26258,localhost:26259 \
  --locality=region=us-east1 \
  --background

sleep 5

echo "Initializing cluster..."
cockroach init --insecure --host=localhost:26257 2>&1 || echo "Cluster initialization attempted"

sleep 5

echo "Checking cluster status..."
cockroach node status --insecure --host=localhost:26257 2>&1 || echo "Checking status..."

echo ""
echo "✅ Cluster setup complete!"
echo "   Node 1: http://localhost:8080"
echo "   Node 2: http://localhost:8081"
echo "   Node 3: http://localhost:8082"

