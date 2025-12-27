#!/bin/bash

# Multi-Node CockroachDB Cluster Setup Script
# This script sets up a 3-node cluster for multi-region support

set -e

echo "🔧 Setting up Multi-Node CockroachDB Cluster..."

# Stop any existing CockroachDB instances
echo "Stopping existing CockroachDB instances..."
pkill -f cockroach || true
sleep 2

# Create directories for each node
echo "Creating data directories for nodes..."
mkdir -p pod_data/node1 pod_data/node2 pod_data/node3

# Clean up any existing data (optional - remove this if you want to keep existing data)
# rm -rf pod_data/node1/* pod_data/node2/* pod_data/node3/*

# Start Node 1 (us-west1 region) - This is the initial node
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

# Start Node 2 (us-central1 region)
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

# Start Node 3 (us-east1 region)
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

# Initialize the cluster (only needed once, after all nodes are started)
echo "Initializing cluster..."
cockroach init --insecure --host=localhost:26257 || echo "Cluster may already be initialized"

sleep 5

# Wait for cluster to be ready
echo "Waiting for cluster to be ready..."
sleep 5

# Check cluster status
echo "Checking cluster status..."
cockroach node status --insecure --host=localhost:26257

echo ""
echo "✅ Multi-Node Cluster Setup Complete!"
echo ""
echo "📊 Cluster Information:"
echo "  - Node 1: localhost:26257 (us-west1) - Admin UI: http://localhost:8080"
echo "  - Node 2: localhost:26258 (us-central1) - Admin UI: http://localhost:8081"
echo "  - Node 3: localhost:26259 (us-east1) - Admin UI: http://localhost:8082"
echo ""
echo "To connect to the cluster, use: cockroach sql --insecure --host=localhost:26257"

