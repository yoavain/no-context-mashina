// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config();

import { REFRESH_TOKEN_DOCKER_LOCATION, SOURCE_TOKENS_CACHE_FILE } from "../refreshTokenConsts";
import { spawnSync } from "node:child_process";
import { Logger } from "../logger";


const copyRefreshTokenCacheIntoContainer = () => {
    const docker = spawnSync("docker", ["container", "ls", "--filter", "name=no-context-mashina", "--format", "json"], { encoding : "utf8" });
    if (docker.error) {
        throw new Error(`Error executing docker command: ${docker.error}`);
    }
    const out = JSON.parse(docker.stdout);
    const containerId = out.ID;
    Logger.log(`Copying refresh token cache into container with ID ${containerId} from ${SOURCE_TOKENS_CACHE_FILE} to ${REFRESH_TOKEN_DOCKER_LOCATION}`);

    const copy = spawnSync("docker", ["cp", "-a", SOURCE_TOKENS_CACHE_FILE, `${containerId}:${REFRESH_TOKEN_DOCKER_LOCATION}`], { encoding : "utf8" });
    if (copy.error) {
        throw new Error(`Error executing copy command: ${copy.error}`);
    }
    Logger.log(copy.stdout);
    Logger.log("Refresh token cache copied successfully");
};

copyRefreshTokenCacheIntoContainer();
