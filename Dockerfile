FROM node:20.16.0-alpine3.20@sha256:eb8101caae9ac02229bd64c024919fe3d4504ff7f329da79ca60a04db08cef52
RUN apk add dumb-init

ENV NODE_ENV production

WORKDIR /usr/app
COPY package.json /usr/app/
COPY package-lock.json /usr/app/
COPY dist /usr/app/
RUN npm i --only=production --ignore-scripts

USER node
CMD ["dumb-init", "node", "dist/tweet.js"]
