# CI/CD Workflows

This directory contains GitHub Actions workflows for CI/CD automation.

## Available Workflows

### 1. `deploy.yml` - Standard Deployment
**Recommended for most setups**

- Builds and tests backend and frontend
- Deploys via SSH to your server
- Uses PM2 or systemd for process management
- Requires: Node.js on server, PM2 (recommended)

**Use this if:**
- You have a VPS or dedicated server
- You prefer traditional deployment methods
- You want more control over the deployment process

### 2. `deploy-docker.yml` - Docker Deployment
**Recommended for containerized environments**

- Builds and tests backend and frontend
- Builds Docker images
- Deploys using Docker Compose
- Requires: Docker and Docker Compose on server

**Use this if:**
- You prefer containerized deployments
- You want easier scaling and management
- You're using container orchestration

## Quick Setup

### For Standard Deployment (`deploy.yml`)

1. **Configure GitHub Secrets:**
   - `SSH_PRIVATE_KEY` - Your SSH private key
   - `SERVER_HOST` - Server IP/domain
   - `SERVER_USER` - SSH username
   - `DEPLOY_PATH` - Deployment path (e.g., `/var/www/agile-pulse`)
   - `REACT_APP_API_URL` (optional) - Frontend API URL

2. **Server Setup:**
   ```bash
   # Install Node.js 20.x
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   sudo npm install -g pm2
   
   # Create deployment directory
   sudo mkdir -p /var/www/agile-pulse
   ```

3. **Push to main/master branch** - Deployment will trigger automatically!

### For Docker Deployment (`deploy-docker.yml`)

1. **Configure GitHub Secrets:**
   - Same as above, plus:
   - `DOCKER_USERNAME` (optional) - Docker Hub username
   - `DOCKER_PASSWORD` (optional) - Docker Hub password

2. **Server Setup:**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Install Docker Compose
   sudo apt-get install docker-compose-plugin
   ```

3. **Push to main/master branch** - Deployment will trigger automatically!

## Manual Deployment

You can also trigger deployments manually:

1. Go to **Actions** tab in GitHub
2. Select the workflow you want to run
3. Click **Run workflow**
4. Select branch and click **Run workflow**

## Local Deployment Script

For manual local deployments, use the provided script:

```bash
./scripts/deploy.sh
```

Or with custom settings:

```bash
DEPLOY_PATH=/var/www/app SERVER_HOST=example.com ./scripts/deploy.sh
```

## Documentation

For detailed setup instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## Troubleshooting

### Workflow fails at SSH step
- Verify SSH key is correctly added to GitHub secrets
- Check server SSH access: `ssh user@server`
- Ensure public key is in server's `~/.ssh/authorized_keys`

### Build fails
- Check Node.js version matches (20.x)
- Verify all dependencies are in package.json
- Review workflow logs for specific errors

### Services don't start
- Check environment variables on server
- Verify database is running
- Check port availability
- Review application logs

## Support

- Check workflow logs in GitHub Actions
- Review server application logs
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed troubleshooting

