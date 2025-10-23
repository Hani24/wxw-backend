#!/bin/bash

# Follow Docker container logs
# Usage: ./scripts/logs-test.sh [lines]
# Example: ./scripts/logs-test.sh 100

LINES=${1:-50}

echo "📋 Showing last $LINES lines of logs (press Ctrl+C to exit)..."
echo ""

docker logs -f --tail=$LINES $(docker ps -q -f "name=M-A-test")
