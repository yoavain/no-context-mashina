import { DEFAULT_MAX_AGE_HOURS, isStale, resolveMaxAgeHours } from "../../src/runStatus";

describe("runStatus", () => {
    describe("isStale", () => {
        const now = 1_000_000_000_000;
        const hour = 60 * 60 * 1000;

        it("returns false for a timestamp inside the window", () => {
            expect(isStale(now - 8 * hour, 9, now)).toBe(false);
        });

        it("returns true for a timestamp older than the window", () => {
            expect(isStale(now - 10 * hour, 9, now)).toBe(true);
        });

        it("returns false exactly at the boundary", () => {
            expect(isStale(now - 9 * hour, 9, now)).toBe(false);
        });

        it("honours a custom window", () => {
            expect(isStale(now - 2 * hour, 1, now)).toBe(true);
            expect(isStale(now - 2 * hour, 3, now)).toBe(false);
        });
    });

    describe("resolveMaxAgeHours", () => {
        beforeEach(() => {
            jest.spyOn(console, "error").mockImplementation(() => {});
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("returns the default when the value is missing or empty", () => {
            expect(resolveMaxAgeHours(undefined)).toBe(DEFAULT_MAX_AGE_HOURS);
            expect(resolveMaxAgeHours("")).toBe(DEFAULT_MAX_AGE_HOURS);
        });

        it("returns the default for a value that is not a positive number", () => {
            expect(resolveMaxAgeHours("-1")).toBe(DEFAULT_MAX_AGE_HOURS);
            expect(resolveMaxAgeHours("0")).toBe(DEFAULT_MAX_AGE_HOURS);
            expect(resolveMaxAgeHours("abc")).toBe(DEFAULT_MAX_AGE_HOURS);
            expect(resolveMaxAgeHours("Infinity")).toBe(DEFAULT_MAX_AGE_HOURS);
        });

        it("returns the parsed value for a positive number", () => {
            expect(resolveMaxAgeHours("3")).toBe(3);
            expect(resolveMaxAgeHours("0.5")).toBe(0.5);
        });
    });

    describe("writeRunStatus / readRunStatus", () => {
        const TEMP_PATH_MATCHER = expect.stringContaining("last-run.json.tmp");
        const STATUS_PATH_MATCHER = expect.stringMatching(/last-run\.json$/);

        beforeEach(() => {
            jest.resetModules();
        });

        it("writes an ok status with a timestamp and detail", async () => {
            const writeFile = jest.fn().mockResolvedValue(undefined);
            const rename = jest.fn().mockResolvedValue(undefined);
            jest.doMock("node:fs/promises", () => ({ writeFile, rename, readFile: jest.fn() }));

            const { writeRunStatus } = require("../../src/runStatus");
            await writeRunStatus("ok", "posted 42");

            expect(writeFile).toHaveBeenCalledWith(TEMP_PATH_MATCHER, expect.any(String), { encoding: "utf8" });
            const written = JSON.parse(writeFile.mock.calls[0][1]);
            expect(written.status).toBe("ok");
            expect(written.detail).toBe("posted 42");
            expect(typeof written.timestamp).toBe("number");
        });

        it("renames the temp file over the status file so readers never see a partial write", async () => {
            const writeFile = jest.fn().mockResolvedValue(undefined);
            const rename = jest.fn().mockResolvedValue(undefined);
            jest.doMock("node:fs/promises", () => ({ writeFile, rename, readFile: jest.fn() }));

            const { writeRunStatus } = require("../../src/runStatus");
            await writeRunStatus("ok", "posted 42");

            expect(rename).toHaveBeenCalledWith(TEMP_PATH_MATCHER, STATUS_PATH_MATCHER);
            expect(writeFile.mock.invocationCallOrder[0]).toBeLessThan(rename.mock.invocationCallOrder[0]);
        });

        it("swallows a write failure so it never breaks the run", async () => {
            const writeFile = jest.fn().mockRejectedValue(new Error("disk full"));
            const rename = jest.fn().mockResolvedValue(undefined);
            jest.doMock("node:fs/promises", () => ({ writeFile, rename, readFile: jest.fn() }));
            jest.spyOn(console, "error").mockImplementation(() => {});

            const { writeRunStatus } = require("../../src/runStatus");
            await expect(writeRunStatus("fail", "boom")).resolves.toBeUndefined();
            expect(rename).not.toHaveBeenCalled();
        });

        it("swallows a rename failure so it never breaks the run", async () => {
            const writeFile = jest.fn().mockResolvedValue(undefined);
            const rename = jest.fn().mockRejectedValue(new Error("cross-device link"));
            jest.doMock("node:fs/promises", () => ({ writeFile, rename, readFile: jest.fn() }));
            jest.spyOn(console, "error").mockImplementation(() => {});

            const { writeRunStatus } = require("../../src/runStatus");
            await expect(writeRunStatus("ok", "posted 42")).resolves.toBeUndefined();
        });

        it("reads back a persisted status", async () => {
            const stored = { status: "fail", timestamp: 123, detail: "code 402" };
            jest.doMock("node:fs/promises", () => ({
                writeFile: jest.fn(),
                rename: jest.fn(),
                readFile: jest.fn().mockResolvedValue(JSON.stringify(stored))
            }));

            const { readRunStatus } = require("../../src/runStatus");
            await expect(readRunStatus()).resolves.toEqual(stored);
        });
    });
});
