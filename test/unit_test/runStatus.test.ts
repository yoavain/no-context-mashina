import { isStale } from "../../src/runStatus";

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

    describe("writeRunStatus / readRunStatus", () => {
        const STATUS_PATH_MATCHER = expect.stringContaining("last-run.json");

        beforeEach(() => {
            jest.resetModules();
        });

        it("writes an ok status with a timestamp and detail", async () => {
            const writeFile = jest.fn().mockResolvedValue(undefined);
            jest.doMock("node:fs/promises", () => ({ writeFile, readFile: jest.fn() }));

            const { writeRunStatus } = require("../../src/runStatus");
            await writeRunStatus("ok", "posted 42");

            expect(writeFile).toHaveBeenCalledWith(STATUS_PATH_MATCHER, expect.any(String), { encoding: "utf8" });
            const written = JSON.parse(writeFile.mock.calls[0][1]);
            expect(written.status).toBe("ok");
            expect(written.detail).toBe("posted 42");
            expect(typeof written.timestamp).toBe("number");
        });

        it("swallows a write failure so it never breaks the run", async () => {
            const writeFile = jest.fn().mockRejectedValue(new Error("disk full"));
            jest.doMock("node:fs/promises", () => ({ writeFile, readFile: jest.fn() }));
            jest.spyOn(console, "error").mockImplementation(() => {});

            const { writeRunStatus } = require("../../src/runStatus");
            await expect(writeRunStatus("fail", "boom")).resolves.toBeUndefined();
        });

        it("reads back a persisted status", async () => {
            const stored = { status: "fail", timestamp: 123, detail: "code 402" };
            jest.doMock("node:fs/promises", () => ({
                writeFile: jest.fn(),
                readFile: jest.fn().mockResolvedValue(JSON.stringify(stored))
            }));

            const { readRunStatus } = require("../../src/runStatus");
            await expect(readRunStatus()).resolves.toEqual(stored);
        });
    });
});
