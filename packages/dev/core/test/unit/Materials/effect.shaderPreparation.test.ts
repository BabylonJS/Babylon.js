import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { ThinNativeEngine } from "core/Engines/thinNativeEngine";
import { Effect, type IEffectCreationOptions } from "core/Materials/effect";
import { EffectFallbacks } from "core/Materials/effectFallbacks";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Logger } from "core/Misc/logger";

describe("Effect shader preparation failures", () => {
    let engine: NullEngine;
    let fallbacks: EffectFallbacks;

    beforeEach(() => {
        engine = new NullEngine();
        fallbacks = new EffectFallbacks();
        fallbacks.addFallback(0, "OPTIONAL");
        vi.spyOn(Logger, "Error").mockImplementation(() => {});
    });

    afterEach(() => {
        engine.dispose();
        vi.restoreAllMocks();
    });

    function createEffect(options: Partial<IEffectCreationOptions> = {}) {
        return new Effect(
            { vertexSource: "void main() { gl_Position = vec4(0.0); }", fragmentSource: "void main() { gl_FragColor = vec4(1.0); }" },
            { attributes: [], uniformsNames: [], samplers: [], defines: "#define OPTIONAL", fallbacks, ...options } as IEffectCreationOptions,
            engine
        );
    }

    it("reports unsupported Native WGSL without compiling empty sources or consuming fallbacks", async () => {
        const nativeEngine = Object.create(ThinNativeEngine.prototype) as ThinNativeEngine;
        vi.spyOn(engine, "_getShaderProcessingContext").mockImplementation((language) => nativeEngine._getShaderProcessingContext(language));
        const prepare = vi.spyOn(engine, "_preparePipelineContextAsync");
        const reduce = vi.spyOn(fallbacks, "reduce");
        const unbind = vi.spyOn(fallbacks, "unBindMesh");
        const onError = vi.fn();
        engine.onEffectErrorObservable.add(onError);

        const effect = createEffect({ shaderLanguage: ShaderLanguage.WGSL });
        await vi.waitFor(() => expect(onError).toHaveBeenCalledOnce());

        expect(effect.isReady()).toBe(false);
        expect(effect.allFallbacksProcessed()).toBe(true);
        expect(effect.getCompilationError()).toContain("NativeEngine does not support WGSL graphics shaders.");
        expect(onError.mock.calls[0][0].effect).toBe(effect);
        expect(prepare).not.toHaveBeenCalled();
        expect(reduce).not.toHaveBeenCalled();
        expect(unbind).toHaveBeenCalledOnce();
    });

    it("preserves an asynchronous shader initialization error without trying define fallbacks", async () => {
        const prepare = vi.spyOn(engine, "_preparePipelineContextAsync");
        const onError = vi.fn();
        engine.onEffectErrorObservable.add(onError);

        const effect = createEffect({
            extraInitializationsAsync: async () => {
                throw new Error("Shader import failed");
            },
        });
        await vi.waitFor(() => expect(onError).toHaveBeenCalledOnce());

        expect(effect.getCompilationError()).toContain("Shader import failed");
        expect(effect.allFallbacksProcessed()).toBe(true);
        expect(prepare).not.toHaveBeenCalled();
    });

    it("still recovers from a compiler failure using prepared-source fallbacks", async () => {
        const prepare = vi.spyOn(engine, "_preparePipelineContextAsync").mockImplementationOnce(() => {
            throw new Error("Optional shader feature is unsupported");
        });
        const reduce = vi.spyOn(fallbacks, "reduce");
        const onError = vi.fn();
        engine.onEffectErrorObservable.add(onError);

        const effect = createEffect();
        await vi.waitFor(() => expect(effect.isReady()).toBe(true));

        expect(prepare).toHaveBeenCalledTimes(2);
        expect(reduce).toHaveBeenCalledOnce();
        expect(effect.getCompilationError()).toBe("");
        expect(onError).not.toHaveBeenCalled();
    });
});
