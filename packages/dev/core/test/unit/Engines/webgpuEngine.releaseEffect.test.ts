import { describe, expect, it, vi } from "vitest";

import { WebGPUEngine } from "core/Engines/webgpuEngine.pure";
import { WebGPUPipelineContext } from "core/Engines/WebGPU/webgpuPipelineContext";
import type { WebGPUShaderProcessingContext } from "core/Engines/WebGPU/webgpuShaderProcessingContext";
import type { Effect } from "core/Materials/effect";
import type { UniformBuffer } from "core/Materials/uniformBuffer";

// Only the members WebGPUEngine._releaseEffect() and _deletePipelineContext() use, so the real methods can run without a GPU.
function CreateEngine(compiledEffects: { [key: string]: Effect } = {}): WebGPUEngine {
    return {
        _compiledEffects: compiledEffects,
        _deletePipelineContext: WebGPUEngine.prototype._deletePipelineContext,
    } as unknown as WebGPUEngine;
}

// A real WebGPUPipelineContext whose left-over uniform buffer is a spy.
function CreatePipelineContext(engine: WebGPUEngine): { pipelineContext: WebGPUPipelineContext; disposeLeftOver: ReturnType<typeof vi.fn> } {
    const pipelineContext = new WebGPUPipelineContext({} as WebGPUShaderProcessingContext, engine);
    const disposeLeftOver = vi.fn();
    pipelineContext.uniformBuffer = { dispose: disposeLeftOver } as unknown as UniformBuffer;
    return { pipelineContext, disposeLeftOver };
}

function CreateEffect(key: string, pipelineContext: WebGPUPipelineContext | undefined): Effect {
    return { _key: key, getPipelineContext: () => pipelineContext } as unknown as Effect;
}

function ReleaseEffect(engine: WebGPUEngine, effect: Effect): void {
    WebGPUEngine.prototype._releaseEffect.call(engine, effect);
}

describe("WebGPUEngine._releaseEffect", () => {
    it("disposes the pipeline context of an effect that is not in the compiled effects cache", () => {
        // e.g. an EffectWrapper with useShaderStore: false builds its effect with new Effect(...), which is never cached
        const engine = CreateEngine();
        const { pipelineContext, disposeLeftOver } = CreatePipelineContext(engine);

        ReleaseEffect(engine, CreateEffect("uncached", pipelineContext));

        expect(disposeLeftOver).toHaveBeenCalledOnce();
    });

    it("removes a cached effect from the cache and disposes its pipeline context", () => {
        const compiledEffects: { [key: string]: Effect } = {};
        const engine = CreateEngine(compiledEffects);
        const { pipelineContext, disposeLeftOver } = CreatePipelineContext(engine);
        const effect = CreateEffect("cached", pipelineContext);
        compiledEffects["cached"] = effect;

        ReleaseEffect(engine, effect);

        expect(compiledEffects["cached"]).toBeUndefined();
        expect(disposeLeftOver).toHaveBeenCalledOnce();
    });

    it("does nothing for an effect that has no pipeline context yet", () => {
        const engine = CreateEngine();

        expect(() => ReleaseEffect(engine, CreateEffect("not-compiled", undefined))).not.toThrow();
    });
});

describe("WebGPUEngine._deletePipelineContext", () => {
    it("disposes the left-over uniform buffer of the pipeline context", () => {
        // also called by Effect for the previous pipeline context when an effect is rebuilt
        const engine = CreateEngine();
        const { pipelineContext, disposeLeftOver } = CreatePipelineContext(engine);

        engine._deletePipelineContext(pipelineContext);

        expect(disposeLeftOver).toHaveBeenCalledOnce();
    });
});
