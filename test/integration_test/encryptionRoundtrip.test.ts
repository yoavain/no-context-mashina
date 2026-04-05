import { setEncryptionEnv, clearEncryptionEnv, TEST_IV, TEST_METHOD } from "../fixtures/encryptionEnv";

describe("Encryption roundtrip — real crypto", () => {
    let encryptData: (data: string) => string;
    let decryptData: (data: string) => string;

    beforeAll(() => {
        jest.resetModules();
        setEncryptionEnv();
        const mod = require("../../src/db/encryption");
        encryptData = mod.encryptData;
        decryptData = mod.decryptData;
    });

    afterAll(() => {
        clearEncryptionEnv();
    });

    it("encryptData then decryptData recovers a simple ASCII string", () => {
        const original = "hello world";
        expect(decryptData(encryptData(original))).toBe(original);
    });

    it("encryptData then decryptData recovers a JSON-serialised quotes array", () => {
        const quotes = ["First lyric", "Second lyric", "Third lyric"];
        const json = JSON.stringify(quotes);
        expect(decryptData(encryptData(json))).toBe(json);
        expect(JSON.parse(decryptData(encryptData(json)))).toEqual(quotes);
    });

    it("encrypted output differs from plaintext input", () => {
        const original = "some text to encrypt";
        expect(encryptData(original)).not.toBe(original);
    });

    it("encrypted output is valid base64", () => {
        const result = encryptData("test data");
        const decoded = Buffer.from(result, "base64").toString("base64");
        expect(decoded).toBe(result);
    });

    it("ciphertext is stable across multiple calls (deterministic IV)", () => {
        const input = "stability check";
        expect(encryptData(input)).toBe(encryptData(input));
    });

    it("decrypting with wrong SECRET_KEY produces garbage or throws", () => {
        const { encryptData: enc } = require("../../src/db/encryption");
        const encrypted = enc("original data");

        jest.resetModules();
        process.env.SECRET_KEY = "completely-different-key-xyz";
        process.env.SECRET_IV = TEST_IV;
        process.env.ENCRYPTION_METHOD = TEST_METHOD;
        const { decryptData: decWrong } = require("../../src/db/encryption");

        let result: string;
        try {
            result = decWrong(encrypted);
        }
        catch {
            return; // throwing is acceptable
        }
        // if it doesn't throw, result should not equal the original
        expect(result).not.toBe("original data");

        // restore correct env
        jest.resetModules();
        setEncryptionEnv();
    });
});
