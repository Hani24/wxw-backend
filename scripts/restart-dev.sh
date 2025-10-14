#!/bin/bash

# Quick restart without rebuild (only restarts container, doesn't rebuild image)
# Use this when you haven't changed source code

set -e

echo "🔄 Restarting Docker container (no rebuild)..."

NODE_ENV=dev NODE_TYPE_T=api docker-compose \
  -f ./docker-compose.dev.yaml \
  --env-file=./docker-common/envs/dev/.env \
  restart

echo "✅ Container restarted successfully!"
