# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

All scripts run TypeScript directly via `ts-node/register/transpile-only` — no separate compile step needed for development.

## Architecture

### Data Flow

1. **Auth (one-time):** `scripts/auth.ts` spins up an Express server on port 23001, drives the OAuth 2.0 PKCE flow, and saves the encrypted refresh token via `node-persist`.
2. **Tweet:** `tweet.ts` (entry point) → `client.ts` (build Twitter client, refresh token) → `db/randomQuote.ts` (decrypt and pick a random quote) → post tweet.
3. **Quote DB:** Source `.txt` files are parsed by `db/parse.ts` (split on double newlines, filter ≤140 chars), encrypted, and saved to `resources/quotes.db`.

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

- Dockerized on Node 24.14.0 Alpine.
- Cron runs `npm run tweet` at 07:00, 11:00, 15:00, 19:00, 23:00 Asia/Jerusalem.
- Token cache is stored in a persistent Docker volume (`/usr/app/ext`).

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
