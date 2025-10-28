#!/bin/bash

# Analyze Docker images and show which are in use vs unused

echo "🔍 Docker Images Analysis"
echo "========================="
echo ""

echo "📋 All Images:"
docker images --format "table {{.Repository}}:{{.Tag}}\t{{.ID}}\t{{.Size}}\t{{.CreatedAt}}"
echo ""

echo "🏃 Running Containers and Their Images:"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Size}}"
echo ""

echo "🛑 Stopped Containers and Their Images:"
docker ps -a --filter "status=exited" --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
echo ""

echo "📊 Image Usage Summary:"
echo ""

# Get all images
ALL_IMAGES=$(docker images --format "{{.ID}}")

for IMAGE_ID in $ALL_IMAGES; do
    IMAGE_NAME=$(docker images --filter "id=$IMAGE_ID" --format "{{.Repository}}:{{.Tag}}")
    IMAGE_SIZE=$(docker images --filter "id=$IMAGE_ID" --format "{{.Size}}")

    # Check if image is used by any container (running or stopped)
    CONTAINERS=$(docker ps -a --filter "ancestor=$IMAGE_ID" --format "{{.Names}}" | wc -l)

    # Check if image is used as a base for other images
    CHILDREN=$(docker images --filter "since=$IMAGE_ID" -q | wc -l)

    if [ "$CONTAINERS" -gt 0 ]; then
        CONTAINER_NAMES=$(docker ps -a --filter "ancestor=$IMAGE_ID" --format "{{.Names}}" | tr '\n' ', ' | sed 's/,$//')
        echo "✅ IN USE: $IMAGE_NAME ($IMAGE_SIZE)"
        echo "   Used by: $CONTAINER_NAMES"
    elif [[ "$IMAGE_NAME" == *"node:"* ]] || [[ "$IMAGE_NAME" == *"nginx:"* ]]; then
        echo "🔧 BASE IMAGE: $IMAGE_NAME ($IMAGE_SIZE)"
        echo "   (May be used for building other images)"
    else
        echo "❌ UNUSED: $IMAGE_NAME ($IMAGE_SIZE)"
        echo "   Can be removed with: docker rmi $IMAGE_ID"
    fi
    echo ""
done

echo ""
echo "💾 Space that can be reclaimed:"
docker images --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}" | grep -v "REPOSITORY"
echo ""
RECLAIMABLE=$(docker system df | grep "Images" | awk '{print $4}')
echo "Total reclaimable: $RECLAIMABLE"
echo ""

echo "🗑️  Quick cleanup commands:"
echo "   docker image prune -f          # Remove dangling images"
echo "   docker image prune -a -f       # Remove ALL unused images"
echo "   docker rmi IMAGE_ID            # Remove specific image"
echo ""

echo "⚠️  Before removing base images (node:*, nginx:*), check if they're needed for builds!"
