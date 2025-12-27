.PHONY: help start stop install db-up db-down backend frontend clean logs install-all

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Detect docker-compose command (docker compose or docker-compose)
# Try docker-compose first, then fall back to docker compose
DOCKER_COMPOSE := $(shell command -v docker-compose >/dev/null 2>&1 && echo "docker-compose" || echo "docker compose")

# Default target
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "$(BLUE)Agile Pulse System - Makefile Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Available commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""

install-all: ## Install all dependencies (backend and frontend)
	@echo "$(BLUE)Installing backend dependencies...$(NC)"
	cd be && npm install
	@echo "$(BLUE)Installing frontend dependencies...$(NC)"
	cd fe && npm install
	@echo "$(GREEN)✓ All dependencies installed!$(NC)"

install: install-all ## Alias for install-all

db-up: ## Start PostgreSQL database using Docker Compose
	@echo "$(BLUE)Starting PostgreSQL database...$(NC)"
	@echo "$(YELLOW)Using: $(DOCKER_COMPOSE)$(NC)"
	cd be && $(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)✓ Database started!$(NC)"
	@echo "$(BLUE)Waiting for database to be ready...$(NC)"
	@sleep 3
	@echo "$(GREEN)✓ Database is ready!$(NC)"

db-down: ## Stop PostgreSQL database
	@echo "$(BLUE)Stopping PostgreSQL database...$(NC)"
	cd be && $(DOCKER_COMPOSE) down
	@echo "$(GREEN)✓ Database stopped!$(NC)"

db-restart: db-down db-up ## Restart PostgreSQL database

backend: ## Start backend server in development mode
	@echo "$(BLUE)Starting backend server...$(NC)"
	@if [ ! -f "be/.env" ]; then \
		echo "$(YELLOW)Warning: be/.env file not found. Creating default .env...$(NC)"; \
		echo "DATABASE_HOST=localhost" > be/.env; \
		echo "DATABASE_PORT=5432" >> be/.env; \
		echo "DATABASE_USER=agile_user" >> be/.env; \
		echo "DATABASE_PASSWORD=agile_password" >> be/.env; \
		echo "DATABASE_NAME=agile_pulse" >> be/.env; \
		echo "DATABASE_SSL=false" >> be/.env; \
		echo "JWT_SECRET=dev-secret-key-change-in-production" >> be/.env; \
		echo "PORT=3001" >> be/.env; \
	fi
	cd be && npm run start:dev

frontend: ## Start frontend server
	@echo "$(BLUE)Starting frontend server...$(NC)"
	@if [ ! -f "fe/.env" ]; then \
		echo "$(YELLOW)Warning: fe/.env file not found. Creating default .env...$(NC)"; \
		echo "REACT_APP_API_URL=http://localhost:3001" > fe/.env; \
	fi
	cd fe && npm start

start: db-up ## Start everything (database, backend, frontend)
	@echo "$(BLUE)Starting Agile Pulse System...$(NC)"
	@echo "$(BLUE)1. Starting database...$(NC)"
	@$(MAKE) db-up
	@echo "$(BLUE)2. Backend will start in a new terminal...$(NC)"
	@echo "$(BLUE)3. Frontend will start in a new terminal...$(NC)"
	@echo ""
	@echo "$(GREEN)✓ Database is running!$(NC)"
	@echo ""
	@echo "$(YELLOW)To start backend, run:$(NC) make backend"
	@echo "$(YELLOW)To start frontend, run:$(NC) make frontend"
	@echo ""
	@echo "$(GREEN)Or start everything in separate terminals:$(NC)"
	@echo "  Terminal 1: make db-up"
	@echo "  Terminal 2: make backend"
	@echo "  Terminal 3: make frontend"

start-all: db-up ## Start everything including backend and frontend (requires multiple terminals)
	@echo "$(BLUE)Starting Agile Pulse System...$(NC)"
	@echo "$(BLUE)Starting database...$(NC)"
	@$(MAKE) db-up
	@echo "$(BLUE)Starting backend in background...$(NC)"
	@cd be && npm run start:dev &
	@sleep 5
	@echo "$(BLUE)Starting frontend...$(NC)"
	@cd fe && npm start

stop: ## Stop all services
	@echo "$(BLUE)Stopping all services...$(NC)"
	cd be && $(DOCKER_COMPOSE) down
	@echo "$(GREEN)✓ All services stopped!$(NC)"

clean: ## Remove containers, volumes, and node_modules
	@echo "$(RED)Cleaning up...$(NC)"
	@read -p "This will remove Docker containers, volumes, and node_modules. Continue? (y/N) " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		cd be && $(DOCKER_COMPOSE) down -v; \
		echo "$(BLUE)Removing node_modules...$(NC)"; \
		rm -rf be/node_modules fe/node_modules; \
		echo "$(GREEN)✓ Cleanup complete!$(NC)"; \
	else \
		echo "$(YELLOW)Cancelled.$(NC)"; \
	fi

logs: ## View database logs
	@echo "$(BLUE)Viewing database logs...$(NC)"
	cd be && $(DOCKER_COMPOSE) logs -f postgres

logs-backend: ## View backend logs (if running in background)
	@echo "$(BLUE)Backend logs are shown in the terminal where it's running$(NC)"

logs-frontend: ## View frontend logs (if running in background)
	@echo "$(BLUE)Frontend logs are shown in the terminal where it's running$(NC)"

status: ## Check status of all services
	@echo "$(BLUE)Checking service status...$(NC)"
	@echo ""
	@echo "$(YELLOW)Database:$(NC)"
	@cd be && $(DOCKER_COMPOSE) ps || echo "$(RED)Database not running$(NC)"
	@echo ""
	@echo "$(YELLOW)Backend:$(NC)"
	@lsof -ti:3001 > /dev/null 2>&1 && echo "$(GREEN)✓ Backend running on port 3001$(NC)" || echo "$(RED)✗ Backend not running$(NC)"
	@echo ""
	@echo "$(YELLOW)Frontend:$(NC)"
	@lsof -ti:3000 > /dev/null 2>&1 && echo "$(GREEN)✓ Frontend running on port 3000$(NC)" || echo "$(RED)✗ Frontend not running$(NC)"

reset-db: ## Reset database (WARNING: This will delete all data)
	@echo "$(RED)WARNING: This will delete all database data!$(NC)"
	@read -p "Are you sure? (y/N) " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		cd be && $(DOCKER_COMPOSE) down -v; \
		$(MAKE) db-up; \
		echo "$(GREEN)✓ Database reset complete!$(NC)"; \
	else \
		echo "$(YELLOW)Cancelled.$(NC)"; \
	fi

setup: install-all db-up ## Complete setup: install dependencies and start database
	@echo "$(GREEN)✓ Setup complete!$(NC)"
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "  1. Start backend: make backend"
	@echo "  2. Start frontend: make frontend"

