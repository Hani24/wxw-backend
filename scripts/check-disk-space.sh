#!/bin/bash

# Check disk space and Docker resource usage

echo "💾 Disk Space Report"
echo "===================="
echo ""

# Overall disk usage
echo "📊 Overall Disk Usage:"
df -h | grep -E "Filesystem|/$|/home"
echo ""

# Docker disk usage
echo "🐳 Docker Resource Usage:"
docker system df
echo ""

# Build cache specifically
echo "🏗️  Build Cache Usage:"
docker system df | grep -i "build cache" || echo "   No build cache data available"
BUILD_CACHE_SIZE=$(docker system df | grep -i "build cache" | awk '{print $4}' | sed 's/GB//')
if [ ! -z "$BUILD_CACHE_SIZE" ]; then
    echo "   Run 'docker builder prune -f' to remove unused build cache"
    echo "   Run 'docker builder prune -a -f' to remove ALL build cache"
fi
echo ""

# Detailed Docker volumes
echo "📦 Docker Volumes (detailed):"
docker system df -v | grep -A 50 "Local Volumes" | head -20
echo ""

# Dangling images
DANGLING=$(docker images -f "dangling=true" -q | wc -l)
echo "🗑️  Dangling/Unused Images: $DANGLING"
if [ "$DANGLING" -gt 0 ]; then
    echo "   Run 'docker image prune -f' to remove them"
fi
echo ""

# Stopped containers
STOPPED=$(docker ps -a --filter "status=exited" -q | wc -l)
echo "🛑 Stopped Containers: $STOPPED"
if [ "$STOPPED" -gt 0 ]; then
    echo "   Run 'docker container prune -f' to remove them"
fi
echo ""

# Unused volumes
UNUSED_VOL=$(docker volume ls -f dangling=true -q | wc -l)
echo "📁 Unused Volumes: $UNUSED_VOL"
if [ "$UNUSED_VOL" -gt 0 ]; then
    echo "   Run 'docker volume prune -f' to remove them"
fi
echo ""

# List all containers
echo "📋 All Containers:"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Size}}"
echo ""

# List all images
echo "🖼️  All Images:"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" | head -10
echo ""

# Recommendations
echo "💡 Quick Cleanup Commands:"
echo "   docker image prune -f              # Remove dangling images"
echo "   docker image prune -a -f           # Remove ALL unused images"
echo "   docker container prune -f          # Remove stopped containers"
echo "   docker volume prune -f             # Remove unused volumes"
echo "   docker system prune -a -f          # Remove everything unused"
