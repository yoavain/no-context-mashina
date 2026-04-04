import { TOKENS_FULL_PATH } from "../../src/refreshTokenConsts";

describe("refreshTokens.ts", () => {
    let mockInitSync: jest.Mock;
    let mockGetItem: jest.Mock;
    let mockSetItem: jest.Mock;
    let mockEncryptData: jest.Mock;
    let mockDecryptData: jest.Mock;

    let getRefreshToken: () => Promise<string | undefined>;
    let setRefreshToken: (token: string) => Promise<void>;

    beforeEach(() => {
        jest.resetModules();

        mockInitSync = jest.fn();
        mockGetItem = jest.fn();
        mockSetItem = jest.fn().mockResolvedValue(undefined);
        mockEncryptData = jest.fn().mockReturnValue("encrypted");
        mockDecryptData = jest.fn().mockReturnValue("decrypted-token");

        jest.doMock("node-persist", () => ({
            default: { initSync: mockInitSync, getItem: mockGetItem, setItem: mockSetItem },
            __esModule: true
        }));

        jest.doMock("../../src/db/encryption", () => ({
            encryptData: mockEncryptData,
            decryptData: mockDecryptData
        }));

        const mod = require("../../src/refreshTokens");
        getRefreshToken = mod.getRefreshToken;
        setRefreshToken = mod.setRefreshToken;
    });

    describe("module load — initSync side effect", () => {
        it("calls node-persist initSync with the TOKENS_FULL_PATH directory option", () => {
            expect(mockInitSync).toHaveBeenCalledWith({ dir: TOKENS_FULL_PATH });
        });
    });

    describe("getRefreshToken", () => {
        it("calls getItem with REFRESH_TOKEN_KEY", async () => {
            mockGetItem.mockResolvedValue(null);
            await getRefreshToken();
            expect(mockGetItem).toHaveBeenCalledWith("refresh_token");
        });

        it("calls decryptData with the cached encrypted value when a token exists", async () => {
            mockGetItem.mockResolvedValue("some-encrypted-token");
            await getRefreshToken();
            expect(mockDecryptData).toHaveBeenCalledWith("some-encrypted-token");
        });

        it("returns the decrypted token when a cached token exists", async () => {
            mockGetItem.mockResolvedValue("encrypted");
            mockDecryptData.mockReturnValue("plaintext-token");
            const result = await getRefreshToken();
            expect(result).toBe("plaintext-token");
        });

        it("returns a falsy value when getItem returns null", async () => {
            mockGetItem.mockResolvedValue(null);
            const result = await getRefreshToken();
            expect(result).toBeFalsy();
        });

        it("does not call decryptData when there is no cached token", async () => {
            mockGetItem.mockResolvedValue(null);
            await getRefreshToken();
            expect(mockDecryptData).not.toHaveBeenCalled();
        });

        it("logs 'Using cached refresh token' when a token is found", async () => {
            const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
            mockGetItem.mockResolvedValue("encrypted");
            mockDecryptData.mockReturnValue("plaintext-token");
            await getRefreshToken();
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.any(String),
                "Using cached refresh token"
            );
        });

        it("does not log 'Using cached refresh token' when no token found", async () => {
            const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
            mockGetItem.mockResolvedValue(null);
            await getRefreshToken();
            const calls = consoleSpy.mock.calls.map((c) => c[1]);
            expect(calls).not.toContain("Using cached refresh token");
        });
    });

    describe("setRefreshToken", () => {
        it("calls encryptData with the plaintext refresh token", async () => {
            await setRefreshToken("my-refresh-token");
            expect(mockEncryptData).toHaveBeenCalledWith("my-refresh-token");
        });

        it("calls setItem with REFRESH_TOKEN_KEY and the encrypted value", async () => {
            mockEncryptData.mockReturnValue("encrypted-value");
            await setRefreshToken("my-refresh-token");
            expect(mockSetItem).toHaveBeenCalledWith("refresh_token", "encrypted-value");
        });

        it("logs 'Saved refresh token to cache' after saving", async () => {
            const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
            await setRefreshToken("my-token");
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.any(String),
                "Saved refresh token to cache"
            );
        });

        it("propagates rejection if setItem rejects", async () => {
            mockSetItem.mockRejectedValue(new Error("disk full"));
            await expect(setRefreshToken("token")).rejects.toThrow("disk full");
        });
    });
});
