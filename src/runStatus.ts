import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Logger } from "./logger";

const TOKENS_BASE_FOLDER = process.env.TOKENS_BASE_FOLDER || ".";

export const RUN_STATUS_FILE = join(TOKENS_BASE_FOLDER, "last-run.json");

export const DEFAULT_MAX_AGE_HOURS = 9;

export type RunStatus = {
    status: "ok" | "fail";
    timestamp: number;
    detail: string;
};

export const writeRunStatus = async (status: "ok" | "fail", detail: string) => {
    const runStatus: RunStatus = { status, timestamp: Date.now(), detail };
    try {
        await writeFile(RUN_STATUS_FILE, JSON.stringify(runStatus), { encoding: "utf8" });
    }
    catch (err) {
        Logger.error("Failed to write run status:", err);
    }
};

export const readRunStatus = async (): Promise<RunStatus> => {
    const content = await readFile(RUN_STATUS_FILE, { encoding: "utf8" });
    return JSON.parse(content);
};

export const isStale = (timestamp: number, maxAgeHours: number, now: number = Date.now()) => {
    return now - timestamp > maxAgeHours * 60 * 60 * 1000;
};
