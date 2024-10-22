// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config();

import { Logger } from "./logger";
import { getRandomQuote } from "./db/randomQuote";
import { getClient } from "./client";

import type { TwitterApi } from "twitter-api-v2";

const postTweet = async (twitterClient: TwitterApi, message: string) => {
    try {
        Logger.log("message to be tweeted: ", message);
        const tweet = await twitterClient.v2.tweet({ text: message });
        Logger.log("Tweet posted successfully:", tweet.data.id);
    }
    catch (err) {
        Logger.error("Error posting tweet:", err);
    }
};


const main = async () => {
    const client = await getClient();
    const message = await getRandomQuote();
    await postTweet(client, message);
};

main().catch(Logger.error);
