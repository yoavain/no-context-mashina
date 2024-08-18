// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config();

import { getRandomQuote } from "./db/randomQuote";
import { getClient } from "./client";

// eslint-disable-next-line @typescript-eslint/no-require-imports
import type { TwitterApi } from "twitter-api-v2";

const postTweet = async (twitterClient: TwitterApi, message: string) => {
    try {
        console.log("message to be tweeted: ", message);
        const tweet = await twitterClient.v2.tweet({ text: message });
        console.log("Tweet posted successfully:", tweet.data.id);
    }
    catch (err) {
        console.error("Error posting tweet:", err);
    }
};


const main = async () => {
    const client = await getClient();
    const message = await getRandomQuote();
    await postTweet(client, message);
};

main().catch(console.error);
