describe("client.ts — module load guard", () => {
    beforeEach(() => {
        jest.resetModules();
        jest.doMock("twitter-api-v2", () => ({
            TwitterApi: jest.fn().mockImplementation(() => ({ refreshOAuth2Token: jest.fn() }))
        }));
        jest.doMock("../../src/refreshTokens", () => ({
            getRefreshToken: jest.fn(),
            setRefreshToken: jest.fn().mockResolvedValue(undefined)
        }));
    });

    afterEach(() => {
        delete process.env.CLIENT_ID;
        delete process.env.CLIENT_SECRET;
    });

    it("throws when CLIENT_ID is missing", () => {
        delete process.env.CLIENT_ID;
        process.env.CLIENT_SECRET = "secret";
        expect(() => require("../../src/client")).toThrow("CLIENT_ID, CLIENT_SECRET are required");
    });

    it("throws when CLIENT_SECRET is missing", () => {
        process.env.CLIENT_ID = "id";
        delete process.env.CLIENT_SECRET;
        expect(() => require("../../src/client")).toThrow("CLIENT_ID, CLIENT_SECRET are required");
    });

    it("does not throw when both CLIENT_ID and CLIENT_SECRET are set", () => {
        process.env.CLIENT_ID = "id";
        process.env.CLIENT_SECRET = "secret";
        expect(() => require("../../src/client")).not.toThrow();
    });
});

describe("client.ts — getClient", () => {
    let getClient: () => Promise<unknown>;
    let mockRefreshOAuth2Token: jest.Mock;
    let mockGetRefreshToken: jest.Mock;
    let mockSetRefreshToken: jest.Mock;

    beforeEach(() => {
        jest.resetModules();
        process.env.CLIENT_ID = "test-client-id";
        process.env.CLIENT_SECRET = "test-client-secret";

        mockRefreshOAuth2Token = jest.fn();
        mockGetRefreshToken = jest.fn();
        mockSetRefreshToken = jest.fn().mockResolvedValue(undefined);

        jest.doMock("twitter-api-v2", () => ({
            TwitterApi: jest.fn().mockImplementation(() => ({
                refreshOAuth2Token: mockRefreshOAuth2Token
            }))
        }));

        jest.doMock("../../src/refreshTokens", () => ({
            getRefreshToken: mockGetRefreshToken,
            setRefreshToken: mockSetRefreshToken
        }));

        getClient = require("../../src/client").getClient;
    });

    afterEach(() => {
        delete process.env.CLIENT_ID;
        delete process.env.CLIENT_SECRET;
    });

    it("calls getRefreshToken to retrieve the current token", async () => {
        mockGetRefreshToken.mockResolvedValue(null);
        await expect(getClient()).rejects.toThrow();
        expect(mockGetRefreshToken).toHaveBeenCalled();
    });

    it("throws 'No refresh token found' when getRefreshToken returns falsy", async () => {
        mockGetRefreshToken.mockResolvedValue(null);
        await expect(getClient()).rejects.toThrow("No refresh token found");
    });

    it("calls refreshOAuth2Token with the current refresh token", async () => {
        mockGetRefreshToken.mockResolvedValue("current-token");
        mockRefreshOAuth2Token.mockResolvedValue({ client: {}, refreshToken: "new-token" });
        await getClient();
        expect(mockRefreshOAuth2Token).toHaveBeenCalledWith("current-token");
    });

    it("calls setRefreshToken with the new refreshToken from the API response", async () => {
        mockGetRefreshToken.mockResolvedValue("current-token");
        mockRefreshOAuth2Token.mockResolvedValue({ client: {}, refreshToken: "new-token" });
        await getClient();
        expect(mockSetRefreshToken).toHaveBeenCalledWith("new-token");
    });

    it("returns the refreshed client from the API response", async () => {
        const mockRefreshedClient = { v2: { tweet: jest.fn() } };
        mockGetRefreshToken.mockResolvedValue("current-token");
        mockRefreshOAuth2Token.mockResolvedValue({ client: mockRefreshedClient, refreshToken: "new-token" });
        const result = await getClient();
        expect(result).toBe(mockRefreshedClient);
    });

    it("propagates rejection if refreshOAuth2Token rejects", async () => {
        mockGetRefreshToken.mockResolvedValue("current-token");
        mockRefreshOAuth2Token.mockRejectedValue(new Error("token expired"));
        await expect(getClient()).rejects.toThrow("token expired");
    });
});
