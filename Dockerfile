FROM node:22.11.0-alpine3.20@sha256:f265794478aa0b1a23d85a492c8311ed795bc527c3fe7e43453b3c872dcd71a3

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
