FROM node:20.16.0-alpine3.20@sha256:eb8101caae9ac02229bd64c024919fe3d4504ff7f329da79ca60a04db08cef52
RUN apk add dumb-init

WORKDIR /usr/app
COPY package.json /usr/app/
COPY package-lock.json /usr/app/
COPY crontab /usr/app/
COPY dist /usr/app/dist/
COPY resources/quotes.db /usr/app/resources/

RUN apk add --no-cache tzdata
RUN mkdir -p /usr/app/ext/cache/refresh_tokens
RUN mkdir -p /usr/app/ext/logs
RUN chmod 777 -R /usr/app/ext
RUN npm i --only=production --ignore-scripts
RUN crontab crontab

USER node
CMD ["crond", "-f"]
