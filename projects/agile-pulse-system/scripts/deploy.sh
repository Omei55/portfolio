#!/bin/bash

# Deployment script for Agile Pulse System
# This script can be used for manual deployment or as a reference

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration (override with environment variables)
DEPLOY_PATH=${DEPLOY_PATH:-/var/www/agile-pulse}
SERVER_USER=${SERVER_USER:-deploy}
SERVER_HOST=${SERVER_HOST:-localhost}
BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-3000}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Agile Pulse System - Deployment Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to print colored messages
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on server or locally
if [ "$SERVER_HOST" = "localhost" ] || [ "$SERVER_HOST" = "127.0.0.1" ]; then
    IS_LOCAL=true
    print_info "Running local deployment"
else
    IS_LOCAL=false
    print_info "Deploying to remote server: $SERVER_USER@$SERVER_HOST"
fi

# Step 1: Build Backend
print_info "Building backend..."
cd be
if [ ! -d "node_modules" ]; then
    print_info "Installing backend dependencies..."
    npm ci
fi

print_info "Linting backend..."
npm run lint || print_warning "Linting failed, continuing..."

print_info "Building backend..."
npm run build
print_success "Backend built successfully"
cd ..

# Step 2: Build Frontend
print_info "Building frontend..."
cd fe
if [ ! -d "node_modules" ]; then
    print_info "Installing frontend dependencies..."
    npm ci
fi

print_info "Building frontend..."
npm run build
print_success "Frontend built successfully"
cd ..

# Step 3: Deploy to Server
if [ "$IS_LOCAL" = true ]; then
    print_info "Deploying locally..."
    
    # Create directories
    mkdir -p "$DEPLOY_PATH/be/dist"
    mkdir -p "$DEPLOY_PATH/fe/build"
    
    # Copy backend
    print_info "Copying backend files..."
    cp -r be/dist/* "$DEPLOY_PATH/be/dist/"
    cp be/package.json "$DEPLOY_PATH/be/"
    cp be/package-lock.json "$DEPLOY_PATH/be/"
    
    # Copy frontend
    print_info "Copying frontend files..."
    cp -r fe/build/* "$DEPLOY_PATH/fe/build/"
    
    # Install production dependencies
    print_info "Installing production dependencies..."
    cd "$DEPLOY_PATH/be"
    npm ci --production
    cd - > /dev/null
    
else
    print_info "Deploying to remote server..."
    
    # Create directories on remote server
    ssh "$SERVER_USER@$SERVER_HOST" "mkdir -p $DEPLOY_PATH/be/dist $DEPLOY_PATH/fe/build"
    
    # Copy backend
    print_info "Copying backend files to server..."
    scp -r be/dist/* "$SERVER_USER@$SERVER_HOST:$DEPLOY_PATH/be/dist/"
    scp be/package.json "$SERVER_USER@$SERVER_HOST:$DEPLOY_PATH/be/"
    scp be/package-lock.json "$SERVER_USER@$SERVER_HOST:$DEPLOY_PATH/be/"
    
    # Copy frontend
    print_info "Copying frontend files to server..."
    scp -r fe/build/* "$SERVER_USER@$SERVER_HOST:$DEPLOY_PATH/fe/build/"
    
    # Install production dependencies on server
    print_info "Installing production dependencies on server..."
    ssh "$SERVER_USER@$SERVER_HOST" "cd $DEPLOY_PATH/be && npm ci --production"
fi

# Step 4: Restart Services
print_info "Restarting services..."

if [ "$IS_LOCAL" = true ]; then
    # Local restart
    if command -v pm2 &> /dev/null; then
        print_info "Restarting with PM2..."
        pm2 restart agile-pulse-backend || pm2 start "$DEPLOY_PATH/be/dist/main.js" --name agile-pulse-backend
        pm2 restart agile-pulse-frontend || pm2 serve "$DEPLOY_PATH/fe/build" "$FRONTEND_PORT" --name agile-pulse-frontend --spa
        print_success "Services restarted with PM2"
    elif systemctl is-active --quiet agile-pulse-backend 2>/dev/null; then
        print_info "Restarting with systemd..."
        sudo systemctl restart agile-pulse-backend
        print_success "Backend restarted with systemd"
    else
        print_warning "PM2 or systemd not found. Please restart services manually."
    fi
else
    # Remote restart
    ssh "$SERVER_USER@$SERVER_HOST" << EOF
        if command -v pm2 &> /dev/null; then
            pm2 restart agile-pulse-backend || pm2 start $DEPLOY_PATH/be/dist/main.js --name agile-pulse-backend
            pm2 restart agile-pulse-frontend || pm2 serve $DEPLOY_PATH/fe/build $FRONTEND_PORT --name agile-pulse-frontend --spa
        elif systemctl is-active --quiet agile-pulse-backend 2>/dev/null; then
            sudo systemctl restart agile-pulse-backend
        else
            echo "Please restart services manually"
        fi
EOF
    print_success "Services restarted on remote server"
fi

# Step 5: Health Check
print_info "Performing health check..."
sleep 3

if [ "$IS_LOCAL" = true ]; then
    if curl -f -s "http://localhost:$BACKEND_PORT/api/projects" > /dev/null 2>&1; then
        print_success "Backend health check passed"
    else
        print_warning "Backend health check failed. Service may still be starting."
    fi
else
    if ssh "$SERVER_USER@$SERVER_HOST" "curl -f -s http://localhost:$BACKEND_PORT/api/projects > /dev/null 2>&1"; then
        print_success "Backend health check passed"
    else
        print_warning "Backend health check failed. Service may still be starting."
    fi
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Backend: http://$SERVER_HOST:$BACKEND_PORT"
echo "Frontend: http://$SERVER_HOST:$FRONTEND_PORT"
echo ""

