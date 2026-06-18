# No-Context Mashina Twitter Bot

A Twitter/X bot that posts random song lyrics / quotes at scheduled intervals. Tokens and the quotes
database are encrypted with AES-256-CBC, and it runs in Docker under `cron`. By default it posts at
**07:00, 11:00, 15:00, 19:00, 23:00 (Asia/Jerusalem)** — see [`crontab`](./crontab).

## Step 0 - prerequisites

* A Twitter account, with developer account enabled
* Setup an app and generate CLIENT_ID & CLIENT_SECRET
* Generate SECRET_KEY, SECRET_IV & ENCRYPTION_METHOD to be used in crypto.createCipheriv()
* Docker installed
* The lyrics source — kept in a separate **private** repo,
  [`no-context-mashina-lyrics`](https://github.com/yoavain/no-context-mashina-lyrics). Clone it (e.g. as a
  sibling folder) and point `SOURCE` at it (only needed to rebuild the quotes DB).

## Step 1 - configuration

create a `.env` file (fill in your own values — **leave this out of git; never commit real secrets**)
```properties
REDIRECT_URL=http://localhost:23001/redirect
CLIENT_ID=
CLIENT_SECRET=

SECRET_KEY=
SECRET_IV=
ENCRYPTION_METHOD=

# Only needed for `npm run parse` (rebuilding the quotes DB):
# path to the cloned no-context-mashina-lyrics folder
SOURCE=
```

> `.env` is gitignored. Keep your real credentials there (or in your shell/CI secret store) and nowhere else.

## Step 2 - Generate refresh token

You need to run (one time) an authorization flow via browser

1. Start the server for the redirect flow
```shell
npm run auth
```
2. Go to:
```
http://localhost:23001/auth
```

3. Authorize app

Refresh token will be saved (encrypted) to a local store under `./cache/refresh_tokens/`.

## Step 3 - Build & start docker

Build the image (bundles the compiled code and the encrypted `resources/quotes.db`) and start the container.
The same sequence is used to **update** an already-running bot — it rebuilds the image, removes the old
container, and starts a fresh one. The named volume `no-context-mashina` persists the token cache and logs
across restarts.

```shell
# replace the <...> placeholders with your real values
npm run build:image
docker stop no-context-mashina
docker rm no-context-mashina
docker run -d \
  -e CLIENT_ID=<client-id> \
  -e CLIENT_SECRET=<client-secret> \
  -e SECRET_KEY=<secret-key> \
  -e SECRET_IV=<secret-iv> \
  -e ENCRYPTION_METHOD=<encryption-method> \
  -e TOKENS_BASE_FOLDER=/usr/app/ext \
  -e NODE_ENV=production \
  -e TZ=Asia/Jerusalem \
  -v no-context-mashina:/usr/app/ext \
  --name no-context-mashina \
  --restart unless-stopped \
  no-context-mashina
```

> On the very first run, `docker stop` / `docker rm` will report that no such container exists — that's
> expected, just continue.

## Step 4 - (one-time) Copy refresh-token store to container

With the container running, copy the encrypted refresh-token cache (from Step 2) into its volume:

```shell
npm run copy-tokens-to-container
```

The token then lives in the persistent volume and is refreshed automatically on each tweet, so this is
normally only needed once.

## Updating the quotes database (adding / editing lyrics)

The quotes the bot posts live in an encrypted file, `resources/quotes.db`, which is **baked into the Docker
image at build time**. The plaintext lyrics live in the private `no-context-mashina-lyrics` repo that `SOURCE`
points to.

After adding a new `.txt` file to `SOURCE` (or editing an existing one), rebuild the DB:

```shell
# SOURCE + SECRET_KEY + SECRET_IV + ENCRYPTION_METHOD must be set (e.g. via .env)
npm run parse
```

What it does:

* Recursively reads **every** `.txt` under `SOURCE` (`$SOURCE/**/*.txt`).
* Splits each file into quotes on blank lines (a blank line separates two quotes).
* De-duplicates across all files, then **fails** if any single quote exceeds **140 characters**
  (fix the entry and re-run). It is a full rebuild every time, not incremental.
* Overwrites both:
  * `resources/quotes.db` — encrypted, committed and shipped in the image.
  * `resources/quotes.json` — plaintext, **gitignored** (local convenience copy; never committed).

To publish the new quotes, commit the regenerated `resources/quotes.db` and **rebuild + redeploy the image**
(Step 3) — the running container only sees the DB that was baked into its image.

## Local development

```shell
npm test        # lint + type-check
npm run jest    # run jest tests
npm run tweet   # post a tweet manually (needs runtime env vars + a valid token cache)
npm run parse   # rebuild the encrypted quotes DB (see above)
```
