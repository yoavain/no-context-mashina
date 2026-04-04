import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
    transform: {
        "^.+\\.ts$": ["ts-jest", {
            tsconfig: "tsconfig.json"
        }]
    },
    testEnvironment: "node",
    restoreMocks: true,
    testRegex: "test/.*.test.ts$",
    moduleFileExtensions: ["ts", "js", "json", "node"],
    maxWorkers: "50%",
    verbose: true,
    forceExit: true,
    collectCoverage: true,
    coverageDirectory: "coverage",
    coverageReporters: [
        "text",
        "text-summary",
        "json",
        "lcov",
        "clover"
    ],
    collectCoverageFrom: ["src/**/*.ts", "!src/run.ts", "!src/index.ts", "!**/node_modules/**"]
};

export default config;
