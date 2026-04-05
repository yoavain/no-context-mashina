import os from "os";
import path from "path";
import fs from "fs";
import { setEncryptionEnv, clearEncryptionEnv } from "../fixtures/encryptionEnv";

describe("Refresh token persistence — real node-persist + real encryption", () => {
    let tempDir: string;
    let getRefreshToken: () => Promise<string | undefined>;
    let setRefreshToken: (token: string) => Promise<void>;

    beforeAll(() => {
        setEncryptionEnv();
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "no-context-mashina-test-"));
        process.env.TOKENS_BASE_FOLDER = tempDir;
    });

    beforeEach(() => {
        jest.resetModules();
        const mod = require("../../src/refreshTokens");
        getRefreshToken = mod.getRefreshToken;
        setRefreshToken = mod.setRefreshToken;
    });

    afterAll(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
        clearEncryptionEnv();
        delete process.env.TOKENS_BASE_FOLDER;
    });

    it("setRefreshToken stores a token that getRefreshToken can retrieve", async () => {
        await setRefreshToken("my-real-refresh-token");
        const retrieved = await getRefreshToken();
        expect(retrieved).toBe("my-real-refresh-token");
    });

    it("the stored value in node-persist is encrypted (differs from the plaintext)", async () => {
        const plaintext = "plaintext-token-value";
        await setRefreshToken(plaintext);

        // Read the raw value from node-persist directly
        const nodePersist = require("node-persist");
        const rawStored = await nodePersist.getItem("refresh_token");
        expect(rawStored).not.toBe(plaintext);
    });

    it("getRefreshToken returns a falsy value when no token has been stored", async () => {
        // Use a fresh temp dir with no data
        const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), "no-context-mashina-empty-"));
        try {
            jest.resetModules();
            process.env.TOKENS_BASE_FOLDER = emptyDir;
            const mod = require("../../src/refreshTokens");
            const result = await mod.getRefreshToken();
            expect(result).toBeFalsy();
        }
        finally {
            fs.rmSync(emptyDir, { recursive: true, force: true });
            process.env.TOKENS_BASE_FOLDER = tempDir;
        }
    });

    it("setRefreshToken overwrites an existing token with a new value", async () => {
        await setRefreshToken("first-token");
        await setRefreshToken("second-token");

        jest.resetModules();
        process.env.TOKENS_BASE_FOLDER = tempDir;
        const mod = require("../../src/refreshTokens");
        const retrieved = await mod.getRefreshToken();
        expect(retrieved).toBe("second-token");
    });
});
