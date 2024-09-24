import newRefreshTokens from "node-persist";
import { decryptData, encryptData } from "./db/encryption";
import { Logger } from "./logger";
import path from "node:path";

const { TOKENS_BASE_FOLDER } = process.env;

// @ts-ignore
newRefreshTokens.initSync({ dir: path.resolve(TOKENS_BASE_FOLDER, "cache", "refresh_tokens") });

const ID = "refresh_token";

export const getRefreshToken = async () => {
    const cachedToken = await newRefreshTokens.getItem(ID);
    const refreshToken = cachedToken && decryptData(cachedToken);
    if (refreshToken) {
        Logger.log("Using cached refresh token");
    }
    return refreshToken;
};

export const setRefreshToken = async (refreshToken: string) => {
    const encryptedRefreshToken = encryptData(refreshToken);
    await newRefreshTokens.setItem(ID, encryptedRefreshToken);
    Logger.log("Saved refresh token to cache");
};
