# Docker Development Scripts

Helper scripts for managing the development Docker container.

## Available Scripts

### 1. Rebuild Container (with latest code)
```bash
# Use this after pulling code changes from git
npm run docker:rebuild
# OR
./scripts/rebuild-dev.sh
```
**What it does:** Rebuilds the Docker image with the latest source code and restarts the container. Use this when you've changed source files.

### 2. Restart Container (without rebuild)
```bash
# Quick restart without rebuilding
npm run docker:restart
# OR
./scripts/restart-dev.sh
```
**What it does:** Just restarts the container without rebuilding. Use this for configuration changes in mounted volumes.

### 3. View Logs
```bash
# View last 50 lines and follow
npm run docker:logs
# OR
./scripts/logs-dev.sh

# View last 100 lines
./scripts/logs-dev.sh 100
```
**What it does:** Shows container logs in real-time.

### 4. Execute Commands in Container
```bash
# Run any command in the container
npm run docker:exec -- <command>
# OR
./scripts/exec-dev.sh <command>

# Examples:
./scripts/exec-dev.sh npm run seed:dev
./scripts/exec-dev.sh npx pm2 list
./scripts/exec-dev.sh bash
```

### 5. Run Seeders
```bash
# Quick seeder execution
npm run docker:seed
```

## When to Use Each Command

| Scenario | Command |
|----------|---------|
| Pulled new code from git | `npm run docker:rebuild` |
| Changed source files (src/) | `npm run docker:rebuild` |
| Only changed mounted volumes (logs, pm2) | `npm run docker:restart` |
| Want to see what's happening | `npm run docker:logs` |
| Need to run seeders | `npm run docker:seed` |
| Need to run any command | `npm run docker:exec -- <command>` |

## Manual Commands

If you prefer the full commands:

```bash
# Rebuild
NODE_ENV=dev NODE_TYPE_T=api docker-compose \
  -f ./docker-compose.dev.yaml \
  --env-file=./docker-common/envs/dev/.env \
  up --build -d

# Check status
docker ps -f "name=M-A-dev"

# View logs
docker logs -f $(docker ps -q -f "name=M-A-dev")

# Execute command
docker exec -it $(docker ps -q -f "name=M-A-dev") <command>
```
