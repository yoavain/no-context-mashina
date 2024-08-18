// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config();

import { spawnSync } from "node:child_process";

const { TOKENS_CACHE_FILE } = process.env;

const copyRefreshTokenCacheIntoContainer = () => {
    const docker = spawnSync("docker", ["container", "ls", "--filter", "name=no-context-mashina", "--format", "json"], { encoding : "utf8" });
    if (docker.error) {
        throw new Error(`Error executing docker command: ${docker.error}`);
    }
    const out = JSON.parse(docker.stdout);
    const containerId = out.ID;
    const location = "/usr/app/ext/cache/refresh_tokens/refresh_token.json";
    console.log(`Copying refresh token cache into container with ID ${containerId} from ${TOKENS_CACHE_FILE} to ${location}`);

    const copy = spawnSync("docker", ["cp", TOKENS_CACHE_FILE, `${containerId}:${location}`], { encoding : "utf8" });
    if (copy.error) {
        throw new Error(`Error executing copy command: ${copy.error}`);
    }
    console.log(copy.stdout);
    console.log("Refresh token cache copied successfully");
};

copyRefreshTokenCacheIntoContainer();
