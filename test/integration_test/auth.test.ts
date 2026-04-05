import request from "supertest";

describe("auth.ts Express routes", () => {
    let app: any;
    let mockGenerateOAuth2AuthLink: jest.Mock;
    let mockLoginWithOAuth2: jest.Mock;
    let mockSetRefreshToken: jest.Mock;

    beforeAll(async () => {
        jest.resetModules();

        process.env.CLIENT_ID = "test-client-id";
        process.env.CLIENT_SECRET = "test-client-secret";
        process.env.REDIRECT_URL = "http://localhost:23001/redirect";

        mockGenerateOAuth2AuthLink = jest.fn().mockReturnValue({
            url: "https://mock.twitter.com/oauth2/authorize?state=mock-state",
            codeVerifier: "mock-code-verifier",
            state: "mock-state"
        });
        mockLoginWithOAuth2 = jest.fn().mockResolvedValue({
            accessToken: "mock-access-token",
            refreshToken: "mock-refresh-token",
            expiresIn: 7200
        });
        mockSetRefreshToken = jest.fn().mockResolvedValue(undefined);

        jest.doMock("twitter-api-v2", () => ({
            TwitterApi: jest.fn().mockImplementation(() => ({
                generateOAuth2AuthLink: mockGenerateOAuth2AuthLink,
                loginWithOAuth2: mockLoginWithOAuth2
            }))
        }));

        jest.doMock("../../src/refreshTokens", () => ({
            setRefreshToken: mockSetRefreshToken
        }));

        // Prevent node-persist initSync (loaded transitively via refreshTokens)
        jest.doMock("node-persist", () => ({
            default: { initSync: jest.fn(), getItem: jest.fn(), setItem: jest.fn() },
            __esModule: true
        }));

        // Prevent encryption env var check (loaded transitively via refreshTokens)
        jest.doMock("../../src/db/encryption", () => ({
            encryptData: jest.fn().mockReturnValue("enc"),
            decryptData: jest.fn().mockReturnValue("dec")
        }));

        // Prevent the server from actually binding to port 23001
        jest.doMock("express", () => {
            const originalExpress = jest.requireActual<typeof import("express")>("express");
            const factory = (...args: Parameters<typeof originalExpress>) => {
                const expressApp = (originalExpress as any)(...args);
                expressApp.listen = jest.fn().mockReturnValue({ close: jest.fn() });
                return expressApp;
            };
            Object.assign(factory, originalExpress);
            return factory;
        });

        app = require("../../src/scripts/auth").app;
    });

    afterAll(() => {
        delete process.env.CLIENT_ID;
        delete process.env.CLIENT_SECRET;
        delete process.env.REDIRECT_URL;
        jest.resetModules();
    });

    describe("GET /auth", () => {
        it("calls generateOAuth2AuthLink with REDIRECT_URL and expected scopes", async () => {
            await request(app).get("/auth");
            expect(mockGenerateOAuth2AuthLink).toHaveBeenCalledWith(
                "http://localhost:23001/redirect",
                { scope: expect.arrayContaining(["tweet.read", "tweet.write", "users.read", "offline.access"]) }
            );
        });

        it("redirects to the auth URL returned by generateOAuth2AuthLink", async () => {
            const res = await request(app).get("/auth");
            expect(res.status).toBe(302);
            expect(res.headers.location).toContain("mock.twitter.com");
        });
    });

    describe("GET /redirect — validation", () => {
        it("returns 400 when state query param is missing", async () => {
            const res = await request(app).get("/redirect?code=somecode");
            expect(res.status).toBe(400);
        });

        it("returns 400 when code query param is missing", async () => {
            // First call /auth to populate the session state
            await request(app).get("/auth");
            const res = await request(app).get("/redirect?state=mock-state");
            expect(res.status).toBe(400);
        });

        it("returns 400 when state does not match the stored session state", async () => {
            await request(app).get("/auth");
            const res = await request(app).get("/redirect?state=wrong-state&code=somecode");
            expect(res.status).toBe(400);
            expect(res.text).toContain("Stored tokens did not match");
        });
    });

    describe("GET /redirect — happy path", () => {
        beforeEach(async () => {
            // Prime the module-level state via /auth
            mockGenerateOAuth2AuthLink.mockReturnValue({
                url: "https://mock.twitter.com/auth",
                codeVerifier: "test-verifier",
                state: "test-state"
            });
            await request(app).get("/auth");
        });

        it("calls loginWithOAuth2 with code, codeVerifier, and redirectUri", async () => {
            await request(app).get("/redirect?state=test-state&code=auth-code-123");
            expect(mockLoginWithOAuth2).toHaveBeenCalledWith({
                code: "auth-code-123",
                codeVerifier: "test-verifier",
                redirectUri: "http://localhost:23001/redirect"
            });
        });

        it("calls setRefreshToken with the refresh token from loginWithOAuth2", async () => {
            await request(app).get("/redirect?state=test-state&code=auth-code-123");
            expect(mockSetRefreshToken).toHaveBeenCalledWith("mock-refresh-token");
        });

        it("responds with JSON containing accessToken, refreshToken, and expiresIn", async () => {
            const res = await request(app).get("/redirect?state=test-state&code=auth-code-123");
            expect(res.status).toBe(200);
            const body = JSON.parse(res.text);
            expect(body.accessToken).toBe("mock-access-token");
            expect(body.refreshToken).toBe("mock-refresh-token");
            expect(body.expiresIn).toBe(7200);
        });
    });

    describe("GET /redirect — error handling", () => {
        beforeEach(async () => {
            mockGenerateOAuth2AuthLink.mockReturnValue({
                url: "https://mock.twitter.com/auth",
                codeVerifier: "err-verifier",
                state: "err-state"
            });
            await request(app).get("/auth");
        });

        it("returns 400 with error message when loginWithOAuth2 rejects", async () => {
            mockLoginWithOAuth2.mockRejectedValueOnce(new Error("invalid verifier"));
            const res = await request(app).get("/redirect?state=err-state&code=bad-code");
            expect(res.status).toBe(400);
            expect(res.text).toContain("invalid verifier");
        });
    });
});
