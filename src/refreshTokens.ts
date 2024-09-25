import newRefreshTokens from "node-persist";
import { decryptData, encryptData } from "./db/encryption";
import { Logger } from "./logger";
import { REFRESH_TOKEN_KEY, TOKENS_FULL_PATH } from "./refreshTokenConsts";

// @ts-ignore
newRefreshTokens.initSync({ dir: TOKENS_FULL_PATH });

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
