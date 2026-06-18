# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Docs split:** [`README.md`](./README.md) is the operator runbook — environment setup, the one-time OAuth flow, building/starting/updating the Docker container, and rebuilding the encrypted quotes DB. **CLAUDE.md** (this file) covers codebase architecture, the module map, and code conventions — what you need to *change the code*, not to *operate the bot*. Keep operational steps in the README and link to them from here instead of duplicating.

## Project Overview

**no-context-mashina** is a Twitter/X bot that posts random song lyrics or quotes at scheduled intervals. It uses OAuth 2.0 for authentication, AES-256-CBC encryption for storing tokens and the quotes database, and runs in Docker with cron scheduling.

## Commands

```bash
# Lint and type-check (this is the "test" script)
npm test

# Fix lint issues
npm run eslint:fix

# Run jest tests
npm run jest

# Build (type-check only, no emit)
npm run build

# Compile TypeScript to dist/
npm run tsc

# Post a tweet manually
npm run tweet

# Start OAuth authorization flow (one-time setup)
npm run auth

# Parse lyrics .txt files into encrypted quote database
npm run parse

# Build Docker image
npm run build:image

# Copy token cache into running container (post-deploy setup)
npm run copy-tokens-to-container
```

All scripts run TypeScript directly via `ts-node/register/transpile-only` — no separate compile step needed for development. This is a catalog of the individual scripts; [README.md](./README.md) covers the operational sequences that chain them (deploy/update the container, rebuild the quotes DB).

## Architecture

### Data Flow

1. **Auth (one-time):** `scripts/auth.ts` spins up an Express server on port 23001, drives the OAuth 2.0 PKCE flow, and saves the encrypted refresh token via `node-persist`.
2. **Tweet:** `tweet.ts` (entry point) → `client.ts` (build Twitter client, refresh token) → `db/randomQuote.ts` (decrypt and pick a random quote) → post tweet.
3. **Quote DB:** Source `.txt` files are parsed by `db/parse.ts` — split on blank lines, de-duplicated, and validated (any quote >140 chars **throws**, it is not filtered out). The result is written both as plaintext `resources/quotes.json` (gitignored) and encrypted `resources/quotes.db` (baked into the image). See [README.md](./README.md) for the rebuild/redeploy steps.

### Key Modules

| File | Role |
|------|------|
| `src/tweet.ts` | Entry point for posting a tweet |
| `src/client.ts` | Twitter API v2 client with OAuth 2.0 token refresh |
| `src/refreshTokens.ts` | Encrypted persistence of OAuth refresh tokens (node-persist) |
| `src/refreshTokenConsts.ts` | Storage path/key constants for token persistence |
| `src/db/encryption.ts` | AES-256-CBC encrypt/decrypt (used for tokens and quotes DB) |
| `src/db/randomQuote.ts` | Loads `resources/quotes.db`, decrypts, returns random quote |
| `src/db/parse.ts` | Parses source `.txt` files into the encrypted quotes database |
| `src/scripts/auth.ts` | One-time OAuth setup server |
| `src/scripts/refreshTokenCacheDeploy.ts` | Copies token cache into Docker container |
| `src/logger.ts` | Timestamp-prefixed console logger |

### Encryption

All sensitive data (refresh tokens, quotes database) is encrypted with AES-256-CBC. Keys and IVs come from environment variables (`SECRET_KEY`, `SECRET_IV`, `ENCRYPTION_METHOD`).

### Deployment

- Dockerized on Node 24.14.1 Alpine; the container entrypoint is `crond`, which runs the compiled `dist/tweet.js`.
- The schedule lives in [`crontab`](./crontab) (currently 5×/day, Asia/Jerusalem) — that file is the source of truth, not a list here.
- `resources/quotes.db` is baked into the image at build time; the token cache and logs persist in the `/usr/app/ext` Docker volume.

For the build/run/update commands and the one-time token bootstrap, see [README.md](./README.md).

## Required Environment Variables

```
CLIENT_ID          # Twitter OAuth 2.0 client ID
CLIENT_SECRET      # Twitter OAuth 2.0 client secret
REDIRECT_URL       # OAuth redirect URL (e.g. http://localhost:23001/redirect)
SECRET_KEY         # 32-char hex key for AES-256-CBC
SECRET_IV          # 16-char hex IV for AES-256-CBC
ENCRYPTION_METHOD  # e.g. aes-256-cbc
SOURCE             # Path to directory containing lyrics .txt files (for parse script)
TOKENS_BASE_FOLDER # Optional; base folder for token cache (defaults to ".")
```

## Code Style

- TypeScript strict mode is **off**; `esModuleInterop` is on.
- ESLint flat config (ESLint 9), 4-space indentation, double quotes, CRLF line endings, max 200 chars/line.
- Jest tests go in `test/` with the pattern `*.test.ts`.
