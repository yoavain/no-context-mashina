import newRefreshTokens from "node-persist";
import { decryptData, encryptData } from "./db/encryption";
import { Logger } from "./logger";
import path from "node:path";
import { REFRESH_TOKEN_KEY } from "./refreshTokenConsts";

const { TOKENS_BASE_FOLDER } = process.env;

// @ts-ignore
newRefreshTokens.initSync({ dir: path.resolve(TOKENS_BASE_FOLDER, "cache", "refresh_tokens") });

export const getRefreshToken = async () => {
    const cachedToken = await newRefreshTokens.getItem(REFRESH_TOKEN_KEY);
    const refreshToken = cachedToken && decryptData(cachedToken);
    if (refreshToken) {
        Logger.log("Using cached refresh token");
    }
    return refreshToken;
};

export const setRefreshToken = async (refreshToken: string) => {
    const encryptedRefreshToken = encryptData(refreshToken);
    await newRefreshTokens.setItem(REFRESH_TOKEN_KEY, encryptedRefreshToken);
    Logger.log("Saved refresh token to cache");
};
