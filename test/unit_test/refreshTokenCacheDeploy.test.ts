import { SOURCE_TOKENS_CACHE_FILE, REFRESH_TOKEN_DOCKER_LOCATION } from "../../src/refreshTokenConsts";

describe("refreshTokenCacheDeploy.ts", () => {
    let mockSpawnSync: jest.Mock;

    beforeEach(() => {
        jest.resetModules();
        mockSpawnSync = jest.fn();

        jest.doMock("node:child_process", () => ({
            spawnSync: mockSpawnSync
        }));
    });

    const loadModule = () => require("../../src/scripts/refreshTokenCacheDeploy");

    it("calls spawnSync for docker container ls with the correct filter arguments", () => {
        mockSpawnSync
            .mockReturnValueOnce({ stdout: "abc123\n", status: 0, error: undefined })
            .mockReturnValueOnce({ stdout: "copied", status: 0, error: undefined });

        loadModule();

        expect(mockSpawnSync).toHaveBeenCalledWith(
            "docker",
            ["container", "ls", "--filter", "name=no-context-mashina", "--format", "{{.ID}}"],
            { encoding: "utf8" }
        );
    });

    it("calls spawnSync for docker cp with the container ID from the ls output", () => {
        mockSpawnSync
            .mockReturnValueOnce({ stdout: "container456\n", status: 0, error: undefined })
            .mockReturnValueOnce({ stdout: "copied", status: 0, error: undefined });

        loadModule();

        expect(mockSpawnSync).toHaveBeenCalledWith(
            "docker",
            ["cp", "-a", SOURCE_TOKENS_CACHE_FILE, `container456:${REFRESH_TOKEN_DOCKER_LOCATION}`],
            { encoding: "utf8" }
        );
    });

    it("trims whitespace from the container ID returned by docker ls", () => {
        mockSpawnSync
            .mockReturnValueOnce({ stdout: "  trimme123  \n", status: 0, error: undefined })
            .mockReturnValueOnce({ stdout: "", status: 0, error: undefined });

        loadModule();

        const cpCall = mockSpawnSync.mock.calls[1];
        expect(cpCall[1][3]).toContain("trimme123:");
    });

    it("throws when the docker ls command returns an error", () => {
        mockSpawnSync.mockReturnValueOnce({ stdout: "", status: null, error: new Error("docker not found") });

        expect(() => loadModule()).toThrow("Error executing docker command");
    });

    it("throws when the docker ls command exits with a non-zero status", () => {
        mockSpawnSync.mockReturnValueOnce({ stdout: "", stderr: "daemon not running", status: 1, error: undefined });

        expect(() => loadModule()).toThrow("docker container ls failed with status 1");
    });

    it("throws when no container is found", () => {
        mockSpawnSync.mockReturnValueOnce({ stdout: "\n", status: 0, error: undefined });

        expect(() => loadModule()).toThrow("No running container found");
    });

    it("throws when multiple containers are found", () => {
        mockSpawnSync.mockReturnValueOnce({ stdout: "cid1\ncid2\n", status: 0, error: undefined });

        expect(() => loadModule()).toThrow("Expected exactly one container, found 2");
    });

    it("throws when the docker cp command returns an error", () => {
        mockSpawnSync
            .mockReturnValueOnce({ stdout: "cid\n", status: 0, error: undefined })
            .mockReturnValueOnce({ stdout: "", status: null, error: new Error("permission denied") });

        expect(() => loadModule()).toThrow("Error executing copy command");
    });

    it("throws when the docker cp command exits with a non-zero status", () => {
        mockSpawnSync
            .mockReturnValueOnce({ stdout: "cid\n", status: 0, error: undefined })
            .mockReturnValueOnce({ stdout: "", stderr: "no such file", status: 1, error: undefined });

        expect(() => loadModule()).toThrow("docker cp failed with status 1");
    });

    it("logs the copy operation details before executing cp", () => {
        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        mockSpawnSync
            .mockReturnValueOnce({ stdout: "cid123\n", status: 0, error: undefined })
            .mockReturnValueOnce({ stdout: "", status: 0, error: undefined });

        loadModule();

        const messages = consoleSpy.mock.calls.map((c) => c.slice(1).join(" "));
        expect(messages.some((m) => m.includes("cid123"))).toBe(true);
    });

    it("logs success message after cp completes", () => {
        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        mockSpawnSync
            .mockReturnValueOnce({ stdout: "cid\n", status: 0, error: undefined })
            .mockReturnValueOnce({ stdout: "", status: 0, error: undefined });

        loadModule();

        const messages = consoleSpy.mock.calls.map((c) => c.slice(1).join(" "));
        expect(messages.some((m) => m.includes("copied successfully"))).toBe(true);
    });
});
