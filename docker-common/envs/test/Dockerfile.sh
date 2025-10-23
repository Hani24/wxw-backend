# FROM node:18.0.0-alpine3.14
FROM node:18.0.0-bullseye
# FROM node:16.14.2-alpine
# FROM node:16.14.2-bullseye
# FROM node:16.14-bullseye
# FROM node:16-bullseye

# host-build => debian 11.1 x64-amd
# $node -v >> v16.14.2
# $npm -v >> 8.7.0

# --env-file=./docker-common/envs/${NODE_ENV}/.env
# RUN apk add --update bash nano curl tree bzip2 # freetype-dev libjpeg-turbo-dev libjpeg jpeg-dev libpng libpng-dev

ARG NODE_ENV="n/a"
ARG NODE_TYPE_T="n/a"

RUN env
RUN echo "NODE_ENV=${NODE_ENV}"
RUN echo "NODE_TYPE_T=${NODE_TYPE_T}"

RUN npm config get registry
# RUN npm i -g npm
# RUN npm i -g pm2
RUN node -v
RUN npm -v
RUN cat /etc/hosts
RUN cat /etc/resolv.conf

# RUN apt update && apt upgrade -y && apt install curl wget htop bash apt-utils net-tools -y

WORKDIR /home/node/server.api
RUN chown node:node -R /home/node/server.api

# COPY ./docker-common/_.bash_aliases /home/node/
# COPY ./docker-common/_.bash_history /home/node/
# COPY ./docker-common/_.bashrc /home/node/

USER node
COPY --chown=node:node . .
RUN ls -lah "./src/envs/${NODE_ENV}"
#COPY --chown=node:node "./src/envs/${NODE_ENV}/docker-build.server.config.${NODE_TYPE_T}.js" "./src/envs/${NODE_ENV}/server-config.js"
COPY --chown=node:node "./src/envs/${NODE_ENV}/server.config.js" "./src/envs/${NODE_ENV}/server-config.js"
RUN cat "./src/envs/${NODE_ENV}/server-config.js"

RUN ls -lah
RUN npm install

# RUN node -c src/envs/dev/sequelize.config.js
# RUN cat src/envs/dev/sequelize.config.js

# CMD NODE_ENV=test npx sequelize db:migrate --env test; npm run pm2:test
CMD npm run "migrate:${NODE_ENV}"; npx pm2-runtime "pm2.${NODE_ENV}.ecosystem.config.js"
