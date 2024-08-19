// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config();

import { Logger } from "../logger";
import { setRefreshToken } from "../refreshTokens";
import { TwitterApi } from "twitter-api-v2";
import express from "express";

const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URL } = process.env;
const SCOPE = ["tweet.read", "tweet.write", "users.read", "offline.access"];

const client = new TwitterApi({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET });
let twitCodeVerifier;
let twitState;

// Server
const PORT = 23001;

const app = express();

app.use((req, res, next) => {
    Logger.log(`request ${req.method} ${req.url}`);
    next();
});

app.get("/auth", async (req, res) => {
    const authLink = client.generateOAuth2AuthLink(
        REDIRECT_URL,
        { scope: SCOPE }
    );
    const { url: authUrl, codeVerifier, state } = authLink;
    Logger.log("authlink: ", authLink);
    twitCodeVerifier = codeVerifier;
    twitState = state;

    res.redirect(authUrl);
});

// twitter callback url for code request
app.get("/redirect", async (req, res) => {
    Logger.log("response from twitter auth request: ", { body: req.body, qparams: req.query });

    try {
        const { state, code } = req.query;
        const codeVerifier = twitCodeVerifier;
        const sessionState = twitState;

        if (!codeVerifier || !state || !sessionState || !code) {
            return res.status(400).send("App denied or session expired");
        }
        if (state !== sessionState) {
            return res.status(400).send("Stored tokens did not match");
        }

        const { accessToken, refreshToken, expiresIn } = await client.loginWithOAuth2({
            code,
            codeVerifier,
            redirectUri: REDIRECT_URL
        });

        // Save for persistence
        setRefreshToken(refreshToken);

        const message = JSON.stringify({ accessToken, refreshToken, expiresIn }, null, 2);
        Logger.log(message);
        res.send(message);
    }
    catch (err) {
        Logger.log(err.message);
        res.status(400).send("Invalid verifier or access tokens!" + err.message);
    }
});


app.listen(PORT, () => {
    Logger.log(`Server running at ${PORT}`);
});
