FROM node:22.19.0-alpine3.21@sha256:6b2127043c2faa4f15cdcdeb65a39fc9afbecf5559301898b754bbff561a8aa9

# Timezone
RUN apk add --no-cache tzdata

# ENV
ENV TZ=Asia/Jerusalem
ENV NODE_ENV=production
ENV TOKENS_BASE_FOLDER=/usr/app/ext

# Files
WORKDIR /usr/app
COPY package.json /usr/app/
COPY package-lock.json /usr/app/
COPY .npmrc /usr/app/
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
