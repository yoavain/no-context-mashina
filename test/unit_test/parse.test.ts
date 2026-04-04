import path from "node:path";
import { ENCRYPTED_QUOTES_FILE, QUOTES_FILE } from "../../src/db/consts";

async function* asyncFiles(...files: string[]) {
    for (const f of files) {
        yield f;
    }
}

describe("parse.ts", () => {
    let mockGlob: jest.Mock;
    let mockReadFile: jest.Mock;
    let mockWriteFile: jest.Mock;
    let mockEncryptData: jest.Mock;

    beforeEach(() => {
        jest.resetModules();
        process.env.SOURCE = "/mock/source";

        mockGlob = jest.fn().mockReturnValue(asyncFiles());
        mockReadFile = jest.fn().mockResolvedValue("");
        mockWriteFile = jest.fn().mockResolvedValue(undefined);
        mockEncryptData = jest.fn().mockReturnValue("encrypted-output");

        jest.doMock("node:fs/promises", () => ({
            glob: mockGlob,
            readFile: mockReadFile,
            writeFile: mockWriteFile
        }));

        jest.doMock("../../src/db/encryption", () => ({
            encryptData: mockEncryptData
        }));
    });

    afterEach(() => {
        delete process.env.SOURCE;
    });

    const loadAndWait = async () => {
        require("../../src/db/parse");
        await new Promise<void>((resolve) => setTimeout(resolve, 20));
    };

    it("globs .txt files under the SOURCE directory", async () => {
        await loadAndWait();
        const resolvedSource = path.resolve("/mock/source");
        const callArg: string = mockGlob.mock.calls[0][0];
        expect(callArg).toContain(resolvedSource);
        expect(callArg).toContain("**/*.txt");
    });

    it("splits content on double newlines (\\n\\n)", async () => {
        mockGlob.mockReturnValue(asyncFiles("/mock/source/file.txt"));
        mockReadFile.mockResolvedValue("First lyric\n\nSecond lyric");

        await loadAndWait();

        const callArg = mockEncryptData.mock.calls[0][0];
        const parsed = JSON.parse(callArg);
        expect(parsed).toContain("First lyric");
        expect(parsed).toContain("Second lyric");
    });

    it("splits content on Windows-style double newlines (\\r\\n\\r\\n)", async () => {
        mockGlob.mockReturnValue(asyncFiles("/mock/source/file.txt"));
        mockReadFile.mockResolvedValue("First lyric\r\n\r\nSecond lyric");

        await loadAndWait();

        const callArg = mockEncryptData.mock.calls[0][0];
        const parsed = JSON.parse(callArg);
        expect(parsed).toContain("First lyric");
        expect(parsed).toContain("Second lyric");
    });

    it("filters empty strings from split results", async () => {
        mockGlob.mockReturnValue(asyncFiles("/mock/source/file.txt"));
        mockReadFile.mockResolvedValue("\n\nFirst lyric\n\n\n\nSecond lyric\n\n");

        await loadAndWait();

        const callArg = mockEncryptData.mock.calls[0][0];
        const parsed = JSON.parse(callArg);
        expect(parsed.every((q: string) => q.length > 0)).toBe(true);
    });

    it("logs an error when a quote exceeds 140 characters", async () => {
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        const longQuote = "a".repeat(141);
        mockGlob.mockReturnValue(asyncFiles("/mock/source/file.txt"));
        mockReadFile.mockResolvedValue(longQuote);

        await loadAndWait();

        expect(consoleSpy).toHaveBeenCalled();
    });

    it("deduplicates identical quotes across files", async () => {
        mockGlob.mockReturnValue(asyncFiles("/mock/source/file1.txt", "/mock/source/file2.txt"));
        mockReadFile.mockResolvedValue("Duplicate lyric");

        await loadAndWait();

        const callArg = mockEncryptData.mock.calls[0][0];
        const parsed = JSON.parse(callArg);
        expect(parsed).toHaveLength(1);
        expect(parsed[0]).toBe("Duplicate lyric");
    });

    it("writes plaintext JSON to QUOTES_FILE", async () => {
        mockGlob.mockReturnValue(asyncFiles("/mock/source/file.txt"));
        mockReadFile.mockResolvedValue("A quote");

        await loadAndWait();

        expect(mockWriteFile).toHaveBeenCalledWith(
            QUOTES_FILE,
            expect.stringContaining("A quote"),
            { encoding: "utf8" }
        );
    });

    it("writes encrypted content to ENCRYPTED_QUOTES_FILE", async () => {
        mockGlob.mockReturnValue(asyncFiles("/mock/source/file.txt"));
        mockReadFile.mockResolvedValue("A quote");
        mockEncryptData.mockReturnValue("the-ciphertext");

        await loadAndWait();

        expect(mockWriteFile).toHaveBeenCalledWith(
            ENCRYPTED_QUOTES_FILE,
            "the-ciphertext",
            { encoding: "utf8" }
        );
    });

    it("calls encryptData with the JSON quotes array", async () => {
        mockGlob.mockReturnValue(asyncFiles("/mock/source/file.txt"));
        mockReadFile.mockResolvedValue("Lyric one\n\nLyric two");

        await loadAndWait();

        expect(mockEncryptData).toHaveBeenCalledTimes(1);
        const callArg = mockEncryptData.mock.calls[0][0];
        const parsed = JSON.parse(callArg);
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed).toContain("Lyric one");
        expect(parsed).toContain("Lyric two");
    });

    it("logs the count of unique quotes found", async () => {
        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        mockGlob.mockReturnValue(asyncFiles("/mock/source/file.txt"));
        mockReadFile.mockResolvedValue("First\n\nSecond");

        await loadAndWait();

        const messages = consoleSpy.mock.calls.map((c) => c.slice(1).join(" "));
        expect(messages.some((m) => m.includes("2") && m.includes("unique quotes"))).toBe(true);
    });
});
