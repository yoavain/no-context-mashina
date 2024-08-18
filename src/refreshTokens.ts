import cache from "persistent-cache";
import { decryptData, encryptData } from "./db/encryption";

const refreshTokens = cache({ base: "./resources/", name: "refresh_tokens" });
const ID = "refresh_token";

export const getRefreshToken = () => {
    const cachedToken = refreshTokens.getSync(ID);
    return cachedToken && decryptData(cachedToken);
};

export const setRefreshToken = (refreshToken: string) => {
    const encryptedRefreshToken = encryptData(refreshToken);
    refreshTokens.putSync(ID, encryptedRefreshToken);
};
