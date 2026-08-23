import { readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Logger } from "./logger";

const TOKENS_BASE_FOLDER = process.env.TOKENS_BASE_FOLDER || ".";

export const RUN_STATUS_FILE = join(TOKENS_BASE_FOLDER, "last-run.json");

const RUN_STATUS_TEMP_FILE = `${RUN_STATUS_FILE}.tmp`;

export const DEFAULT_MAX_AGE_HOURS = 9;

export type RunStatus = {
    status: "ok" | "fail";
    timestamp: number;
    detail: string;
};

export const writeRunStatus = async (status: "ok" | "fail", detail: string) => {
    const runStatus: RunStatus = { status, timestamp: Date.now(), detail };
    try {
        // Write to a temp file in the same folder, then rename. The rename is atomic,
        // so a concurrent healthcheck never reads a half-written file.
        await writeFile(RUN_STATUS_TEMP_FILE, JSON.stringify(runStatus), { encoding: "utf8" });
        await rename(RUN_STATUS_TEMP_FILE, RUN_STATUS_FILE);
    }
    catch (err) {
        Logger.error("Failed to write run status:", err);
    }
};

export const readRunStatus = async (): Promise<RunStatus> => {
    const content = await readFile(RUN_STATUS_FILE, { encoding: "utf8" });
    return JSON.parse(content);
};

export const resolveMaxAgeHours = (rawValue?: string): number => {
    if (!rawValue) {
        return DEFAULT_MAX_AGE_HOURS;
    }
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        Logger.error(`Invalid HEALTHCHECK_MAX_AGE_HOURS "${rawValue}" - falling back to ${DEFAULT_MAX_AGE_HOURS}h`);
        return DEFAULT_MAX_AGE_HOURS;
    }
    return parsed;
};

export const isStale = (timestamp: number, maxAgeHours: number, now: number = Date.now()) => {
    return now - timestamp > maxAgeHours * 60 * 60 * 1000;
};
