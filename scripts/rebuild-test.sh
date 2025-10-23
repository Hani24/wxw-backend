#!/bin/bash

# Rebuild and restart test Docker container
# This script rebuilds the Docker image and restarts the container with latest code from test branch

set -e

echo "🔨 Rebuilding Docker container with latest code from test branch..."

NODE_ENV=test NODE_TYPE_T=api docker-compose \
  -f ./docker-compose.test.yaml \
  --env-file=./docker-common/envs/test/.env \
  up --build -d

echo "✅ Container rebuilt and started successfully!"
echo ""
echo "📋 Useful commands:"
echo "  npm run docker:logs:test                      # View logs"
echo "  npm run docker:exec:test                      # Access container shell"
echo "  npm run docker:exec:test npm run seed:test    # Run seeders"
