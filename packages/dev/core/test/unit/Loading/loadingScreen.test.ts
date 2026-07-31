import { AbstractEngine } from "core/Engines/abstractEngine.pure";
import { RegisterLoadingScreen } from "core/Loading/loadingScreen.pure";
import { describe, expect, it } from "vitest";

describe("RegisterLoadingScreen", () => {
    it("registers the AbstractEngine loading screen APIs", () => {
        RegisterLoadingScreen();

        expect(typeof AbstractEngine.prototype.displayLoadingUI).toBe("function");
        expect(typeof AbstractEngine.prototype.hideLoadingUI).toBe("function");
        expect(Object.getOwnPropertyDescriptor(AbstractEngine.prototype, "loadingScreen")).toBeDefined();
    });
});
