import path from "node:path";

const TOKENS_BASE_FOLDER = process.env.TOKENS_BASE_FOLDER || ".";
export const TOKENS_FULL_PATH = path.resolve(TOKENS_BASE_FOLDER, "cache", "refresh_tokens");

export const REFRESH_TOKEN_KEY = "refresh_token";
const REFRESH_TOKEN_KEY_SHA256 = "6c8a7d4aa21708a432174e4cb5c6cfaf0218f5f3e52f9a76a7d95d2aaade2c83";

const SOURCE_TOKENS_CACHE_PATH = TOKENS_FULL_PATH.substring(2).replace(/\\/g, "/");
export const SOURCE_TOKENS_CACHE_FILE = `${SOURCE_TOKENS_CACHE_PATH}/${REFRESH_TOKEN_KEY_SHA256}`;

export const REFRESH_TOKEN_DOCKER_LOCATION = `/usr/app/ext/cache/refresh_tokens/${REFRESH_TOKEN_KEY_SHA256}`;
