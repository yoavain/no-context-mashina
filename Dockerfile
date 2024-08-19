FROM node:20.16.0-alpine3.20@sha256:eb8101caae9ac02229bd64c024919fe3d4504ff7f329da79ca60a04db08cef52

# Timezone
RUN apk add --no-cache tzdata

# Files
WORKDIR /usr/app
COPY package.json /usr/app/
COPY package-lock.json /usr/app/
COPY crontab /usr/app/
COPY dist /usr/app/dist/
COPY resources/quotes.db /usr/app/resources/
RUN mkdir -p /usr/app/ext/cache/refresh_tokens
RUN mkdir -p /usr/app/ext/logs

# Dependencies
RUN npm i --only=production --ignore-scripts

# Crontab
RUN dos2unix /usr/app/crontab
RUN crontab /usr/app/crontab

CMD ["crond", "-f"]
