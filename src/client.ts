import { TwitterApi } from "twitter-api-v2";
import { getRefreshToken, setRefreshToken } from "./refreshTokens";

const { CLIENT_ID, CLIENT_SECRET } = process.env;

const client = new TwitterApi({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET });

export const getClient = async () => {
    const { client: refreshedClient, refreshToken } = await client.refreshOAuth2Token(getRefreshToken());
    setRefreshToken(refreshToken);
    return refreshedClient;
};
