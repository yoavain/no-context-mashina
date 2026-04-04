import { setEncryptionEnv, clearEncryptionEnv } from "../fixtures/encryptionEnv";
import { SAMPLE_QUOTES } from "../fixtures/sampleQuotes";

describe("Tweet pipeline — end to end (mocked Twitter API)", () => {
    let mockV2Tweet: jest.Mock;
    let encryptedQuotesFixture: string;
    let encryptedTokenFixture: string;

    beforeAll(() => {
        setEncryptionEnv();
        jest.resetModules();
        const { encryptData } = require("../../src/db/encryption");
        encryptedQuotesFixture = encryptData(JSON.stringify(SAMPLE_QUOTES));
        encryptedTokenFixture = encryptData("test-refresh-token");
        jest.resetModules();
    });

    afterAll(() => {
        clearEncryptionEnv();
    });

    beforeEach(() => {
        jest.resetModules();
        process.env.CLIENT_ID = "test-client-id";
        process.env.CLIENT_SECRET = "test-client-secret";

        mockV2Tweet = jest.fn();

        jest.doMock("node-persist", () => ({
            default: {
                initSync: jest.fn(),
                getItem: jest.fn().mockResolvedValue(encryptedTokenFixture),
                setItem: jest.fn().mockResolvedValue(undefined)
            },
            __esModule: true
        }));

        jest.doMock("node:fs/promises", () => ({
            readFile: jest.fn().mockResolvedValue(encryptedQuotesFixture)
        }));
    });

    afterEach(() => {
        delete process.env.CLIENT_ID;
        delete process.env.CLIENT_SECRET;
    });

    const loadAndWaitForTweet = (): Promise<string> => {
        return new Promise((resolve, reject) => {
            mockV2Tweet.mockImplementation(({ text }: { text: string }) => {
                resolve(text);
                return Promise.resolve({ data: { id: "tweet-123" } });
            });

            const mockRefreshedClient = { v2: { tweet: mockV2Tweet } };

            jest.doMock("twitter-api-v2", () => ({
                TwitterApi: jest.fn().mockImplementation(() => ({
                    refreshOAuth2Token: jest.fn().mockResolvedValue({
                        client: mockRefreshedClient,
                        refreshToken: "new-refresh-token"
                    })
                }))
            }));

            try {
                require("../../src/tweet");
            }
            catch (err) {
                reject(err);
            }

            setTimeout(() => reject(new Error("timeout: tweet was not called")), 3000);
        });
    };

    it("calls v2.tweet with a non-empty string from the quotes database", async () => {
        const tweetedText = await loadAndWaitForTweet();
        expect(typeof tweetedText).toBe("string");
        expect(tweetedText.length).toBeGreaterThan(0);
    });

    it("the tweeted string is one of the known quotes in the fixture database", async () => {
        const tweetedText = await loadAndWaitForTweet();
        expect(SAMPLE_QUOTES).toContain(tweetedText);
    });

    it("logs the tweet ID on success", async () => {
        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        await loadAndWaitForTweet();
        // Wait a tick for the Logger.log after tweet
        await new Promise((r) => setImmediate(r));
        const messages = consoleSpy.mock.calls.map((c) => c.slice(1).join(" "));
        expect(messages.some((m) => m.includes("tweet-123"))).toBe(true);
    });

    it("logs error but does not rethrow when v2.tweet rejects", async () => {
        const mockRejectedV2Tweet = jest.fn().mockRejectedValue(new Error("rate limited"));
        const mockRefreshedClient = { v2: { tweet: mockRejectedV2Tweet } };

        jest.doMock("twitter-api-v2", () => ({
            TwitterApi: jest.fn().mockImplementation(() => ({
                refreshOAuth2Token: jest.fn().mockResolvedValue({
                    client: mockRefreshedClient,
                    refreshToken: "new-token"
                })
            }))
        }));

        let consoleErrorResolve: () => void;
        const errorLogged = new Promise<void>((r) => {
            consoleErrorResolve = r; 
        });
        jest.spyOn(console, "error").mockImplementation(() => {
            consoleErrorResolve(); 
        });

        require("../../src/tweet");
        await errorLogged;

        expect(console.error).toHaveBeenCalledWith(
            expect.any(String),
            "Error posting tweet:",
            expect.any(Error)
        );
    });
});
