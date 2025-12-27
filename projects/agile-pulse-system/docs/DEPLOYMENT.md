# CI/CD Deployment Guide

This guide explains how to set up and use the GitHub Actions CI/CD pipeline for deploying the Agile Pulse System.

## Overview

The CI/CD pipeline automatically:
1. **Builds and tests** both backend and frontend on every push/PR
2. **Deploys** to the server on pushes to `main` or `master` branch

## Prerequisites

### Server Requirements
- Ubuntu/Debian Linux server (or similar)
- Node.js 20.x installed
- PM2 installed globally (recommended for process management): `npm install -g pm2`
- SSH access configured
- Nginx or similar web server (for serving frontend)

### GitHub Secrets Configuration

You need to configure the following secrets in your GitHub repository:

1. Go to your repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add:

#### Required Secrets:

- **`SSH_PRIVATE_KEY`**: Your private SSH key for server access
  ```bash
  # Generate if you don't have one:
  ssh-keygen -t ed25519 -C "github-actions"
  # Copy the private key content (id_ed25519)
  ```

- **`SERVER_HOST`**: Your server's IP address or domain name
  ```
  Example: 192.168.1.100 or example.com
  ```

- **`SERVER_USER`**: SSH username for server access
  ```
  Example: ubuntu or deploy
  ```

- **`DEPLOY_PATH`**: Path on server where application will be deployed
  ```
  Example: /var/www/agile-pulse or /home/deploy/app
  ```

#### Optional Secrets:

- **`REACT_APP_API_URL`**: Frontend API URL (if different from default)
  ```
  Example: https://api.example.com
  ```

## Server Setup

### 1. Initial Server Configuration

SSH into your server and run:

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Create deployment directory
sudo mkdir -p /var/www/agile-pulse/{be,fe}
sudo chown -R $USER:$USER /var/www/agile-pulse
```

### 2. Setup Backend Service

Create a PM2 ecosystem file or systemd service:

**Option A: PM2 (Recommended)**

Create `/var/www/agile-pulse/be/ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'agile-pulse-backend',
    script: './dist/main.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false
  }]
};
```

**Option B: Systemd Service**

Create `/etc/systemd/system/agile-pulse-backend.service`:
```ini
[Unit]
Description=Agile Pulse Backend
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/var/www/agile-pulse/be
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```

### 3. Setup Frontend Service

**Option A: PM2 with serve**
```bash
npm install -g serve
pm2 serve /var/www/agile-pulse/fe/build 3000 --name agile-pulse-frontend --spa
```

**Option B: Nginx Configuration**

Create `/etc/nginx/sites-available/agile-pulse`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/agile-pulse/fe/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/agile-pulse /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Environment Variables

Create `/var/www/agile-pulse/be/.env`:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=agile_user
DATABASE_PASSWORD=your_secure_password
DATABASE_NAME=agile_pulse
DATABASE_SSL=false
JWT_SECRET=your_very_secure_jwt_secret_key
PORT=3001
```

### 5. Database Setup

If using Docker Compose on the server:
```bash
cd /var/www/agile-pulse/be
docker-compose up -d
```

Or configure PostgreSQL directly on the server.

### 6. SSH Key Setup

Add the public key to your server's authorized_keys:
```bash
# On your local machine, copy the public key
cat ~/.ssh/id_ed25519.pub

# On the server, add it to authorized_keys
mkdir -p ~/.ssh
echo "YOUR_PUBLIC_KEY" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

## Workflow Triggers

The pipeline runs automatically:
- **On every push** to `main` or `master` branch (builds, tests, and deploys)
- **On pull requests** to `main` or `master` (builds and tests only)
- **Manually** via GitHub Actions UI (workflow_dispatch)

## Manual Deployment

You can also trigger deployment manually:

1. Go to **Actions** tab in GitHub
2. Select **CI/CD Pipeline** workflow
3. Click **Run workflow**
4. Select branch and click **Run workflow**

## Monitoring

### Check Deployment Status
- View workflow runs in GitHub Actions tab
- Check server logs:
  ```bash
  # PM2 logs
  pm2 logs agile-pulse-backend
  pm2 logs agile-pulse-frontend
  
  # Systemd logs
  sudo journalctl -u agile-pulse-backend -f
  ```

### Verify Deployment
```bash
# Check if services are running
pm2 list
# or
sudo systemctl status agile-pulse-backend

# Test backend
curl http://localhost:3001/api/projects

# Test frontend
curl http://localhost:3000
```

## Troubleshooting

### Deployment Fails
1. Check GitHub Actions logs for specific errors
2. Verify all secrets are correctly configured
3. Ensure SSH key has proper permissions on server
4. Check server disk space: `df -h`

### Services Not Starting
1. Check environment variables are set correctly
2. Verify database is running and accessible
3. Check port availability: `netstat -tulpn | grep :3001`
4. Review application logs

### Build Failures
1. Check Node.js version matches (20.x)
2. Verify all dependencies are in package.json
3. Review linting errors in workflow logs

## Security Best Practices

1. **Never commit secrets** to the repository
2. Use **strong JWT secrets** in production
3. Enable **HTTPS** for production deployments
4. Use **firewall rules** to restrict server access
5. Regularly **update dependencies** and Node.js
6. Use **environment-specific** configurations

## Rollback

If deployment fails, you can rollback:

```bash
# SSH into server
ssh user@server

# Stop services
pm2 stop agile-pulse-backend agile-pulse-frontend

# Restore previous build (if you have backups)
# Or checkout previous commit and redeploy
```

## Support

For issues or questions:
1. Check GitHub Actions workflow logs
2. Review server application logs
3. Verify all configuration steps were completed

