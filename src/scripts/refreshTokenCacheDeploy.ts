// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config();

import { REFRESH_TOKEN_DOCKER_LOCATION, SOURCE_TOKENS_CACHE_FILE } from "../refreshTokenConsts";
import { spawnSync } from "node:child_process";
import { Logger } from "../logger";


const copyRefreshTokenCacheIntoContainer = () => {
    const docker = spawnSync("docker", ["container", "ls", "--filter", "name=no-context-mashina", "--format", "{{.ID}}"], { encoding : "utf8" });
    if (docker.error) {
        throw new Error(`Error executing docker command: ${docker.error}`);
    }
    if (docker.status !== 0) {
        throw new Error(`docker container ls failed with status ${docker.status}: ${docker.stderr}`);
    }
    const lines = docker.stdout.trim().split("\n").filter(Boolean);
    if (lines.length === 0) {
        throw new Error("No running container found with name 'no-context-mashina'");
    }
    if (lines.length > 1) {
        throw new Error(`Expected exactly one container, found ${lines.length}: ${lines.join(", ")}`);
    }
    const containerId = lines[0];
    Logger.log(`Copying refresh token cache into container with ID ${containerId} from ${SOURCE_TOKENS_CACHE_FILE} to ${REFRESH_TOKEN_DOCKER_LOCATION}`);

    const copy = spawnSync("docker", ["cp", "-a", SOURCE_TOKENS_CACHE_FILE, `${containerId}:${REFRESH_TOKEN_DOCKER_LOCATION}`], { encoding : "utf8" });
    if (copy.error) {
        throw new Error(`Error executing copy command: ${copy.error}`);
    }
    if (copy.status !== 0) {
        throw new Error(`docker cp failed with status ${copy.status}: ${copy.stderr}`);
    }
    Logger.log(copy.stdout);
    Logger.log("Refresh token cache copied successfully");
};

copyRefreshTokenCacheIntoContainer();
