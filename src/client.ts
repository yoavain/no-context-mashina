import { TwitterApi } from "twitter-api-v2";

const { CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN } = process.env;

const client = new TwitterApi({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET });

export const getClient = async () => {
    const { client: refreshedClient } = await client.refreshOAuth2Token(REFRESH_TOKEN);
    return refreshedClient;
};
