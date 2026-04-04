import { setEncryptionEnv, clearEncryptionEnv } from "../fixtures/encryptionEnv";

describe("encryption.ts — env var validation", () => {
    beforeEach(() => {
        jest.resetModules();
        // Prevent dotenv.config() inside encryption.ts from re-loading .env values
        jest.doMock("dotenv", () => ({ config: jest.fn() }));
        clearEncryptionEnv();
    });

    afterEach(() => {
        setEncryptionEnv();
    });

    it("throws at module load when SECRET_KEY is missing", () => {
        process.env.SECRET_IV = "iv";
        process.env.ENCRYPTION_METHOD = "aes-256-cbc";
        expect(() => require("../../src/db/encryption")).toThrow();
    });

    it("throws at module load when SECRET_IV is missing", () => {
        process.env.SECRET_KEY = "key";
        process.env.ENCRYPTION_METHOD = "aes-256-cbc";
        expect(() => require("../../src/db/encryption")).toThrow();
    });

    it("throws at module load when ENCRYPTION_METHOD is missing", () => {
        process.env.SECRET_KEY = "key";
        process.env.SECRET_IV = "iv";
        expect(() => require("../../src/db/encryption")).toThrow();
    });

    it("throws at module load when all three vars are missing", () => {
        expect(() => require("../../src/db/encryption")).toThrow();
    });
});

describe("encryption.ts — encryptData / decryptData", () => {
    let encryptData: (data: string) => string;
    let decryptData: (data: string) => string;

    beforeAll(() => {
        jest.resetModules();
        setEncryptionEnv();
        const mod = require("../../src/db/encryption");
        encryptData = mod.encryptData;
        decryptData = mod.decryptData;
    });

    it("encryptData returns a non-empty base64 string", () => {
        const result = encryptData("hello world");
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
        expect(() => Buffer.from(result, "base64")).not.toThrow();
    });

    it("decryptData is the inverse of encryptData — roundtrip produces original string", () => {
        const original = "some lyrics to encrypt";
        expect(decryptData(encryptData(original))).toBe(original);
    });

    it("roundtrip preserves Unicode characters", () => {
        const original = "שיר עברי — 日本語 — émojis 🎵";
        expect(decryptData(encryptData(original))).toBe(original);
    });

    it("roundtrip preserves empty string", () => {
        expect(decryptData(encryptData(""))).toBe("");
    });

    it("roundtrip preserves a 140-character string", () => {
        const original = "a".repeat(140);
        expect(decryptData(encryptData(original))).toBe(original);
    });

    it("encryptData produces different ciphertext for different inputs", () => {
        expect(encryptData("foo")).not.toBe(encryptData("bar"));
    });

    it("same input always produces the same ciphertext (deterministic IV)", () => {
        const input = "deterministic test";
        expect(encryptData(input)).toBe(encryptData(input));
    });

    it("decryptData throws or returns garbage on invalid base64 input", () => {
        expect(() => decryptData("not-valid-encrypted-data!!!")).toThrow();
    });
});
