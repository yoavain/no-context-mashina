FROM node:22.8.0-alpine3.20@sha256:008735b83ef98c7635b5b73cb9b597172fe1895619a8d65378fa7110e427abb5

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
RUN npm i --omit=dev --ignore-scripts

# Crontab
RUN dos2unix /usr/app/crontab
RUN crontab /usr/app/crontab

CMD ["crond", "-f", "-L", "/usr/app/ext/logs/crond.log"]
