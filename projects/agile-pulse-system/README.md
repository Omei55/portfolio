# 🌀 Agile Pulse System

**AgilePulse** is an intelligent Agile management platform designed to streamline story refinement, sprint readiness, MVP planning, and progress tracking for software development teams.  
It enables Product Owners, Scrum Masters, Developers, and Stakeholders to collaborate efficiently using real-time data, notifications, and integrations with external tools.

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)

---

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (v9 or higher) - Comes with Node.js
- **Docker** and **Docker Compose** - [Download](https://www.docker.com/get-started)
- **Git** - [Download](https://git-scm.com/)

---

## 🚀 Quick Start

### Option 1: Using Makefile (Recommended)

The easiest way to get started is using the Makefile:

```bash
# Clone the repository
git clone https://github.com/osapkal-git/Agile-Pulse-System.git
cd Agile-Pulse-System

# Start everything (database, backend, frontend)
make start

# Or use individual commands:
make db-up      # Start database only
make backend    # Start backend only
make frontend   # Start frontend only
make stop       # Stop all services
make clean      # Clean up containers and volumes
```

### Option 2: Manual Setup

See [Installation](#installation) section below for step-by-step instructions.

---

## 📥 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/osapkal-git/Agile-Pulse-System.git
cd Agile-Pulse-System
```

### 2. Start the Database

Using Docker Compose:

```bash
cd be
docker-compose up -d
```

This will start a PostgreSQL database container with the following defaults:

- **Host**: localhost
- **Port**: 5432
- **Database**: agile_pulse
- **User**: agile_user
- **Password**: agile_password

To verify the database is running:

```bash
docker ps
```

You should see a container named `agile_pulse_postgres` running.

### 3. Backend Setup

```bash
# Navigate to backend directory
cd be

# Install dependencies
npm install

# Create .env file (if not exists)
# Copy the example below and adjust as needed
cat > .env << EOF
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=agile_user
DATABASE_PASSWORD=agile_password
DATABASE_NAME=agile_pulse
DATABASE_SSL=false
JWT_SECRET=your-secret-key-change-in-production
PORT=3001
EOF

# Run database migrations (if any)
# npm run migration:run

# Start the backend server
npm run start:dev
```

The backend will start on `http://localhost:3001`

### 4. Frontend Setup

Open a new terminal window:

```bash
# Navigate to frontend directory
cd fe

# Install dependencies
npm install

# Create .env file (if not exists)
cat > .env << EOF
REACT_APP_API_URL=http://localhost:3001
EOF

# Start the frontend development server
npm start
```

The frontend will start on `http://localhost:3000` and automatically open in your browser.

---

## 🏃 Running the Application

### Using Makefile Commands

| Command         | Description                           |
| --------------- | ------------------------------------- |
| `make start`    | Start database, backend, and frontend |
| `make db-up`    | Start PostgreSQL database container   |
| `make db-down`  | Stop PostgreSQL database container    |
| `make backend`  | Start backend server (dev mode)       |
| `make frontend` | Start frontend server                 |
| `make stop`     | Stop all running services             |
| `make clean`    | Remove containers and volumes         |
| `make logs`     | View database logs                    |
| `make install`  | Install all dependencies              |

### Manual Commands

**Start Database:**

```bash
cd be && docker-compose up -d
```

**Start Backend:**

```bash
cd be && npm run start:dev
```

**Start Frontend:**

```bash
cd fe && npm start
```

**Stop Database:**

```bash
cd be && docker-compose up -d
```

---

## 🔐 Environment Variables

### Backend (.env in `be/` directory)

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=agile_user
DATABASE_PASSWORD=agile_password
DATABASE_NAME=agile_pulse
DATABASE_SSL=false
JWT_SECRET=your-secret-key-change-in-production
PORT=3001
```

### Frontend (.env in `fe/` directory)

```env
REACT_APP_API_URL=http://localhost:3001
```

### Database (docker-compose.yml in `be/` directory)

The database configuration can be customized via environment variables:

```env
DATABASE_NAME=agile_pulse
DATABASE_USER=agile_user
DATABASE_PASSWORD=agile_password
DATABASE_PORT=5432
```

---

## 📁 Project Structure

```
Agile-Pulse-System/
├── be/                      # Backend (NestJS)
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── stories/        # User stories module
│   │   ├── sprints/        # Sprint management module
│   │   ├── tasks/          # Task management module
│   │   ├── projects/       # Project management module
│   │   ├── comments/       # Comments module
│   │   └── database/       # Database configuration
│   ├── docker-compose.yml  # Docker configuration for database
│   ├── package.json
│   └── README.md
├── fe/                      # Frontend (React)
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/        # API services
│   │   ├── context/         # React context
│   │   └── App.js          # Main app component
│   ├── package.json
│   └── public/
├── Makefile                 # Make commands for easy setup
└── README.md               # This file
```

---

## 🔌 API Documentation

Once the backend is running, you can access:

- **API Base URL**: `http://localhost:3001/api`

### Main Endpoints

- `/api/auth` - Authentication endpoints
- `/api/stories` - User stories management
- `/api/sprints` - Sprint management
- `/api/tasks` - Task management
- `/api/projects` - Project management
- `/api/comments` - Comments management

---

## 🧪 Testing

### Backend Tests

```bash
cd be
npm run test              # Unit tests
npm run test:e2e          # End-to-end tests
npm run test:cov          # Test coverage
```

### Frontend Tests

```bash
cd fe
npm test                  # Run tests
```

---

## 🛠️ Troubleshooting

### Database Connection Issues

1. **Check if Docker container is running:**

   ```bash
   docker ps
   ```

2. **Check database logs:**

   ```bash
   cd be && docker-compose logs postgres
   ```

3. **Restart database:**
   ```bash
   cd be && docker-compose restart
   ```

### Port Already in Use

If port 3000 or 3001 is already in use:

**Backend:**

- Change `PORT` in `be/.env`

**Frontend:**

- Change port in `fe/package.json` scripts or set `PORT=3002` in `.env`

**Database:**

- Change `DATABASE_PORT` in `be/docker-compose.yml`

### Module Not Found Errors

```bash
# Backend
cd be && rm -rf node_modules && npm install

# Frontend
cd fe && rm -rf node_modules && npm install
```

---

## 📝 Development Workflow

1. **Start the database:**

   ```bash
   make db-up
   ```

2. **Start backend in development mode:**

   ```bash
   make backend
   ```

3. **Start frontend in development mode:**

   ```bash
   make frontend
   ```

4. **Make your changes** - Both servers support hot-reload

5. **Stop services when done:**
   ```bash
   make stop
   ```

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Commit your changes: `git commit -m "Add some feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

---

## 📜 License

This project is **Proprietary and Confidential** — for academic use under the **ASU SER515 course, Fall 2025**.

---

## 👥 Contributors

**Team Panda** — Arizona State University

- Omkar Vilas Sapkal (osapkal)
- Bhavisha Rajubhai Sondagar (bsondaga)
- Nidhiben Parmar (nparmar6)
- Indu Arja (iarja)
- Anshul Kumar Sharma (akshar18)

---

## 📞 Support

For issues or questions, please contact the development team or create an issue in the repository.

---

## 🎯 Next Steps

After setup:

1. Access the frontend at `http://localhost:3000`
2. Create an account or login
3. Start creating projects, stories, and sprints!

---
