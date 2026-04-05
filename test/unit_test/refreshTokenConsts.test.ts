import path from "node:path";

const SHA256_OF_REFRESH_TOKEN = "6c8a7d4aa21708a432174e4cb5c6cfaf0218f5f3e52f9a76a7d95d2aaade2c83";
const DOCKER_LOCATION = `/usr/app/ext/cache/refresh_tokens/${SHA256_OF_REFRESH_TOKEN}`;

describe("refreshTokenConsts.ts — defaults", () => {
    let consts: typeof import("../../src/refreshTokenConsts");

    beforeAll(() => {
        jest.resetModules();
        delete process.env.TOKENS_BASE_FOLDER;
        consts = require("../../src/refreshTokenConsts");
    });

    it("REFRESH_TOKEN_KEY equals 'refresh_token'", () => {
        expect(consts.REFRESH_TOKEN_KEY).toBe("refresh_token");
    });

    it("TOKENS_FULL_PATH defaults to ./cache/refresh_tokens when TOKENS_BASE_FOLDER is unset", () => {
        const expected = path.resolve(".", "cache", "refresh_tokens");
        expect(consts.TOKENS_FULL_PATH).toBe(expected);
    });

    it("SOURCE_TOKENS_CACHE_FILE contains the known SHA-256 filename segment", () => {
        expect(consts.SOURCE_TOKENS_CACHE_FILE).toContain(SHA256_OF_REFRESH_TOKEN);
    });

    it("REFRESH_TOKEN_DOCKER_LOCATION equals the expected Docker path", () => {
        expect(consts.REFRESH_TOKEN_DOCKER_LOCATION).toBe(DOCKER_LOCATION);
    });
});

describe("refreshTokenConsts.ts — custom TOKENS_BASE_FOLDER", () => {
    let consts: typeof import("../../src/refreshTokenConsts");

    beforeAll(() => {
        jest.resetModules();
        process.env.TOKENS_BASE_FOLDER = "/custom/base";
        consts = require("../../src/refreshTokenConsts");
    });

    afterAll(() => {
        delete process.env.TOKENS_BASE_FOLDER;
    });

    it("TOKENS_FULL_PATH uses TOKENS_BASE_FOLDER when set", () => {
        const expected = path.resolve("/custom/base", "cache", "refresh_tokens");
        expect(consts.TOKENS_FULL_PATH).toBe(expected);
    });
});
