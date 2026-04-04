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
            .mockReturnValueOnce({ stdout: "abc123\n", error: undefined })
            .mockReturnValueOnce({ stdout: "copied", error: undefined });

        loadModule();

        expect(mockSpawnSync).toHaveBeenCalledWith(
            "docker",
            ["container", "ls", "--filter", "name=no-context-mashina", "--format", "{{.ID}}"],
            { encoding: "utf8" }
        );
    });

    it("calls spawnSync for docker cp with the container ID from the ls output", () => {
        mockSpawnSync
            .mockReturnValueOnce({ stdout: "container456\n", error: undefined })
            .mockReturnValueOnce({ stdout: "copied", error: undefined });

        loadModule();

        expect(mockSpawnSync).toHaveBeenCalledWith(
            "docker",
            ["cp", "-a", SOURCE_TOKENS_CACHE_FILE, `container456:${REFRESH_TOKEN_DOCKER_LOCATION}`],
            { encoding: "utf8" }
        );
    });

    it("trims whitespace from the container ID returned by docker ls", () => {
        mockSpawnSync
            .mockReturnValueOnce({ stdout: "  trimme123  \n", error: undefined })
            .mockReturnValueOnce({ stdout: "", error: undefined });

        loadModule();

        const cpCall = mockSpawnSync.mock.calls[1];
        expect(cpCall[1][3]).toContain("trimme123:");
    });

    it("throws when the docker ls command returns an error", () => {
        mockSpawnSync.mockReturnValueOnce({ stdout: "", error: new Error("docker not found") });

        expect(() => loadModule()).toThrow("Error executing docker command");
    });

    it("throws when the docker cp command returns an error", () => {
        mockSpawnSync
            .mockReturnValueOnce({ stdout: "cid\n", error: undefined })
            .mockReturnValueOnce({ stdout: "", error: new Error("permission denied") });

        expect(() => loadModule()).toThrow("Error executing copy command");
    });

    it("logs the copy operation details before executing cp", () => {
        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        mockSpawnSync
            .mockReturnValueOnce({ stdout: "cid123\n", error: undefined })
            .mockReturnValueOnce({ stdout: "", error: undefined });

        loadModule();

        const messages = consoleSpy.mock.calls.map((c) => c.slice(1).join(" "));
        expect(messages.some((m) => m.includes("cid123"))).toBe(true);
    });

    it("logs success message after cp completes", () => {
        const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        mockSpawnSync
            .mockReturnValueOnce({ stdout: "cid\n", error: undefined })
            .mockReturnValueOnce({ stdout: "", error: undefined });

        loadModule();

        const messages = consoleSpy.mock.calls.map((c) => c.slice(1).join(" "));
        expect(messages.some((m) => m.includes("copied successfully"))).toBe(true);
    });
});
