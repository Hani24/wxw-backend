#!/bin/bash

#!/bin/bash

NODE_ENV=${1:-'dev'};
NODE_TYPE_T=${2:-'api'};
d=${3:-''};

DOCKER_YAML="./docker-compose.${NODE_ENV}.yaml";
DOCKER_ENV="./docker-common/envs/${NODE_ENV}/.env";

echo " Using [.env:${NODE_ENV}] config";
echo "   DOCKER_YAML: ${DOCKER_YAML}";
echo "   DOCKER_ENV: ${DOCKER_ENV}";

NODE_ENV="${NODE_ENV}" \
NODE_TYPE_T="${NODE_TYPE_T}" \
docker-compose \
-f $DOCKER_YAML \
--env-file=$DOCKER_ENV \
up \
--build \
$d

# build \
# --no-cache
