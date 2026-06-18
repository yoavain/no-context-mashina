FROM node:24.16.0-alpine3.24@sha256:21f403ab171f2dc89bad4dd69d7721bfd15f084ccb46cdd225f31f2bc59b5c9a

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
