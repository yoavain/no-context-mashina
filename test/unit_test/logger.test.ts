import { Logger } from "../../src/logger";

describe("Logger", () => {
    it("Logger.log calls console.log with a timestamp prefix followed by the args", () => {
        const spy = jest.spyOn(console, "log").mockImplementation(() => {});
        Logger.log("hello");
        expect(spy).toHaveBeenCalledWith(expect.any(String), "hello");
    });

    it("Logger.log passes through multiple arguments", () => {
        const spy = jest.spyOn(console, "log").mockImplementation(() => {});
        Logger.log("a", "b", 42);
        expect(spy).toHaveBeenCalledWith(expect.any(String), "a", "b", 42);
    });

    it("Logger.error calls console.error with a timestamp prefix followed by the args", () => {
        const spy = jest.spyOn(console, "error").mockImplementation(() => {});
        Logger.error("oops");
        expect(spy).toHaveBeenCalledWith(expect.any(String), "oops");
    });

    it("timestamp prefix is a non-empty string", () => {
        let capturedFirst: unknown;
        jest.spyOn(console, "log").mockImplementation((...args) => {
            capturedFirst = args[0]; 
        });
        Logger.log("x");
        expect(typeof capturedFirst).toBe("string");
        expect((capturedFirst as string).length).toBeGreaterThan(0);
    });

    it("does not mutate or drop the original arguments", () => {
        const spy = jest.spyOn(console, "log").mockImplementation(() => {});
        const obj = { key: "value" };
        Logger.log(obj);
        expect(spy).toHaveBeenCalledWith(expect.any(String), obj);
    });
});
