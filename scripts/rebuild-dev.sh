#!/bin/bash

# Rebuild and restart development Docker container
# This script rebuilds the Docker image and restarts the container with latest code

set -e

echo "🔨 Rebuilding Docker container with latest code..."

NODE_ENV=dev NODE_TYPE_T=api docker-compose \
  -f ./docker-compose.dev.yaml \
  --env-file=./docker-common/envs/dev/.env \
  up --build -d

echo "✅ Container rebuilt and started successfully!"
echo ""
echo "📋 Useful commands:"
echo "  docker logs -f 5be9107cad4b               # View logs"
echo "  docker exec 5be9107cad4b npx pm2 list     # Check PM2 processes"
echo "  docker exec 5be9107cad4b npm run seed:dev # Run seeders"
