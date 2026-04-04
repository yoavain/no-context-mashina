import { readFile } from "node:fs/promises";
import { decryptData } from "../../src/db/encryption";
import { ENCRYPTED_QUOTES_FILE } from "../../src/db/consts";
import { SAMPLE_QUOTES } from "../fixtures/sampleQuotes";

jest.mock("node:fs/promises");
jest.mock("../../src/db/encryption");

const mockReadFile = jest.mocked(readFile);
const mockDecryptData = jest.mocked(decryptData);

// Import after mocks so encryption.ts is never loaded (avoids env var check)
import { getRandomQuote } from "../../src/db/randomQuote";

describe("getRandomQuote", () => {
    beforeEach(() => {
        mockReadFile.mockResolvedValue(Buffer.from("encrypted-content") as any);
        mockDecryptData.mockReturnValue(JSON.stringify(SAMPLE_QUOTES));
    });

    it("reads from the ENCRYPTED_QUOTES_FILE path", async () => {
        await getRandomQuote();
        expect(mockReadFile).toHaveBeenCalledWith(ENCRYPTED_QUOTES_FILE, { encoding: "utf8" });
    });

    it("calls decryptData with the file contents", async () => {
        mockReadFile.mockResolvedValue("raw-encrypted" as any);
        await getRandomQuote();
        expect(mockDecryptData).toHaveBeenCalledWith("raw-encrypted");
    });

    it("returns the first quote when Math.random returns 0", async () => {
        jest.spyOn(Math, "random").mockReturnValue(0);
        const result = await getRandomQuote();
        expect(result).toBe(SAMPLE_QUOTES[0]);
    });

    it("returns the last quote when Math.random returns just below 1", async () => {
        jest.spyOn(Math, "random").mockReturnValue(0.999);
        const result = await getRandomQuote();
        expect(result).toBe(SAMPLE_QUOTES[SAMPLE_QUOTES.length - 1]);
    });

    it("returns the middle quote from a 3-element array when Math.random = 0.5", async () => {
        jest.spyOn(Math, "random").mockReturnValue(0.5);
        const result = await getRandomQuote();
        expect(result).toBe(SAMPLE_QUOTES[1]);
    });

    it("returns a quote from the array for any Math.random value", async () => {
        jest.spyOn(Math, "random").mockReturnValue(0.33);
        const result = await getRandomQuote();
        expect(SAMPLE_QUOTES).toContain(result);
    });

    it("propagates readFile rejection", async () => {
        mockReadFile.mockRejectedValue(new Error("file not found"));
        await expect(getRandomQuote()).rejects.toThrow("file not found");
    });

    it("throws if decryptData returns invalid JSON", async () => {
        mockDecryptData.mockReturnValue("not-valid-json{{{");
        await expect(getRandomQuote()).rejects.toThrow();
    });
});
