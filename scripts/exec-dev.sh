#!/bin/bash

# Execute command in Docker container
# Usage: ./scripts/exec-dev.sh <command>
# Example: ./scripts/exec-dev.sh npm run seed:dev

if [ -z "$1" ]; then
  echo "❌ Error: No command provided"
  echo "Usage: ./scripts/exec-dev.sh <command>"
  echo ""
  echo "Examples:"
  echo "  ./scripts/exec-dev.sh npm run seed:dev"
  echo "  ./scripts/exec-dev.sh npx pm2 list"
  echo "  ./scripts/exec-dev.sh bash"
  exit 1
fi

CONTAINER=$(docker ps -q -f "name=M-A-dev")

if [ -z "$CONTAINER" ]; then
  echo "❌ Error: Container M-A-dev is not running"
  exit 1
fi

docker exec -it $CONTAINER "$@"
