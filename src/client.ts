import { TwitterApi } from "twitter-api-v2";
import { getRefreshToken, setRefreshToken } from "./refreshTokens";

const { CLIENT_ID, CLIENT_SECRET } = process.env;

if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("CLIENT_ID, CLIENT_SECRET are required");
}

const client = new TwitterApi({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET });

export const getClient = async () => {
    const currentRefreshToken = getRefreshToken();
    if (!currentRefreshToken) {
        throw new Error("No refresh token found");
    }
    const { client: refreshedClient, refreshToken } = await client.refreshOAuth2Token(currentRefreshToken);
    setRefreshToken(refreshToken);
    return refreshedClient;
};
