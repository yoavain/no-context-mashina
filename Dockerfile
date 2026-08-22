FROM node:24.19.0-alpine3.24@sha256:d32cdf619f63fe0471182d08996dd516c6275bb5fd31ae06e55a570bd9e1ad43

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

# Healthcheck: fails when the last tweet run failed, or when it went stale
HEALTHCHECK --interval=5m --timeout=30s --start-period=9h --retries=2 \
  CMD node /usr/app/dist/scripts/healthcheck.js || exit 1

CMD ["crond", "-f", "-L", "/usr/app/ext/logs/crond.log"]
