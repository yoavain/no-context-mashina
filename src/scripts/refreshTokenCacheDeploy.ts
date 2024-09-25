// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config();

import { REFRESH_TOKEN_DOCKER_LOCATION, REFRESH_TOKEN_KEY_SHA256 } from "../refreshTokenConsts";
import { spawnSync } from "node:child_process";
import { Logger } from "../logger";

const { TOKENS_CACHE_PATH } = process.env;
const TOKENS_CACHE_FILE = `${TOKENS_CACHE_PATH}/${REFRESH_TOKEN_KEY_SHA256}`;

const copyRefreshTokenCacheIntoContainer = () => {
    const docker = spawnSync("docker", ["container", "ls", "--filter", "name=no-context-mashina", "--format", "json"], { encoding : "utf8" });
    if (docker.error) {
        throw new Error(`Error executing docker command: ${docker.error}`);
    }
    const out = JSON.parse(docker.stdout);
    const containerId = out.ID;
    Logger.log(`Copying refresh token cache into container with ID ${containerId} from ${TOKENS_CACHE_FILE} to ${REFRESH_TOKEN_DOCKER_LOCATION}`);

    const copy = spawnSync("docker", ["cp", "-a", TOKENS_CACHE_FILE, `${containerId}:${REFRESH_TOKEN_DOCKER_LOCATION}`], { encoding : "utf8" });
    if (copy.error) {
        throw new Error(`Error executing copy command: ${copy.error}`);
    }
    Logger.log(copy.stdout);
    Logger.log("Refresh token cache copied successfully");
};

copyRefreshTokenCacheIntoContainer();
