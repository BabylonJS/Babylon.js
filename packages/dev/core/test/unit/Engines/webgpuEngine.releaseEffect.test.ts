import { describe, expect, it, vi } from "vitest";

import { WebGPUEngine } from "core/Engines/webgpuEngine.pure";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Observable } from "core/Misc/observable";
import { WebGPUPipelineContext } from "core/Engines/WebGPU/webgpuPipelineContext";
import type { WebGPUShaderProcessingContext } from "core/Engines/WebGPU/webgpuShaderProcessingContext";
import type { Effect } from "core/Materials/effect";
import type { UniformBuffer } from "core/Materials/uniformBuffer";

// Only the members WebGPUEngine._releaseEffect() and _deletePipelineContext() use, so the real methods can run without a GPU.
function CreateEngine(compiledEffects: { [key: string]: Effect } = {}): WebGPUEngine {
    return {
        _compiledEffects: compiledEffects,
        _deletePipelineContext: WebGPUEngine.prototype._deletePipelineContext,
        _releaseEffect: WebGPUEngine.prototype._releaseEffect,
        releaseEffects: WebGPUEngine.prototype.releaseEffects,
        onReleaseEffectsObservable: new Observable(),
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

describe("WebGPUEngine.releaseEffects", () => {
    // Effect registers this observer in its constructor: releaseEffects() force-disposes every effect, which calls _releaseEffect()
    function CreateObservedEffect(engine: WebGPUEngine, key: string, pipelineContext: WebGPUPipelineContext): Effect {
        const effect = CreateEffect(key, pipelineContext);
        engine.onReleaseEffectsObservable.addOnce(() => ReleaseEffect(engine, effect));
        return effect;
    }

    it("keeps the left-over uniform buffers of the effects it releases, which can still be in use", () => {
        // a ShaderMaterial keeps rendering with its released effect, the clear quad and snapshot bundles keep referencing its buffer
        const compiledEffects: { [key: string]: Effect } = {};
        const engine = CreateEngine(compiledEffects);
        const cached = CreatePipelineContext(engine);
        const uncached = CreatePipelineContext(engine);
        compiledEffects["cached"] = CreateObservedEffect(engine, "cached", cached.pipelineContext);
        CreateObservedEffect(engine, "uncached", uncached.pipelineContext);

        engine.releaseEffects();

        expect(Object.keys((engine as unknown as { _compiledEffects: object })._compiledEffects)).toHaveLength(0);
        expect(cached.disposeLeftOver).not.toHaveBeenCalled();
        expect(uncached.disposeLeftOver).not.toHaveBeenCalled();
        expect(cached.pipelineContext.isDisposed).toBe(false);
    });

    it("still disposes the pipeline context of an effect disposed on its own afterwards", () => {
        const engine = CreateEngine();
        engine.releaseEffects();
        const { pipelineContext, disposeLeftOver } = CreatePipelineContext(engine);

        ReleaseEffect(engine, CreateEffect("later", pipelineContext));

        expect(disposeLeftOver).toHaveBeenCalledOnce();
    });
});

describe("WebGPUEngine._preparePipelineContextAsync", () => {
    // A GLSL effect waits for glslang and twgsl to load before its stages are compiled and onReady() builds its resources
    function CreateLoadingEngine(): { engine: WebGPUEngine; translatorsLoaded: () => void; compileStages: ReturnType<typeof vi.fn> } {
        let translatorsLoaded!: () => void;
        const loading = new Promise<void>((resolve) => (translatorsLoaded = resolve));
        const compileStages = vi.fn(() => ({}));
        const engine = {
            _compiledEffects: {},
            _deletePipelineContext: WebGPUEngine.prototype._deletePipelineContext,
            _glslangAndTintAreFullyLoaded: false,
            prepareGlslangAndTintAsync: async () => await loading,
            dbgShowShaderCode: false,
            _compilePipelineStageDescriptor: compileStages,
        } as unknown as WebGPUEngine;
        return { engine, translatorsLoaded, compileStages };
    }

    async function PrepareAsync(engine: WebGPUEngine, pipelineContext: WebGPUPipelineContext, onReady: () => void): Promise<void> {
        await WebGPUEngine.prototype._preparePipelineContextAsync.call(engine, pipelineContext, "vertex", "fragment", false, "", "", null, null, null, "", onReady);
    }

    function CreateGLSLPipelineContext(engine: WebGPUEngine): WebGPUPipelineContext {
        return new WebGPUPipelineContext({ shaderLanguage: ShaderLanguage.GLSL } as WebGPUShaderProcessingContext, engine);
    }

    it("does not complete the compilation of an effect released while the shader translators are loading", async () => {
        const { engine, translatorsLoaded, compileStages } = CreateLoadingEngine();
        const pipelineContext = CreateGLSLPipelineContext(engine);
        const onReady = vi.fn();

        const preparation = PrepareAsync(engine, pipelineContext, onReady);
        // Effect.dispose() -> _releaseEffect(): the context has no left-over uniform buffer yet
        ReleaseEffect(engine, CreateEffect("pending", pipelineContext));
        translatorsLoaded();
        await preparation;

        expect(pipelineContext.isDisposed).toBe(true);
        expect(compileStages).not.toHaveBeenCalled();
        expect(onReady).not.toHaveBeenCalled(); // onReady -> _fillEffectInformation() would build the left-over uniform buffer
    });

    it("completes the compilation once the shader translators are loaded", async () => {
        const { engine, translatorsLoaded, compileStages } = CreateLoadingEngine();
        const pipelineContext = CreateGLSLPipelineContext(engine);
        const onReady = vi.fn();

        const preparation = PrepareAsync(engine, pipelineContext, onReady);
        translatorsLoaded();
        await preparation;

        expect(compileStages).toHaveBeenCalledOnce();
        expect(onReady).toHaveBeenCalledOnce();
    });
});
