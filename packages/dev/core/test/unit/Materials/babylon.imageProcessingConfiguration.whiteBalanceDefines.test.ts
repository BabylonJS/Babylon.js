import { describe, expect, it } from "vitest";
import { ImageProcessingConfiguration } from "../../../src/Materials/imageProcessingConfiguration.pure";
import { ImageProcessingConfigurationDefines } from "../../../src/Materials/imageProcessingConfiguration.defines";

// Regression coverage for prepareDefines' WHITEBALANCE handling: as the only enabled effect, when the
// configuration itself is disabled, and when forPostProcess doesn't match applyByPostProcess.

describe("ImageProcessingConfiguration.prepareDefines white balance", () => {
    it("sets WHITEBALANCE (and folds it into IMAGEPROCESSING) when it's the only enabled effect", () => {
        const configuration = new ImageProcessingConfiguration();
        configuration.whiteBalanceEnabled = true;

        const defines = new ImageProcessingConfigurationDefines();
        configuration.prepareDefines(defines, configuration.applyByPostProcess);

        expect(defines.WHITEBALANCE).toBe(true);
        expect(defines.IMAGEPROCESSING).toBe(true);
    });

    it("clears WHITEBALANCE when the configuration itself is disabled", () => {
        const configuration = new ImageProcessingConfiguration();
        configuration.whiteBalanceEnabled = true;
        configuration.isEnabled = false;

        // Pre-seed a stale `true` so the assertion below proves prepareDefines actively clears it, rather than
        // merely reflecting the defines object's own default value.
        const defines = new ImageProcessingConfigurationDefines();
        defines.WHITEBALANCE = true;
        defines.IMAGEPROCESSING = true;
        configuration.prepareDefines(defines, configuration.applyByPostProcess);

        expect(defines.WHITEBALANCE).toBe(false);
        expect(defines.IMAGEPROCESSING).toBe(false);
    });

    it("clears WHITEBALANCE when forPostProcess doesn't match applyByPostProcess", () => {
        const configuration = new ImageProcessingConfiguration();
        configuration.whiteBalanceEnabled = true;
        configuration.applyByPostProcess = true;

        const defines = new ImageProcessingConfigurationDefines();
        defines.WHITEBALANCE = true;
        defines.IMAGEPROCESSING = true;
        // forPostProcess=false while the configuration itself is set to apply by post process: mismatch.
        configuration.prepareDefines(defines, false);

        expect(defines.WHITEBALANCE).toBe(false);
        expect(defines.IMAGEPROCESSING).toBe(false);
    });

    it("clears WHITEBALANCE on a default configuration (whiteBalanceEnabled false, otherwise-enabled code path)", () => {
        const configuration = new ImageProcessingConfiguration();

        const defines = new ImageProcessingConfigurationDefines();
        defines.WHITEBALANCE = true;
        defines.IMAGEPROCESSING = true;
        configuration.prepareDefines(defines, configuration.applyByPostProcess);

        expect(defines.WHITEBALANCE).toBe(false);
        expect(defines.IMAGEPROCESSING).toBe(false);
    });
});
