#!/bin/bash

# Follow Docker container logs
# Usage: ./scripts/logs-dev.sh [lines]
# Example: ./scripts/logs-dev.sh 100

LINES=${1:-50}

echo "📋 Showing last $LINES lines of logs (press Ctrl+C to exit)..."
echo ""

docker logs -f --tail=$LINES $(docker ps -q -f "name=M-A-dev")
