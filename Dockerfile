# develop stage
FROM node:14.3-alpine as develop-stage

RUN apk --no-cache add curl git

WORKDIR /app

RUN chown 1000:1000 /app

USER 1000:1000

COPY package.json ./
COPY yarn.lock ./

RUN yarn

COPY . .
