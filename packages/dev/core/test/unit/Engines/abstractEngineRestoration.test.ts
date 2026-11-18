import { EngineFunctionContext } from "core/Engines/abstractEngine.functions";
import { NullEngine } from "core/Engines/nullEngine";
import { type IEffectCreationOptions } from "core/Materials/effect";
import { type IFileRequest } from "core/Misc/fileRequest";
import { Logger } from "core/Misc/logger";
import { describe, expect, it, onTestFinished, vi } from "vitest";

const VertexSource = "void main() { gl_Position = vec4(0.0); }";
const FragmentSource = "void main() { gl_FragColor = vec4(1.0); }";

// The creation options of an effect without uniforms, samplers, fallbacks or callbacks
function EffectOptions(options: Partial<IEffectCreationOptions> = {}): IEffectCreationOptions {
    return { attributes: [], uniformsNames: [], samplers: [], defines: "", fallbacks: null, onCompiled: null, onError: null, ...options };
}

// Restores the engine as after a context loss (the real _rebuildGraphicsResources included) and waits until the restoration is declared
async function RestoreAfterContextLostAsync(engine: NullEngine): Promise<void> {
    const restored = vi.fn();
    engine.onContextRestoredObservable.add(restored);
    engine["_restoreEngineAfterContextLost"](async () => {});
    await vi.waitFor(() => expect(restored).toHaveBeenCalledOnce());
}

describe("Engine context restoration", () => {
    it("waits for asynchronous device initialization before rebuilding resources", async () => {
        const engine = new NullEngine();
        onTestFinished(() => engine.dispose());
        let finish!: () => void;
        const initialized = new Promise<void>((resolve) => {
            finish = resolve;
        });
        const init = vi.fn(async () => await initialized);
        const rebuild = vi.fn();
        engine["_rebuildGraphicsResources"] = rebuild;
        const restored = vi.fn();
        engine.onContextRestoredObservable.add(restored);
        engine["_restoreEngineAfterContextLost"](init);
        await vi.waitFor(() => expect(init).toHaveBeenCalledOnce());
        expect(rebuild).not.toHaveBeenCalled();
        expect(restored).not.toHaveBeenCalled();
        finish();
        await vi.waitFor(() => expect(restored).toHaveBeenCalledOnce());
        expect(rebuild).toHaveBeenCalledOnce();
    });

    it("reports initialization failures without rebuilding or declaring restoration", async () => {
        const engine = new NullEngine();
        const error = vi.spyOn(Logger, "Error").mockImplementation(() => {});
        onTestFinished(() => {
            error.mockRestore();
            engine.dispose();
        });
        const rebuild = vi.fn();
        engine["_rebuildGraphicsResources"] = rebuild;
        const restored = vi.fn();
        engine.onContextRestoredObservable.add(restored);
        engine["_restoreEngineAfterContextLost"](async () => {
            throw new Error("device unavailable");
        });
        await vi.waitFor(() => expect(error).toHaveBeenCalledWith(expect.stringContaining("device unavailable")));
        expect(rebuild).not.toHaveBeenCalled();
        expect(restored).not.toHaveBeenCalled();
    });

    // https://github.com/BabylonJS/Babylon.js/issues/19067
    it("leaves an effect still awaiting extraInitializationsAsync to prepare itself once its shader code is processed", async () => {
        const engine = new NullEngine();
        onTestFinished(() => engine.dispose());
        let finishInitializations!: () => void;
        const initializations = new Promise<void>((resolve) => {
            finishInitializations = resolve;
        });
        const prepare = vi.spyOn(engine, "_preparePipelineContextAsync");
        const effect = engine.createEffect(
            { vertexSource: VertexSource, fragmentSource: FragmentSource },
            EffectOptions({ extraInitializationsAsync: async () => await initializations }),
            engine
        );

        await RestoreAfterContextLostAsync(engine);

        // Rebuilding the effect now would prepare a pipeline context without shader sources (nor, on WebGPU, a shader processing context)
        expect(prepare).not.toHaveBeenCalled();
        expect(effect.isReady()).toBe(false);

        finishInitializations();

        await vi.waitFor(() => expect(effect.isReady()).toBe(true));
        expect(prepare).toHaveBeenCalledOnce();
        expect(prepare.mock.calls[0][1]).toContain("gl_Position");
        expect(effect.getCompilationError()).toBe("");
    });

    it("leaves an effect whose shader files are still loading to prepare itself once its shader code is processed", async () => {
        const engine = new NullEngine();
        const loadFile = EngineFunctionContext.loadFile;
        onTestFinished(() => {
            EngineFunctionContext.loadFile = loadFile;
            engine.dispose();
        });
        const loads: { url: string; onSuccess: (data: string) => void }[] = [];
        EngineFunctionContext.loadFile = (url, onSuccess) => {
            loads.push({ url, onSuccess });
            return {} as IFileRequest;
        };
        const prepare = vi.spyOn(engine, "_preparePipelineContextAsync");
        const effect = engine.createEffect("pendingShaderFiles", EffectOptions(), engine);
        expect(loads.map((load) => load.url)).toEqual([expect.stringMatching(/pendingShaderFiles\.vertex\.fx$/), expect.stringMatching(/pendingShaderFiles\.fragment\.fx$/)]);

        await RestoreAfterContextLostAsync(engine);

        expect(prepare).not.toHaveBeenCalled();
        expect(effect.isReady()).toBe(false);

        loads[0].onSuccess(VertexSource);
        loads[1].onSuccess(FragmentSource);

        await vi.waitFor(() => expect(effect.isReady()).toBe(true));
        expect(prepare).toHaveBeenCalledOnce();
        expect(prepare.mock.calls[0][1]).toContain("gl_Position");
        expect(effect.getCompilationError()).toBe("");
    });

    it("still rebuilds effects whose shader code was processed", async () => {
        const engine = new NullEngine();
        onTestFinished(() => engine.dispose());
        const effect = engine.createEffect({ vertexSource: VertexSource, fragmentSource: FragmentSource }, EffectOptions(), engine);
        await vi.waitFor(() => expect(effect.isReady()).toBe(true));
        const previousPipelineContext = effect.getPipelineContext();
        const prepare = vi.spyOn(engine, "_preparePipelineContextAsync");

        await RestoreAfterContextLostAsync(engine);

        expect(prepare).toHaveBeenCalledOnce();
        expect(prepare.mock.calls[0][1]).toContain("gl_Position");
        expect(effect.getPipelineContext()).not.toBe(previousPipelineContext);
        expect(effect.isReady()).toBe(true);
    });
});
