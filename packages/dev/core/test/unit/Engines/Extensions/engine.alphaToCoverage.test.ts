import { ThinEngine } from "core/Engines/thinEngine.pure";
import { type RenderTargetWrapper } from "core/Engines/renderTargetWrapper";
import { RegisterEnginesExtensionsEngineAlphaToCoverage } from "core/Engines/Extensions/engine.alphaToCoverage.pure";
import type {} from "core/Engines/Extensions/engine.alphaToCoverage.types";
import { describe, expect, it, vi } from "vitest";

describe("engine.alphaToCoverage", () => {
    it("applies WebGL state and reports the active sample count after registration", () => {
        expect(Object.prototype.hasOwnProperty.call(ThinEngine.prototype, "setAlphaToCoverage")).toBe(false);

        RegisterEnginesExtensionsEngineAlphaToCoverage();

        const engine = new ThinEngine(null);
        const enable = vi.fn();
        const disable = vi.fn();
        expect(engine.currentSampleCount).toBe(1);

        engine._gl = {
            SAMPLE_ALPHA_TO_COVERAGE: 0x809e,
            SAMPLES: 0x80a9,
            enable,
            disable,
            getContextAttributes: () => ({ antialias: true }),
            getParameter: () => 4,
        } as unknown as WebGL2RenderingContext;

        try {
            expect(engine.getAlphaToCoverage()).toBe(false);
            expect(engine.currentSampleCount).toBe(4);

            engine.setAlphaToCoverage(true);
            expect(engine.getAlphaToCoverage()).toBe(true);
            expect(enable).toHaveBeenCalledExactlyOnceWith(engine._gl.SAMPLE_ALPHA_TO_COVERAGE);

            engine.setAlphaToCoverage(false);
            expect(engine.getAlphaToCoverage()).toBe(false);
            expect(disable).toHaveBeenCalledExactlyOnceWith(engine._gl.SAMPLE_ALPHA_TO_COVERAGE);

            engine._currentRenderTarget = { samples: 8 } as unknown as RenderTargetWrapper;
            expect(engine.currentSampleCount).toBe(8);
        } finally {
            (engine as unknown as { _gl?: WebGL2RenderingContext })._gl = undefined;
            engine.dispose();
        }
    });
});
