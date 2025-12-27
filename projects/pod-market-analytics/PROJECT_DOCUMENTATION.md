# POD Market Analytics Dashboard - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Features](#features)
4. [Database Schema](#database-schema)
5. [CockroachDB Implementation](#cockroachdb-implementation)
6. [CockroachDB Features & Advantages](#cockroachdb-features--advantages)
7. [Architecture](#architecture)
8. [Future Enhancements](#future-enhancements)
9. [Project Structure](#project-structure)
10. [API Endpoints](#api-endpoints)
11. [Setup Instructions](#setup-instructions)

---

## Project Overview

The POD Market Analytics Dashboard is a comprehensive full-stack application designed to provide business intelligence and analytics for a multi-location convenience store chain. The system enables users to query sales data using natural language, automatically converting questions into optimized SQL queries that execute against a distributed CockroachDB cluster.

**Key Highlights:**
- Multi-node distributed database cluster (3 nodes across different regions)
- Natural language query interface
- Real-time analytics dashboard
- Multi-region data distribution for optimal performance
- Modern React-based user interface

---

## Technology Stack

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **PostgreSQL Driver (pg)** - Database connectivity (CockroachDB uses PostgreSQL wire protocol)
- **Natural Language Processing** - Pattern-based query parsing using regular expressions (regex)
  - **Note:** While the `natural` npm library is listed as a dependency, the current implementation uses JavaScript's built-in regex pattern matching rather than a full NLP library
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### Frontend
- **React 18.2.0** - UI library
- **React DOM** - React rendering
- **Axios** - HTTP client (for API calls)
- **CSS3** - Styling and responsive design

### Database
- **CockroachDB** - Distributed SQL database
  - Multi-node cluster (3 nodes)
  - Multi-region support
  - PostgreSQL-compatible SQL

### Data Processing
- **Python 3** - CSV data loading script
- **psycopg2** - PostgreSQL adapter for Python
- **Bash Scripts** - Automation for cluster setup and data loading

### Development Tools
- **npm** - Package manager
- **nodemon** - Development server auto-reload

---

## Features

### ✅ Implemented Features

#### 1. **Multi-Node CockroachDB Cluster**
- 3-node distributed cluster setup
- Automatic cluster initialization
- Node health monitoring
- Admin UI access on multiple ports (8080, 8081, 8082)

#### 2. **Multi-Region Data Distribution**
- **Region Configuration:**
  - Node 1: `us-west1` (localhost:26257)
  - Node 2: `us-central1` (localhost:26258)
  - Node 3: `us-east1` (localhost:26259)
- **Store-to-Region Mapping:**
  - POD-TEMPE → us-west1
  - POD-POLY → us-west1
  - POD-WV → us-central1
  - POD-DTPHX → us-east1
- Automatic data locality based on store location

#### 3. **Natural Language Query Interface**
Users can ask questions in plain English, such as:
- "What are the sales at Tempe market?"
- "Total revenue across all stores"
- "Top 10 selling products"
- "Sales by promotion type"
- "Member vs non-member sales"
- "All stores summary"
- "Sales for this month"

#### 4. **SQL Query Generation**
- **NLP Approach:** Pattern-based matching using regular expressions (regex)
- **Implementation:** JavaScript's built-in `String.match()` method with regex patterns
- **Note:** While the `natural` npm library (v6.12.0) is listed as a dependency in `package.json`, it is **not currently used** in the implementation. The system uses a rule-based pattern matching approach instead of a full NLP library.
- Automatic conversion from natural language to SQL
- Supports 8+ common query patterns
- Optimized SQL generation
- Query explanation for transparency

#### 5. **Interactive Dashboard**
- Real-time query results display
- Formatted data tables
- Statistics panel showing:
  - Total stores count
  - Total products count
  - Total sales count
  - Total sale items count
  - Total revenue
- Loading states and error handling
- Example queries for quick access

#### 6. **Data Management**
- CSV data import functionality
- Batch processing for large datasets
- Data validation and error handling
- Support for multiple CSV files (sales_*.csv, sale_items_*.csv)

#### 7. **RESTful API**
- Health check endpoint
- Query execution endpoint
- Statistics endpoint
- Stores listing endpoint
- Error handling and logging

#### 8. **Responsive Design**
- Modern, clean UI
- Mobile-friendly layout
- Professional styling
- Intuitive user experience

---

## Database Schema

### Tables

#### 1. **stores**
Stores information about each POD Market location.

```sql
CREATE TABLE stores (
    store_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code STRING UNIQUE NOT NULL,        -- e.g., 'POD-TEMPE'
    name STRING NOT NULL,               -- e.g., 'POD Market – Tempe'
    region STRING NOT NULL              -- e.g., 'us-west1'
);
```

**Locality:** Default (no specific locality configuration)

**Sample Data:**
- POD-TEMPE → POD Market – Tempe → us-west1
- POD-POLY → POD Market – Polytechnic → us-west1
- POD-WV → POD Market – West Valley → us-central1
- POD-DTPHX → POD Market – Downtown Phoenix → us-east1

#### 2. **products**
Product catalog information.

```sql
CREATE TABLE products (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name STRING UNIQUE NOT NULL         -- Product name
);
```

**Locality:** `GLOBAL` - Replicated across all regions for fast cross-region queries

**Sample Products:** Air Freshener, Allergy Medicine, Aluminum Foil, Apples, Backpack, etc. (150+ products)

#### 3. **sales**
Transaction/sale records.

```sql
CREATE TABLE sales (
    sale_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_code STRING NOT NULL,         -- References stores.code
    total DECIMAL(9,2) NOT NULL,        -- Transaction total
    txn_ts TIMESTAMPTZ NOT NULL,        -- Transaction timestamp
    promotion STRING,                   -- Promotion type (nullable)
    member STRING,                      -- Member status ('Yes' or 'No')
    crdb_region crdb_internal_region AS (
        CASE 
            WHEN store_code = 'POD-TEMPE' OR store_code = 'POD-POLY' 
                THEN 'us-west1'::crdb_internal_region
            WHEN store_code = 'POD-WV' 
                THEN 'us-central1'::crdb_internal_region
            WHEN store_code = 'POD-DTPHX' 
                THEN 'us-east1'::crdb_internal_region
            ELSE 'us-west1'::crdb_internal_region
        END
    ) STORED NOT NULL,
    FOREIGN KEY (store_code) REFERENCES stores(code)
);
```

**Locality:** `REGIONAL BY ROW` - Data stored in the region matching the store's location

**Key Features:**
- Computed region column based on store_code
- Automatic data placement in correct region
- Foreign key relationship with stores table

#### 4. **sale_items**
Individual items within each sale transaction.

```sql
CREATE TABLE sale_items (
    sale_id UUID NOT NULL,             -- References sales.sale_id
    product_id UUID NOT NULL,           -- References products.product_id
    qty INT NOT NULL,                  -- Quantity purchased
    PRIMARY KEY (sale_id, product_id),
    FOREIGN KEY (sale_id) REFERENCES sales(sale_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    crdb_region crdb_internal_region AS (
        (SELECT crdb_region FROM sales WHERE sales.sale_id = sale_items.sale_id)
    ) STORED NOT NULL
);
```

**Locality:** `REGIONAL BY ROW` - Co-located with parent sales record

**Key Features:**
- Composite primary key (sale_id, product_id)
- Cascading delete when sale is deleted
- Region computed from parent sales table

### Relationships

```
stores (1) ──< (many) sales (1) ──< (many) sale_items
                                    │
                                    └──> (many) products (1)
```

### Data Distribution Strategy

1. **Global Tables (products):**
   - Replicated to all regions
   - Fast reads from any region
   - Higher write cost (must replicate to all regions)
   - Suitable for reference data that doesn't change frequently

2. **Regional Tables (sales, sale_items):**
   - Data stored in region matching store location
   - Low latency for region-specific queries
   - Automatic data placement based on store_code
   - Cross-region queries possible but with higher latency

---

## Natural Language Processing (NLP) Implementation

### Current Approach: Pattern-Based Matching with Regular Expressions

The project uses a **rule-based pattern matching approach** rather than a full-featured NLP library. Here's how it works:

#### Implementation Details

**Technology Used:**
- **JavaScript Regular Expressions (Regex)** - Built-in pattern matching
- **String.match()** method - For pattern detection
- **String.includes()** method - For keyword detection

**Note:** While the `natural` npm library (v6.12.0) is listed in `package.json` as a dependency, it is **not currently imported or used** in the codebase. The implementation relies entirely on JavaScript's native string manipulation and regex capabilities.

#### How It Works

1. **Input Normalization:**
   ```javascript
   const query = naturalQuery.toLowerCase().trim();
   ```
   - Converts query to lowercase for case-insensitive matching
   - Trims whitespace

2. **Pattern Matching:**
   The system uses a series of `if-else` statements with regex patterns to identify query intent:
   
   ```javascript
   // Example pattern for store-specific queries
   if (query.match(/sales?\s+(at|in|for)\s+(.+?)(\s+market|\s+store|$)/i)) {
     // Extract store name and generate SQL
   }
   ```

3. **Query Types Supported:**
   - Sales by store (e.g., "sales at Tempe")
   - Total revenue queries
   - Top selling products
   - Sales by promotion
   - Member vs non-member analysis
   - Date-based queries (today, this month, etc.)
   - Store summaries
   - Product search

4. **SQL Generation:**
   Once a pattern is matched, the system generates the corresponding SQL query with appropriate:
   - SELECT clauses
   - JOINs
   - WHERE conditions
   - GROUP BY aggregations
   - ORDER BY sorting

#### Advantages of Current Approach

- ✅ **Simple and Fast:** No external dependencies, minimal processing overhead
- ✅ **Predictable:** Rule-based approach produces consistent results
- ✅ **Easy to Debug:** Clear pattern matching logic
- ✅ **Lightweight:** No large NLP model dependencies
- ✅ **Works Well for Common Queries:** Handles typical business analytics queries effectively

#### Limitations

- ❌ **Limited Flexibility:** Only handles predefined patterns
- ❌ **No Understanding of Synonyms:** "revenue" vs "sales" must be explicitly handled
- ❌ **No Context Awareness:** Can't handle follow-up questions or context
- ❌ **Requires Manual Pattern Addition:** New query types require code changes
- ❌ **No Learning:** Doesn't improve from user interactions

#### Example Pattern Matching

```javascript
// Pattern: "What are the sales at Tempe market?"
if (query.match(/sales?\s+(at|in|for)\s+(.+?)(\s+market|\s+store|$)/i)) {
  const storeMatch = query.match(/(?:at|in|for)\s+(.+?)(?:\s+market|\s+store|$)/);
  if (storeMatch) {
    const storeName = storeMatch[1].trim();
    if (storeName.includes('tempe')) {
      sql = `SELECT store_code, SUM(total) AS total_revenue, COUNT(*) AS transaction_count 
             FROM sales 
             WHERE store_code = 'POD-TEMPE' 
             GROUP BY store_code`;
    }
  }
}
```

#### Future Enhancement Opportunities

To improve the NLP capabilities, the project could:

1. **Utilize the Installed `natural` Library:**
   - Tokenization: Break queries into words
   - Stemming: Reduce words to root forms ("selling" → "sell")
   - Part-of-Speech Tagging: Identify nouns, verbs, etc.
   - Sentiment Analysis: Understand query intent better

2. **Implement Machine Learning:**
   - Train a Text-to-SQL model
   - Use transformer models (BERT, GPT) for better understanding
   - Implement intent classification
   - Add entity extraction

3. **Add Advanced Features:**
   - Query suggestion based on partial input
   - Query history and learning
   - Support for complex multi-condition queries
   - Natural language explanations of results

---

## CockroachDB Implementation

### Cluster Setup

The project uses a 3-node CockroachDB cluster with the following configuration:

```bash
# Node 1: us-west1
cockroach start \
  --insecure \
  --store=pod_data/node1 \
  --listen-addr=localhost:26257 \
  --http-addr=localhost:8080 \
  --locality=region=us-west1

# Node 2: us-central1
cockroach start \
  --insecure \
  --store=pod_data/node2 \
  --listen-addr=localhost:26258 \
  --http-addr=localhost:8081 \
  --locality=region=us-central1

# Node 3: us-east1
cockroach start \
  --insecure \
  --store=pod_data/node3 \
  --listen-addr=localhost:26259 \
  --http-addr=localhost:8082 \
  --locality=region=us-east1
```

### Multi-Region Configuration

```sql
-- Set primary region
ALTER DATABASE pod_market SET PRIMARY REGION "us-west1";

-- Add additional regions
ALTER DATABASE pod_market ADD REGION "us-central1";
ALTER DATABASE pod_market ADD REGION "us-east1";

-- Configure table localities
ALTER TABLE products SET LOCALITY GLOBAL;
ALTER TABLE sales SET LOCALITY REGIONAL BY ROW AS crdb_region;
ALTER TABLE sale_items SET LOCALITY REGIONAL BY ROW AS crdb_region;
```

### Connection Configuration

The backend uses a connection pool to connect to the CockroachDB cluster:

```javascript
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 26257,  // Connects to Node 1
  database: process.env.DB_NAME || 'pod_market',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});
```

**Note:** The application connects to Node 1 (localhost:26257), but CockroachDB automatically routes queries to the appropriate node based on data locality.

### Data Loading

Data is loaded using Python script (`load_csv_data_python.py`) which:
1. Connects to CockroachDB using psycopg2
2. Reads CSV files from `out/` directory
3. Uses batch inserts for performance
4. Handles conflicts with `ON CONFLICT DO NOTHING`
5. Provides progress feedback

---

## CockroachDB Features & Advantages

### 1. **Distributed SQL Database**
- **Horizontal Scalability:** Add nodes without downtime
- **Automatic Sharding:** Data automatically distributed across nodes
- **Consistent Transactions:** ACID guarantees across the cluster
- **No Single Point of Failure:** Survives node failures

### 2. **Multi-Region Support**
- **Data Locality:** Store data close to where it's accessed
- **Low Latency:** Queries execute in the region where data resides
- **Automatic Replication:** Data replicated across regions for availability
- **Regional Failover:** Automatic failover if a region goes down

### 3. **PostgreSQL Compatibility**
- **Standard SQL:** Uses PostgreSQL wire protocol
- **Existing Tools:** Works with PostgreSQL drivers and tools
- **Easy Migration:** Can migrate from PostgreSQL with minimal changes
- **Rich Ecosystem:** Access to PostgreSQL-compatible libraries

### 4. **High Availability**
- **Automatic Replication:** Data replicated across nodes
- **Self-Healing:** Automatic recovery from node failures
- **Zero-Downtime Upgrades:** Upgrade cluster without downtime
- **Consensus Protocol:** Raft consensus for consistency

### 5. **Performance Features**
- **Query Optimization:** Automatic query optimization
- **Index Management:** Automatic index recommendations
- **Connection Pooling:** Efficient connection management
- **Parallel Execution:** Queries executed in parallel across nodes

### 6. **Operational Benefits**
- **Simplified Operations:** Less manual tuning required
- **Built-in Monitoring:** Admin UI for cluster monitoring
- **Backup & Restore:** Built-in backup and restore capabilities
- **Security:** Row-level security, encryption at rest and in transit

### 7. **Cost Efficiency**
- **Resource Optimization:** Efficient resource utilization
- **Auto-scaling:** Can scale up/down based on load
- **Reduced Operational Overhead:** Less DBA time required

### 8. **Developer Experience**
- **SQL Standard:** Familiar SQL syntax
- **Rich Tooling:** Admin UI, CLI tools, monitoring
- **Documentation:** Comprehensive documentation and examples
- **Community Support:** Active community and support

### Advantages for This Project

1. **Multi-Store Analytics:** Perfect for analyzing data across multiple store locations
2. **Regional Performance:** Fast queries for region-specific data
3. **Scalability:** Can easily add more stores/regions
4. **Reliability:** High availability for business-critical analytics
5. **Real-time Analytics:** Low-latency queries for dashboard updates

---

## Architecture

### System Architecture

```
┌─────────────────┐
│   React Frontend │
│   (Port 3000)    │
└────────┬─────────┘
         │ HTTP/REST
         │
┌────────▼─────────┐
│  Express Backend  │
│   (Port 3001)    │
└────────┬─────────┘
         │ PostgreSQL Protocol
         │
┌────────▼──────────────────────────────┐
│      CockroachDB Cluster              │
│  ┌──────────┐  ┌──────────┐  ┌──────┐│
│  │ Node 1   │  │ Node 2   │  │Node 3││
│  │us-west1  │  │us-central1│  │us-east1│
│  │:26257    │  │:26258    │  │:26259││
│  └──────────┘  └──────────┘  └──────┘│
└───────────────────────────────────────┘
```

### Data Flow

1. **User Query:** User enters natural language query in React UI
2. **API Request:** Frontend sends POST request to `/api/query`
3. **NLP Processing:** Backend converts natural language to SQL
4. **Query Execution:** SQL query executed against CockroachDB
5. **Data Retrieval:** CockroachDB routes query to appropriate region(s)
6. **Response:** Results returned to frontend and displayed

### Component Architecture

**Frontend Components:**
- `App.js` - Main application component
- `QueryInterface.js` - Natural language query input
- `ResultsDisplay.js` - Query results display
- `StatsPanel.js` - Database statistics panel

**Backend Modules:**
- `server.js` - Express server and API endpoints
- `nlp-query-parser.js` - Natural language to SQL conversion

---

## Future Enhancements

### Features Not Currently Available (Potential Additions)

#### 1. **Enhanced Natural Language Processing**
- **Current:** Pattern-based matching using regular expressions (regex)
  - Uses JavaScript's built-in `String.match()` method
  - Rule-based approach with predefined patterns
  - The `natural` npm library is installed but not currently used
- **Enhancement:** 
  - **Utilize the installed `natural` library** for tokenization, stemming, and part-of-speech tagging
  - Machine learning-based NLP (e.g., using OpenAI GPT, spaCy, BERT, or Text-to-SQL models)
  - Support for more complex queries with multiple conditions
  - Context-aware query understanding
  - Multi-turn conversations
  - Query suggestions and autocomplete
  - Intent classification and entity extraction
  - Support for synonyms and variations in phrasing

#### 2. **Data Visualization**
- **Charts & Graphs:**
  - Line charts for sales trends over time
  - Bar charts for store comparisons
  - Pie charts for product distribution
  - Heat maps for regional performance
- **Dashboard Widgets:**
  - Real-time sales metrics
  - Top products widget
  - Revenue trends
  - Store performance comparison

#### 3. **Advanced Analytics**
- **Predictive Analytics:**
  - Sales forecasting
  - Demand prediction
  - Trend analysis
- **Statistical Analysis:**
  - Correlation analysis
  - Seasonal patterns
  - Anomaly detection
- **Business Intelligence:**
  - KPI dashboards
  - Custom reports
  - Scheduled reports

#### 4. **User Management & Authentication**
- User authentication (login/logout)
- Role-based access control (RBAC)
- User preferences and saved queries
- Query history per user
- Audit logging

#### 5. **Query Management**
- **Query History:**
  - Save frequently used queries
  - Query favorites
  - Recent queries list
- **Query Builder:**
  - Visual SQL query builder
  - Advanced filtering options
  - Custom query templates
- **Query Performance:**
  - Query execution time tracking
  - Query optimization suggestions
  - Slow query logging

#### 6. **Data Export & Reporting**
- Export results to CSV/Excel
- PDF report generation
- Scheduled email reports
- Custom report templates
- Data visualization export (charts as images)

#### 7. **Real-time Features**
- WebSocket support for real-time updates
- Live dashboard updates
- Real-time notifications
- Push notifications for alerts

#### 8. **Advanced Filtering & Search**
- Date range picker
- Multi-select filters
- Advanced search with multiple criteria
- Saved filter presets
- Product search with autocomplete

#### 9. **Performance Optimizations**
- Query result caching
- Pagination for large result sets
- Lazy loading
- Index optimization recommendations
- Query result compression

#### 10. **Integration Features**
- REST API documentation (Swagger/OpenAPI)
- Webhook support
- Third-party integrations (e.g., Google Analytics, Tableau)
- Data import from external sources
- API rate limiting

#### 11. **Security Enhancements**
- SSL/TLS encryption
- API authentication (JWT tokens)
- SQL injection prevention (parameterized queries)
- Input validation and sanitization
- Rate limiting and DDoS protection

#### 12. **Mobile Support**
- Responsive mobile app
- Progressive Web App (PWA)
- Mobile-optimized UI
- Offline mode support

#### 13. **Testing & Quality Assurance**
- Unit tests for backend
- Integration tests
- End-to-end tests
- Performance testing
- Load testing

#### 14. **DevOps & Deployment**
- Docker containerization
- Kubernetes deployment
- CI/CD pipeline
- Environment-specific configurations
- Automated backups
- Monitoring and alerting (Prometheus, Grafana)

#### 15. **Documentation & Help**
- In-app help system
- Query examples library
- Video tutorials
- User guide
- API documentation

---

## Project Structure

```
Project/
├── backend/                          # Node.js backend
│   ├── server.js                    # Express server
│   ├── nlp-query-parser.js          # NLP to SQL converter
│   ├── package.json                 # Backend dependencies
│   └── node_modules/                # Backend packages
│
├── frontend/                         # React frontend
│   ├── public/
│   │   └── index.html               # HTML template
│   ├── src/
│   │   ├── App.js                   # Main app component
│   │   ├── App.css                  # App styles
│   │   ├── index.js                 # React entry point
│   │   └── components/
│   │       ├── QueryInterface.js    # Query input component
│   │       ├── QueryInterface.css
│   │       ├── ResultsDisplay.js    # Results display
│   │       ├── ResultsDisplay.css
│   │       ├── StatsPanel.js        # Statistics panel
│   │       └── StatsPanel.css
│   ├── package.json                 # Frontend dependencies
│   └── node_modules/                # Frontend packages
│
├── out/                              # CSV data files
│   ├── stores.csv                   # Store data
│   ├── products.csv                 # Product catalog
│   ├── sales_*.csv                  # Sales transactions (multiple files)
│   └── sale_items_*.csv            # Sale items (multiple files)
│
├── pod_data/                         # CockroachDB data directories
│   ├── node1/                       # Node 1 data (us-west1)
│   ├── node2/                       # Node 2 data (us-central1)
│   └── node3/                       # Node 3 data (us-east1)
│
├── setup_cockroach_cluster.sh       # Cluster setup script
├── setup_database.sh                # Database schema setup
├── load_csv_data.sh                 # CSV data loading (SQL)
├── load_csv_data_python.py          # CSV data loading (Python)
│
├── README.md                         # Main project README
├── PROJECT_DOCUMENTATION.md          # This file
├── PROJECT_STATUS.md                # Project status tracking
├── QUICKSTART.md                    # Quick start guide
├── COST_INFO.md                     # Cost information
└── COMPLETION_CHECKLIST.md          # Completion checklist
```

---

## API Endpoints

### Base URL
```
http://localhost:3001
```

### Endpoints

#### 1. **Health Check**
```
GET /health
```
**Response:**
```json
{
  "status": "ok",
  "message": "POD Market API is running"
}
```

#### 2. **Get All Stores**
```
GET /api/stores
```
**Response:**
```json
[
  {
    "store_id": "uuid",
    "code": "POD-TEMPE",
    "name": "POD Market – Tempe",
    "region": "us-west1"
  },
  ...
]
```

#### 3. **Execute Natural Language Query**
```
POST /api/query
Content-Type: application/json

{
  "query": "What are the sales at Tempe market?"
}
```

**Response:**
```json
{
  "success": true,
  "naturalQuery": "What are the sales at Tempe market?",
  "sql": "SELECT store_code, SUM(total) AS total_revenue...",
  "explanation": "Showing total sales for POD Market - Tempe",
  "data": [
    {
      "store_code": "POD-TEMPE",
      "total_revenue": "12345.67",
      "transaction_count": "150"
    }
  ],
  "rowCount": 1,
  "executionTime": "45ms"
}
```

#### 4. **Get Database Statistics**
```
GET /api/stats
```
**Response:**
```json
{
  "stores_count": "4",
  "products_count": "150",
  "sales_count": "10000",
  "sale_items_count": "25000",
  "total_revenue": "500000.00"
}
```

---

## Setup Instructions

### Prerequisites
- CockroachDB installed (`cockroach` command available)
- Node.js 16+ and npm
- Python 3 with psycopg2
- Data files in `out/` directory

### Step 1: Start CockroachDB Cluster
```bash
./setup_cockroach_cluster.sh
```

This creates a 3-node cluster:
- Node 1: http://localhost:8080 (us-west1)
- Node 2: http://localhost:8081 (us-central1)
- Node 3: http://localhost:8082 (us-east1)

### Step 2: Create Database Schema
```bash
./setup_database.sh
```

This creates:
- Database `pod_market`
- All tables with proper schema
- Multi-region configuration
- Locality settings

### Step 3: Load Data
```bash
python3 load_csv_data_python.py
# OR
./load_csv_data.sh
```

This imports:
- Stores data
- Products data
- Sales transactions
- Sale items

### Step 4: Start Backend
```bash
cd backend
npm install
npm start
```

Backend runs on http://localhost:3001

### Step 5: Start Frontend
```bash
cd frontend
npm install
npm start
```

Frontend opens at http://localhost:3000

### Stopping the Cluster
```bash
pkill -f cockroach
```

---

## Conclusion

The POD Market Analytics Dashboard demonstrates a modern, scalable approach to business intelligence using distributed database technology. By leveraging CockroachDB's multi-region capabilities, the system provides low-latency analytics while maintaining high availability and scalability.

The natural language query interface makes the system accessible to non-technical users, while the underlying distributed architecture ensures the system can grow with the business.

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Project Status:** Production-Ready for Demo/Project Use

