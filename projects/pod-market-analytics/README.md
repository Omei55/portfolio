# 🏪 POD Market Analytics Dashboard

[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![CockroachDB](https://img.shields.io/badge/CockroachDB-Multi--Node-orange.svg)](https://www.cockroachlabs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> A comprehensive full-stack analytics dashboard for multi-location convenience store chains with natural language query support, built on a distributed CockroachDB cluster.

## ✨ Features

- 🌍 **Multi-Region Distributed Database** - 3-node CockroachDB cluster with automatic data distribution across regions
- 💬 **Natural Language Queries** - Ask questions in plain English like "What are the sales at Tempe market?"
- 📊 **Interactive Dashboard** - Modern React UI with real-time query results and statistics
- 🔍 **Intelligent SQL Generation** - Automatically converts natural language to optimized SQL queries
- ⚡ **High Performance** - Low-latency queries with regional data locality
- 🔄 **High Availability** - Distributed architecture ensures system resilience
- 📈 **Real-time Analytics** - Instant insights into sales, revenue, and product performance

## 🏗️ Architecture

### System Overview

```
┌─────────────────┐
│   React Frontend │  (Port 3000)
└────────┬─────────┘
         │ HTTP/REST
┌────────▼─────────┐
│  Express Backend  │  (Port 3001)
└────────┬─────────┘
         │ PostgreSQL Protocol
┌────────▼──────────────────────────────┐
│      CockroachDB Cluster              │
│  ┌──────────┐  ┌──────────┐  ┌──────┐│
│  │ Node 1   │  │ Node 2   │  │Node 3││
│  │us-west1  │  │us-central1│  │us-east1│
│  │:26257    │  │:26258    │  │:26259││
│  └──────────┘  └──────────┘  └──────┘│
└───────────────────────────────────────┘
```

### Multi-Region Data Distribution

- **Node 1**: `us-west1` (localhost:26257) - POD-TEMPE, POD-POLY
- **Node 2**: `us-central1` (localhost:26258) - POD-WV
- **Node 3**: `us-east1` (localhost:26259) - POD-DTPHX

**Data Locality Strategy:**
- **Products Table**: `GLOBAL` - Replicated across all regions for fast access
- **Sales & Sale Items Tables**: `REGIONAL BY ROW` - Data stored in region matching store location

## 🛠️ Technology Stack

### Frontend
- **React 18.2.0** - Modern UI library
- **Axios** - HTTP client for API communication
- **CSS3** - Responsive styling

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **PostgreSQL Driver (pg)** - Database connectivity
- **Natural Language Processing** - Pattern-based query parsing

### Database
- **CockroachDB** - Distributed SQL database
  - Multi-node cluster (3 nodes)
  - Multi-region support
  - PostgreSQL-compatible SQL
  - ACID transactions across distributed nodes

### Data Processing
- **Python 3** - CSV data loading scripts
- **Bash Scripts** - Automation for cluster setup

## 🚀 Quick Start

### Prerequisites

- [CockroachDB](https://www.cockroachlabs.com/docs/stable/install-cockroachdb.html) installed
- [Node.js](https://nodejs.org/) 16+ and npm
- [Python 3](https://www.python.org/downloads/) (for data loading)
- Data files in `out/` directory (CSV files)

### Installation

1. **Start the CockroachDB cluster**
   ```bash
   ./setup_cockroach_cluster.sh
   ```
   This creates a 3-node cluster with multi-region configuration.

2. **Create database schema**
   ```bash
   ./setup_database.sh
   ```

3. **Load CSV data**
   ```bash
   ./load_csv_data.sh
   # OR using Python
   python3 load_csv_data_python.py
   ```

4. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

5. **Start backend server**
   ```bash
   npm start
   ```
   Backend runs on http://localhost:3001

6. **Install frontend dependencies** (in a new terminal)
   ```bash
   cd frontend
   npm install
   ```

7. **Start frontend application**
   ```bash
   npm start
   ```
   Frontend opens at http://localhost:3000

## 💡 Usage Examples

### Natural Language Queries

Try asking questions in plain English:

- "What are the sales at Tempe market?"
- "Total revenue across all stores"
- "Top 10 selling products"
- "Sales by promotion type"
- "Member vs non-member sales"
- "All stores summary"
- "Sales for this month"

The system automatically:
1. Parses your natural language query
2. Generates appropriate SQL
3. Executes against the multi-node cluster
4. Displays formatted results

### API Endpoints

- `GET /health` - Health check
- `GET /api/stores` - Get all stores
- `POST /api/query` - Execute natural language query
  ```json
  {
    "query": "What are the sales at Tempe market?"
  }
  ```
- `GET /api/stats` - Get database statistics

## 📁 Project Structure

```
pod-market-analytics/
├── backend/                    # Node.js backend
│   ├── server.js              # Express server
│   ├── nlp-query-parser.js    # Natural language to SQL converter
│   └── package.json
├── frontend/                   # React frontend
│   ├── public/
│   ├── src/
│   │   ├── App.js
│   │   └── components/
│   │       ├── QueryInterface.js
│   │       ├── ResultsDisplay.js
│   │       └── StatsPanel.js
│   └── package.json
├── out/                        # CSV data files
│   ├── stores.csv
│   ├── products.csv
│   ├── sales_*.csv
│   └── sale_items_*.csv
├── setup_cockroach_cluster.sh  # Cluster setup script
├── setup_database.sh           # Schema creation script
├── load_csv_data.sh            # Data loading script
├── load_csv_data_python.py     # Python data loader
├── README.md                   # This file
├── PROJECT_DOCUMENTATION.md    # Detailed documentation
└── QUICKSTART.md              # Quick start guide
```

## 🎯 Key Features Explained

### Multi-Region Data Distribution

The system uses CockroachDB's multi-region capabilities to:
- Store data close to where it's accessed (low latency)
- Automatically replicate data across regions (high availability)
- Enable global queries while maintaining regional performance

### Natural Language Processing

The query parser uses pattern-based matching to understand user intent and generate optimized SQL queries. It supports:
- Store-specific queries
- Aggregation queries (sum, count, average)
- Top-N queries
- Date-based filtering
- Grouping and categorization

### High Availability

With a 3-node distributed cluster:
- System survives node failures
- Automatic data replication
- Zero-downtime upgrades possible
- Consistent transactions across all nodes

## 📊 Database Schema

### Tables

- **stores** - Store information (store_id, code, name, region)
- **products** - Product catalog (product_id, name)
- **sales** - Transaction records (sale_id, store_code, total, txn_ts, promotion, member)
- **sale_items** - Individual items in transactions (sale_id, product_id, qty)

See [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) for detailed schema information.

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
DB_HOST=localhost
DB_PORT=26257
DB_NAME=pod_market
DB_USER=root
DB_PASSWORD=
DB_SSL=false
PORT=3001
```

### Admin UI Access

- Node 1 Admin UI: http://localhost:8080
- Node 2 Admin UI: http://localhost:8081
- Node 3 Admin UI: http://localhost:8082

## 🛑 Stopping the Cluster

To stop all CockroachDB nodes:

```bash
pkill -f cockroach
```

To clean up data directories:

```bash
rm -rf pod_data/node1 pod_data/node2 pod_data/node3
```

## 🐛 Troubleshooting

### Port Already in Use
If ports 26257-26259 or 8080-8082 are in use, modify port numbers in `setup_cockroach_cluster.sh`.

### Database Connection Issues
- Ensure CockroachDB cluster is running: `cockroach node status --insecure --host=localhost:26257`
- Check backend `.env` file has correct connection settings
- Verify database exists: `cockroach sql --insecure --host=localhost:26257 -e "SHOW DATABASES;"`

### Data Loading Issues
- Ensure CSV files exist in `out/` directory
- Check file paths are correct (use absolute paths if needed)
- Verify CockroachDB IMPORT syntax for your version

## 📚 Documentation

- [Quick Start Guide](QUICKSTART.md) - Get started quickly
- [Complete Documentation](PROJECT_DOCUMENTATION.md) - Detailed technical documentation
- [CockroachDB Documentation](https://www.cockroachlabs.com/docs/) - Database documentation

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

## 🙏 Acknowledgments

- [CockroachDB](https://www.cockroachlabs.com/) for the distributed database
- [React](https://reactjs.org/) for the UI framework
- [Express.js](https://expressjs.com/) for the backend framework

---

**Note**: This project is part of CSE 512 - Distributed Database Systems coursework. It demonstrates distributed database concepts, multi-region data distribution, and natural language query processing.

