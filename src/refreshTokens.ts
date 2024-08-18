import cache from "persistent-cache";
import { decryptData, encryptData } from "./db/encryption";

const { TOKENS_BASE_FOLDER } = process.env;

const refreshTokens = cache({ base: TOKENS_BASE_FOLDER, name: "refresh_tokens" });
const ID = "refresh_token";

export const getRefreshToken = () => {
    const cachedToken = refreshTokens.getSync(ID);
    const refreshToken = cachedToken && decryptData(cachedToken);
    if (refreshToken) {
        console.log("Using cached refresh token");
    }
    return refreshToken;
};

export const setRefreshToken = (refreshToken: string) => {
    const encryptedRefreshToken = encryptData(refreshToken);
    refreshTokens.putSync(ID, encryptedRefreshToken);
    console.log("Saved refresh token to cache");
};
