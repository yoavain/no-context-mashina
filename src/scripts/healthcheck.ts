import { Logger } from "../logger";
import { isStale, readRunStatus, resolveMaxAgeHours, RUN_STATUS_FILE } from "../runStatus";

const PUSH_TIMEOUT_MS = 10000;
const MAX_MSG_LENGTH = 200;

const maxAgeHours = resolveMaxAgeHours(process.env.HEALTHCHECK_MAX_AGE_HOURS);

const pushStatus = async (status: "up" | "down", msg: string) => {
    const { HEALTHCHECK_URL } = process.env;
    if (!HEALTHCHECK_URL) {
        return;
    }
    const url = new URL(HEALTHCHECK_URL);
    url.searchParams.set("status", status);
    url.searchParams.set("msg", msg.slice(0, MAX_MSG_LENGTH));
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(PUSH_TIMEOUT_MS) });
        if (!response.ok) {
            Logger.error("Healthcheck push returned status:", response.status);
        }
    }
    catch (err) {
        Logger.error("Healthcheck push failed:", err);
    }
};

const evaluate = async (): Promise<{ healthy: boolean; msg: string }> => {
    let runStatus;
    try {
        runStatus = await readRunStatus();
    }
    catch {
        return { healthy: false, msg: `no readable run status at ${RUN_STATUS_FILE}` };
    }
    if (runStatus.status !== "ok") {
        return { healthy: false, msg: `last run failed: ${runStatus.detail}` };
    }
    if (isStale(runStatus.timestamp, maxAgeHours)) {
        return { healthy: false, msg: `last run older than ${maxAgeHours}h - cron may be dead` };
    }
    return { healthy: true, msg: `last run OK at ${new Date(runStatus.timestamp).toISOString()}` };
};

const main = async () => {
    const { healthy, msg } = await evaluate();
    if (healthy) {
        Logger.log("Healthcheck:", msg);
    }
    else {
        Logger.error("Healthcheck:", msg);
        process.exitCode = 1;
    }
    if (process.argv.includes("--push")) {
        await pushStatus(healthy ? "up" : "down", msg);
    }
};

main().catch((err) => {
    Logger.error("Healthcheck crashed:", err);
    process.exitCode = 1;
});
