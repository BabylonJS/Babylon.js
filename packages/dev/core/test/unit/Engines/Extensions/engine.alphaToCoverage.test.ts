import { ThinEngine } from "core/Engines/thinEngine.pure";
import { ThinWebGPUEngine } from "core/Engines/thinWebGPUEngine";
import { type RenderTargetWrapper } from "core/Engines/renderTargetWrapper";
import { RegisterEnginesExtensionsEngineAlphaToCoverage } from "core/Engines/Extensions/engine.alphaToCoverage.pure";
import type {} from "core/Engines/Extensions/engine.alphaToCoverage.types";
import { RegisterEnginesWebGPUExtensionsEngineAlphaToCoverage } from "core/Engines/WebGPU/Extensions/engine.alphaToCoverage.pure";
import type {} from "core/Engines/WebGPU/Extensions/engine.alphaToCoverage.types";
import { describe, expect, it, vi } from "vitest";

describe("engine.alphaToCoverage", () => {
    it("applies WebGL state and reports the active sample count after registration", () => {
        expect(Object.prototype.hasOwnProperty.call(ThinEngine.prototype, "setAlphaToCoverage")).toBe(false);

        RegisterEnginesExtensionsEngineAlphaToCoverage();

        const engine = new ThinEngine(null);
        const enable = vi.fn();
        const disable = vi.fn();
        const getContextAttributes = vi.fn(() => ({ antialias: true }));
        const getParameter = vi.fn(() => 4);
        expect(engine.currentSampleCount).toBe(1);

        engine._gl = {
            SAMPLE_ALPHA_TO_COVERAGE: 0x809e,
            SAMPLES: 0x80a9,
            enable,
            disable,
            getContextAttributes,
            getParameter,
        } as unknown as WebGL2RenderingContext;

        try {
            expect(engine.getAlphaToCoverage()).toBe(false);
            expect(engine.currentSampleCount).toBe(4);
            expect(engine.currentSampleCount).toBe(4);
            expect(getContextAttributes).toHaveBeenCalledTimes(1);
            expect(getParameter).toHaveBeenCalledTimes(1);

            engine.setAlphaToCoverage(true);
            engine.setAlphaToCoverage(true);
            expect(engine.getAlphaToCoverage()).toBe(true);
            expect(enable).toHaveBeenCalledExactlyOnceWith(engine._gl.SAMPLE_ALPHA_TO_COVERAGE);

            engine.setAlphaToCoverage(false);
            engine.setAlphaToCoverage(false);
            expect(engine.getAlphaToCoverage()).toBe(false);
            expect(disable).toHaveBeenCalledExactlyOnceWith(engine._gl.SAMPLE_ALPHA_TO_COVERAGE);

            engine._currentRenderTarget = { samples: 8 } as unknown as RenderTargetWrapper;
            expect(engine.currentSampleCount).toBe(8);

            engine._currentRenderTarget = null;
            const restoredContextGetParameter = vi.fn(() => 2);
            engine._gl = {
                ...engine._gl,
                getContextAttributes: () => ({ antialias: true }),
                getParameter: restoredContextGetParameter,
            } as unknown as WebGL2RenderingContext;
            expect(engine.currentSampleCount).toBe(2);
            expect(engine.currentSampleCount).toBe(2);
            expect(restoredContextGetParameter).toHaveBeenCalledTimes(1);
        } finally {
            (engine as unknown as { _gl?: WebGL2RenderingContext })._gl = undefined;
            engine.dispose();
        }
    });

    it("applies WebGPU state to the render pipeline cache after registration", () => {
        expect(Object.prototype.hasOwnProperty.call(ThinWebGPUEngine.prototype, "setAlphaToCoverage")).toBe(false);

        RegisterEnginesWebGPUExtensionsEngineAlphaToCoverage();

        const engine = Object.create(ThinWebGPUEngine.prototype) as ThinWebGPUEngine;
        const pipelineCache = {
            _alphaToCoverageEnabled: false,
            setAlphaToCoverage: vi.fn((enable: boolean) => {
                pipelineCache._alphaToCoverageEnabled = enable;
            }),
        };
        engine._cacheRenderPipeline = pipelineCache as unknown as ThinWebGPUEngine["_cacheRenderPipeline"];

        expect(engine.getAlphaToCoverage()).toBe(false);

        engine.setAlphaToCoverage(true);
        engine.setAlphaToCoverage(true);

        expect(engine.getAlphaToCoverage()).toBe(true);
        pipelineCache._alphaToCoverageEnabled = false;
        engine.setAlphaToCoverage(true);
        engine.setAlphaToCoverage(false);
        engine.setAlphaToCoverage(false);
        expect(engine.getAlphaToCoverage()).toBe(false);
        expect(pipelineCache.setAlphaToCoverage.mock.calls).toEqual([[true], [true], [false]]);
    });
});
