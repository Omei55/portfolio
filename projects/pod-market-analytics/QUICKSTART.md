# Quick Start Guide

Follow these steps to get your POD Market Analytics Dashboard running!

## Step 1: Start the Multi-Node CockroachDB Cluster

```bash
./setup_cockroach_cluster.sh
```

Wait for all 3 nodes to start. You should see:
- ✅ Node 1 started (us-west1)
- ✅ Node 2 started (us-central1)  
- ✅ Node 3 started (us-east1)
- ✅ Cluster initialized

**Verify cluster is running:**
```bash
cockroach node status --insecure --host=localhost:26257
```

You should see 3 nodes listed.

## Step 2: Create Database Schema

```bash
./setup_database.sh
```

This creates the database with multi-region configuration.

## Step 3: Load Your CSV Data

```bash
./load_csv_data.sh
```

This imports all CSV files from the `out/` directory.

**Note:** If you get import errors, you may need to use `COPY` instead of `IMPORT`. See troubleshooting section.

## Step 4: Install Backend Dependencies

```bash
cd backend
npm install
```

## Step 5: Start Backend Server

```bash
npm start
```

Keep this terminal open. You should see:
```
✅ Connected to CockroachDB successfully
🚀 Server running on http://localhost:3001
```

## Step 6: Install Frontend Dependencies (New Terminal)

Open a new terminal window:

```bash
cd frontend
npm install
```

## Step 7: Start Frontend Application

```bash
npm start
```

This will automatically open your browser at http://localhost:3000

## Step 8: Start Querying!

Try these example queries:
- "What are the sales at Tempe market?"
- "Total revenue"
- "Top 10 selling products"
- "Sales by promotion"

## Troubleshooting

### If cluster setup fails:
- Make sure CockroachDB is installed: `which cockroach`
- Check ports 26257-26259 and 8080-8082 are not in use
- Stop existing CockroachDB: `pkill -f cockroach`

### If data loading fails:
- Verify CSV files exist in `out/` directory
- Check file permissions
- Try using COPY command instead (see load_csv_data_alternative.sh)

### If backend won't start:
- Check Node.js version: `node --version` (need 16+)
- Verify database is running
- Check `.env` file in backend directory

### If frontend won't start:
- Check Node.js version
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall

## Stopping Everything

1. Stop frontend: `Ctrl+C` in frontend terminal
2. Stop backend: `Ctrl+C` in backend terminal
3. Stop CockroachDB cluster: `pkill -f cockroach`

## Next Steps

- Explore different query types
- Check the Admin UI at http://localhost:8080
- View query execution plans in the dashboard
- Monitor multi-region data distribution

Happy querying! 🎉

