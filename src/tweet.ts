// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config();

import { Logger } from "./logger";
import { getRandomQuote } from "./db/randomQuote";
import { getClient } from "./client";
import { writeRunStatus } from "./runStatus";

import type { TwitterApi } from "twitter-api-v2";

const postTweet = async (twitterClient: TwitterApi, message: string) => {
    Logger.log("message to be tweeted: ", message);
    const tweet = await twitterClient.v2.tweet({ text: message });
    Logger.log("Tweet posted successfully:", tweet.data.id);
    return tweet.data.id;
};

const main = async () => {
    const client = await getClient();
    const message = await getRandomQuote();
    const tweetId = await postTweet(client, message);
    await writeRunStatus("ok", `posted ${tweetId}`);
};

main().catch(async (err) => {
    Logger.error("Error posting tweet:", err);
    await writeRunStatus("fail", err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
});
