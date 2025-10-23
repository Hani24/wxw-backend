# Testing Branch Workflow Guide

This guide explains how to use a separate testing branch for deployment before merging to main.

## Overview

You now have two separate Docker environments:
- **Development (main branch)**: Production-ready code
- **Testing (test branch)**: For testing changes before production

## Workflow

### 1. Local Development

```bash
# Create and switch to test branch
git checkout -b test

# Or switch to existing test branch
git checkout test

# Make your changes
# ... edit files ...

# Commit your changes
git add .
git commit -m "Your changes"

# Push test branch to remote
git push origin test
```

### 2. Deploy to Test Environment on Server

SSH to your server and run:

```bash
# Navigate to your project directory
cd /path/to/your/project

# Fetch latest changes
git fetch origin

# Switch to test branch
git checkout test

# Pull latest test branch changes
git pull origin test

# Rebuild and start the test Docker container
npm run docker:rebuild:test
```

This will:
- Build a new Docker image from the test branch
- Start the container with test environment settings
- Run migrations automatically
- Start the API server with PM2

### 3. Test Your Changes

```bash
# View test container logs
npm run docker:logs:test

# Execute commands in test container
npm run docker:exec:test bash

# Run seeders if needed
npm run docker:seed:test

# Check PM2 status
npm run docker:exec:test npx pm2 list
```

### 4. Merge to Main and Deploy to Production

Once testing is complete:

```bash
# Switch to main branch
git checkout main

# Merge test branch
git merge test

# Push to main
git push origin main

# On server: switch to main and rebuild
git checkout main
git pull origin main
npm run docker:rebuild
```

## Available Commands

### Test Environment
- `npm run docker:rebuild:test` - Rebuild test container with latest code
- `npm run docker:restart:test` - Restart test container (no rebuild)
- `npm run docker:logs:test` - View test container logs
- `npm run docker:exec:test` - Execute commands in test container
- `npm run docker:seed:test` - Run seeders in test environment

### Development Environment (Main Branch)
- `npm run docker:rebuild` - Rebuild dev container with latest code
- `npm run docker:restart` - Restart dev container (no rebuild)
- `npm run docker:logs` - View dev container logs
- `npm run docker:exec` - Execute commands in dev container
- `npm run docker:seed` - Run seeders in dev environment

## Container Names

- Test environment: `M-A-test`
- Dev environment: `M-A-dev`

## Port Configuration

Both environments use `network_mode: host`, so ensure your test and dev configurations use different ports to avoid conflicts. You may need to update:
- [src/envs/test/server.config.js](src/envs/test/server.config.js) - Set different port for test
- [src/envs/test/config.js](src/envs/test/config.js) - Configure test-specific settings

## Tips

1. **Separate Databases**: Consider using separate databases for test and dev to avoid data conflicts
2. **Different Ports**: Make sure test and dev environments use different ports
3. **Branch Protection**: Consider protecting the main branch to prevent direct pushes
4. **Cleanup**: Stop test containers when not in use to free resources:
   ```bash
   docker stop M-A-test
   ```

## Troubleshooting

### Container conflicts
If you get port conflicts:
```bash
# Stop all containers
docker stop M-A-test M-A-dev

# Start only the one you need
npm run docker:rebuild:test  # or docker:rebuild
```

### View all containers
```bash
docker ps -a | grep M-A
```

### Remove stopped containers
```bash
docker rm M-A-test
docker rm M-A-dev
```
