#!/bin/bash

# Execute command in Docker container
# Usage: ./scripts/exec-test.sh <command>
# Example: ./scripts/exec-test.sh npm run seed:test

if [ -z "$1" ]; then
  echo "❌ Error: No command provided"
  echo "Usage: ./scripts/exec-test.sh <command>"
  echo ""
  echo "Examples:"
  echo "  ./scripts/exec-test.sh npm run seed:test"
  echo "  ./scripts/exec-test.sh npx pm2 list"
  echo "  ./scripts/exec-test.sh bash"
  exit 1
fi

CONTAINER=$(docker ps -q -f "name=M-A-test")

if [ -z "$CONTAINER" ]; then
  echo "❌ Error: Container M-A-test is not running"
  exit 1
fi

docker exec -it $CONTAINER "$@"
