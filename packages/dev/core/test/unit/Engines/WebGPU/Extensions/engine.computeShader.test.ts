import { type ComputeEffect, type IComputeEffectCreationOptions } from "core/Compute/computeEffect";
import { type ComputeCompilationMessages } from "core/Engines/Extensions/engine.computeShader.pure";
import { RegisterEnginesWebGPUExtensionsEngineComputeShader } from "core/Engines/WebGPU/Extensions/engine.computeShader.pure";
import { WebGPUEngine } from "core/Engines/webgpuEngine.pure";
import { Logger } from "core/Misc/logger";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type CompilationCallback = (messages: ComputeCompilationMessages | null) => void;

const computeSource = "@compute @workgroup_size(1) fn main() {}";

/**
 * Minimal engine stand-in: enough for a real ComputeEffect to load a "source:" shader and
 * hand its compilation callback to the test, which then decides when and how compilation ends.
 */
const createEngine = () => {
    const pendingCompilations: CompilationCallback[] = [];
    const engine = {
        _compiledComputeEffects: {} as { [key: string]: ComputeEffect },
        _features: { needShaderCodeInlining: false },
        supportsUniformBuffers: true,
        version: 1,
        shaderPlatformName: "WEBGPU",
        isNDCHalfZRange: true,
        useReverseDepthBuffer: false,
        getCaps: () => ({}),
        getHostDocument: (): null => null,
        createComputePipelineContext: () => ({
            isAsync: false,
            isReady: false,
            _getComputeShaderCode: (): null => null,
            dispose: vi.fn(),
        }),
        _prepareComputePipelineContext: vi.fn(),
        _executeWhenComputeStateIsCompiled: (_context: unknown, callback: CompilationCallback) => {
            pendingCompilations.push(callback);
        },
        _deleteComputePipelineContext: vi.fn(),
    };

    const createComputeEffect = (options: Partial<IComputeEffectCreationOptions>): ComputeEffect =>
        WebGPUEngine.prototype.createComputeEffect.call(
            engine as unknown as WebGPUEngine,
            { computeSource },
            {
                defines: "",
                onCompiled: null,
                onError: null,
                ...options,
            }
        );

    const failCompilation = (text: string) => {
        expect(pendingCompilations).toHaveLength(1);
        pendingCompilations.shift()!({ numErrors: 1, messages: [{ type: "error", text }] });
    };

    const succeedCompilation = () => {
        expect(pendingCompilations).toHaveLength(1);
        pendingCompilations.shift()!(null);
    };

    return { createComputeEffect, failCompilation, succeedCompilation };
};

describe("WebGPUEngine.createComputeEffect cache hits", () => {
    beforeEach(() => {
        RegisterEnginesWebGPUExtensionsEngineComputeShader();
        vi.spyOn(Logger, "Error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("reports a compilation error to a caller that hit the cache while the effect was compiling", () => {
        const { createComputeEffect, failCompilation } = createEngine();
        const firstOnError = vi.fn();
        const secondOnError = vi.fn();
        const secondOnCompiled = vi.fn();

        const first = createComputeEffect({ onError: firstOnError });
        const second = createComputeEffect({ onError: secondOnError, onCompiled: secondOnCompiled });
        expect(second).toBe(first);

        failCompilation("notDefinedAnywhere is not defined");

        expect(first.getCompilationError()).toEqual(expect.stringContaining("notDefinedAnywhere is not defined"));
        expect(firstOnError).toHaveBeenCalledExactlyOnceWith(first, first.getCompilationError());
        expect(secondOnError).toHaveBeenCalledExactlyOnceWith(first, first.getCompilationError());
        expect(secondOnCompiled).not.toHaveBeenCalled();
        expect(first.onCompileObservable.hasObservers()).toBe(false);
        expect(first.onErrorObservable.hasObservers()).toBe(false);
    });

    it("reports a successful compilation to a caller that hit the cache while the effect was compiling", () => {
        const { createComputeEffect, succeedCompilation } = createEngine();
        const firstOnCompiled = vi.fn();
        const secondOnCompiled = vi.fn();
        const secondOnError = vi.fn();

        const first = createComputeEffect({ onCompiled: firstOnCompiled });
        createComputeEffect({ onCompiled: secondOnCompiled, onError: secondOnError });

        succeedCompilation();

        expect(firstOnCompiled).toHaveBeenCalledExactlyOnceWith(first);
        expect(secondOnCompiled).toHaveBeenCalledExactlyOnceWith(first);
        expect(secondOnError).not.toHaveBeenCalled();
        expect(first.onCompileObservable.hasObservers()).toBe(false);
        expect(first.onErrorObservable.hasObservers()).toBe(false);
    });

    it("reports an earlier compilation error to a caller that hits the cache afterwards", () => {
        const { createComputeEffect, failCompilation } = createEngine();
        const first = createComputeEffect({ onError: vi.fn() });
        failCompilation("notDefinedAnywhere is not defined");

        const secondOnError = vi.fn();
        const secondOnCompiled = vi.fn();
        createComputeEffect({ onError: secondOnError, onCompiled: secondOnCompiled });

        expect(secondOnError).toHaveBeenCalledExactlyOnceWith(first, first.getCompilationError());
        expect(secondOnCompiled).not.toHaveBeenCalled();
        expect(first.onErrorObservable.hasObservers()).toBe(false);
    });

    it("does not call the effect's own callbacks twice when the same callbacks hit the cache", () => {
        const { createComputeEffect, failCompilation } = createEngine();
        const onError = vi.fn();
        const onCompiled = vi.fn();

        createComputeEffect({ onError, onCompiled });
        createComputeEffect({ onError, onCompiled });

        failCompilation("notDefinedAnywhere is not defined");

        expect(onError).toHaveBeenCalledOnce();
        expect(onCompiled).not.toHaveBeenCalled();
    });
});
