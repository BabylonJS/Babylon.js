import { describe, expect, it } from "vitest";
import { _ApplyWhiteBalanceOptions } from "../../../src/PostProcesses/thinImageProcessingPostProcess";
import { ImageProcessingConfiguration } from "../../../src/Materials/imageProcessingConfiguration.pure";

// Regression coverage: _ApplyWhiteBalanceOptions is applied both inside ThinImageProcessingPostProcess's own
// constructor and directly by ImageProcessingPostProcess after `super()`, since a caller-supplied `effectWrapper`
// bypasses the thin wrapper's constructor (and thus its own call) entirely. This tests the shared function itself.

describe("_ApplyWhiteBalanceOptions", () => {
    it("does nothing when options is a plain size number", () => {
        const configuration = new ImageProcessingConfiguration();
        _ApplyWhiteBalanceOptions(configuration, 1.0);
        expect(configuration.whiteBalanceEnabled).toBe(false);
    });

    it("does nothing when options is undefined", () => {
        const configuration = new ImageProcessingConfiguration();
        _ApplyWhiteBalanceOptions(configuration, undefined);
        expect(configuration.whiteBalanceEnabled).toBe(false);
    });

    it("does nothing when neither temperature nor tint is provided", () => {
        const configuration = new ImageProcessingConfiguration();
        _ApplyWhiteBalanceOptions(configuration, {});
        expect(configuration.whiteBalanceEnabled).toBe(false);
    });

    it("applies temperature and enables white balance", () => {
        const configuration = new ImageProcessingConfiguration();
        _ApplyWhiteBalanceOptions(configuration, { temperature: 3200 });
        expect(configuration.whiteBalanceEnabled).toBe(true);
        expect(configuration.temperature).toBe(3200);
        expect(configuration.tint).toBe(0);
    });

    it("applies tint and enables white balance", () => {
        const configuration = new ImageProcessingConfiguration();
        _ApplyWhiteBalanceOptions(configuration, { tint: 25 });
        expect(configuration.whiteBalanceEnabled).toBe(true);
        expect(configuration.temperature).toBe(6500);
        expect(configuration.tint).toBe(25);
    });

    it("applies both temperature and tint", () => {
        const configuration = new ImageProcessingConfiguration();
        _ApplyWhiteBalanceOptions(configuration, { temperature: 4500, tint: -10 });
        expect(configuration.whiteBalanceEnabled).toBe(true);
        expect(configuration.temperature).toBe(4500);
        expect(configuration.tint).toBe(-10);
    });
});
