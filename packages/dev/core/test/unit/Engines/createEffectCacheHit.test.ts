import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FreeCamera } from "core/Cameras/freeCamera";
import { NullEngine } from "core/Engines/nullEngine";
import { ThinEngine } from "core/Engines/thinEngine.pure";
import { WebGPUEngine } from "core/Engines/webgpuEngine.pure";
import { Vector3 } from "core/Maths/math.vector";
import { DrawWrapper } from "core/Materials/drawWrapper";
import { Effect, type IEffectCreationOptions } from "core/Materials/effect";
import { EffectFallbacks } from "core/Materials/effectFallbacks";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { Logger } from "core/Misc/logger";
import { Scene } from "core/scene";

const shaders = { vertexSource: "void main() { gl_Position = vec4(0.0); }", fragmentSource: "void main() { gl_FragColor = vec4(1.0); }" };

// Without it, the null engine compiles these sources before the effect constructor returns. Like the shader imports of the
// built-in materials, it keeps the effect compiling until the test awaits.
const deferCompilation = async () => {};

type CreateEffect = typeof ThinEngine.prototype.createEffect;

// WebGPUEngine.createEffect runs on the null engine too: it only reads the effect cache and global defines of the engine
const engineVariants: [string, CreateEffect][] = [
    ["ThinEngine", ThinEngine.prototype.createEffect],
    ["WebGPUEngine", WebGPUEngine.prototype.createEffect as unknown as CreateEffect],
];

describe.each(engineVariants)("%s.createEffect cache hits", (_name, createEffect) => {
    let engine: NullEngine;

    const baseOptions = (): IEffectCreationOptions => ({
        attributes: [],
        uniformsNames: [],
        samplers: [],
        defines: "",
        fallbacks: null,
        onCompiled: null,
        onError: null,
        extraInitializationsAsync: deferCompilation,
    });

    const createWithOptions = (options: Partial<IEffectCreationOptions> = {}): Effect => createEffect.call(engine, shaders, { ...baseOptions(), ...options }, engine);

    const createWithArguments = (onCompiled: (effect: Effect) => void, onError: (effect: Effect, errors: string) => void): Effect =>
        createEffect.call(engine, shaders, [], [], [], "", undefined, onCompiled, onError, undefined, ShaderLanguage.GLSL, deferCompilation);

    const expectCalledWith = (callback: ReturnType<typeof vi.fn>, times: number, effect: Effect) => {
        expect(callback).toHaveBeenCalledTimes(times);
        for (const call of callback.mock.calls) {
            expect(call).toHaveLength(1);
            expect(call[0]).toBe(effect);
        }
    };

    beforeEach(() => {
        engine = new NullEngine();
        vi.spyOn(Logger, "Error").mockImplementation(() => {});
    });

    afterEach(() => {
        engine.dispose();
        vi.restoreAllMocks();
    });

    it("calls the creation options onCompiled of a caller that hits the cache once the effect is ready", async () => {
        const first = createWithOptions();
        await vi.waitFor(() => expect(first.isReady()).toBe(true));

        const secondOnCompiled = vi.fn();
        const second = createWithOptions({ onCompiled: secondOnCompiled });

        expect(second).toBe(first);
        expect(secondOnCompiled).toHaveBeenCalledExactlyOnceWith(first);
    });

    it("calls the creation options onCompiled of a caller that hit the cache while the effect was compiling", async () => {
        const firstOnCompiled = vi.fn();
        const secondOnCompiled = vi.fn();
        const secondOnError = vi.fn();

        const first = createWithOptions({ onCompiled: firstOnCompiled });
        const second = createWithOptions({ onCompiled: secondOnCompiled, onError: secondOnError });
        expect(second).toBe(first);
        expect(first.isReady()).toBe(false);

        await vi.waitFor(() => expect(firstOnCompiled).toHaveBeenCalledOnce());

        expect(secondOnCompiled).toHaveBeenCalledExactlyOnceWith(first);
        expect(secondOnError).not.toHaveBeenCalled();
    });

    it("calls the onCompiled argument of a caller that hit the cache while the effect was compiling", async () => {
        const firstOnCompiled = vi.fn();
        const secondOnCompiled = vi.fn();

        const first = createWithArguments(firstOnCompiled, vi.fn());
        createWithArguments(secondOnCompiled, vi.fn());
        expect(first.isReady()).toBe(false);

        await vi.waitFor(() => expect(firstOnCompiled).toHaveBeenCalledOnce());

        expect(secondOnCompiled).toHaveBeenCalledExactlyOnceWith(first);
    });

    it("reports a compilation error to a caller that hit the cache while the effect was compiling", async () => {
        vi.spyOn(engine, "_preparePipelineContextAsync").mockImplementation(() => {
            throw new Error("Shader stage creation failed");
        });
        const firstOnError = vi.fn();
        const secondOnError = vi.fn();
        const secondOnCompiled = vi.fn();

        const first = createWithOptions({ onError: firstOnError });
        createWithOptions({ onCompiled: secondOnCompiled, onError: secondOnError });
        expect(first.getCompilationError()).toBe("");

        await vi.waitFor(() => expect(firstOnError).toHaveBeenCalledOnce());

        expect(first.getCompilationError()).toEqual(expect.stringContaining("Shader stage creation failed"));
        expect(secondOnError).toHaveBeenCalledExactlyOnceWith(first, first.getCompilationError());
        expect(secondOnCompiled).not.toHaveBeenCalled();
    });

    it("reports the compilation error right away to a caller that hits the cache after the effect failed", async () => {
        vi.spyOn(engine, "_preparePipelineContextAsync").mockImplementation(() => {
            throw new Error("Shader stage creation failed");
        });
        const firstOnError = vi.fn();
        const first = createWithOptions({ onError: firstOnError });
        await vi.waitFor(() => expect(firstOnError).toHaveBeenCalledOnce());

        const secondOnError = vi.fn();
        const secondOnCompiled = vi.fn();
        createWithOptions({ onCompiled: secondOnCompiled, onError: secondOnError });

        expect(secondOnError).toHaveBeenCalledExactlyOnceWith(first, first.getCompilationError());
        expect(secondOnCompiled).not.toHaveBeenCalled();
    });

    it("waits for the fallbacks of a failed compilation before calling a caller that hits the cache", async () => {
        const fallbacks = new EffectFallbacks();
        fallbacks.addFallback(0, "OPTIONAL");
        let compileFallback: (() => void) | undefined;
        vi.spyOn(engine, "_preparePipelineContextAsync")
            .mockImplementationOnce(() => {
                throw new Error("Optional shader feature is unsupported");
            })
            .mockImplementationOnce((...args) => {
                compileFallback = () => ThinEngine.prototype._preparePipelineContextAsync.apply(engine, args);
            });

        const first = createWithOptions({ defines: "#define OPTIONAL", fallbacks });
        await vi.waitFor(() => expect(compileFallback).toBeDefined());
        expect(first.getCompilationError()).toEqual(expect.stringContaining("Optional shader feature is unsupported"));

        const secondOnCompiled = vi.fn();
        const secondOnError = vi.fn();
        createWithOptions({ defines: "#define OPTIONAL", fallbacks, onCompiled: secondOnCompiled, onError: secondOnError });
        expect(secondOnError).not.toHaveBeenCalled();

        compileFallback!();
        await vi.waitFor(() => expect(first.isReady()).toBe(true));

        expect(secondOnCompiled).toHaveBeenCalledExactlyOnceWith(first);
        expect(secondOnError).not.toHaveBeenCalled();
    });

    it("does not call the callbacks of the cached effect a second time when its creator looks it up again while it is compiling", async () => {
        const onCompiled = vi.fn();
        const onError = vi.fn();
        const requester = new DrawWrapper(engine);

        const first = createWithOptions({ onCompiled, onError, requester });
        createWithOptions({ onCompiled, onError, requester });
        expect(first.isReady()).toBe(false);

        await vi.waitFor(() => expect(first.isReady()).toBe(true));

        expect(onCompiled).toHaveBeenCalledExactlyOnceWith(first);
        expect(onError).not.toHaveBeenCalled();
    });

    it("keeps the cached effect when the callback of a caller that hits the cache releases the other reference to it", async () => {
        const first = createWithOptions();
        await vi.waitFor(() => expect(first.isReady()).toBe(true));

        // Like a replacement material that disposes the material it replaces once it is compiled
        const second = createWithOptions({ onCompiled: () => first.dispose() });

        expect(second).toBe(first);
        expect(second.isDisposed).toBe(false);
    });

    it("calls the later callers that hit the cache while the effect was compiling when the onCompiled of an earlier one throws", async () => {
        const failure = new Error("Callback failure");
        const firstOnCompiled = vi.fn();
        const thirdOnCompiled = vi.fn();
        const thirdOnError = vi.fn();

        const first = createWithOptions({ onCompiled: firstOnCompiled });
        createWithOptions({
            onCompiled: () => {
                throw failure;
            },
        });
        createWithOptions({ onCompiled: thirdOnCompiled, onError: thirdOnError });

        await vi.waitFor(() => expect(firstOnCompiled).toHaveBeenCalledOnce());

        expect(thirdOnCompiled).toHaveBeenCalledExactlyOnceWith(first);
        expect(thirdOnError).not.toHaveBeenCalled();
        expect(first.getCompilationError()).toBe("");
        // The thrown value is given to the logger as is
        expect(Logger.Error).toHaveBeenCalledWith([expect.any(String), failure]);
    });

    it("reports the compilation error to the later callers that hit the cache while the effect was compiling when the onError of an earlier one throws", async () => {
        vi.spyOn(engine, "_preparePipelineContextAsync").mockImplementation(() => {
            throw new Error("Shader stage creation failed");
        });
        const failure = new Error("Callback failure");
        const engineOnError = vi.fn();
        engine.onEffectErrorObservable.add(engineOnError);
        const firstOnError = vi.fn();
        const thirdOnError = vi.fn();

        const first = createWithOptions({ onError: firstOnError });
        createWithOptions({
            onError: () => {
                throw failure;
            },
        });
        createWithOptions({ onCompiled: vi.fn(), onError: thirdOnError });

        await vi.waitFor(() => expect(firstOnError).toHaveBeenCalled());

        expect(first.getCompilationError()).toEqual(expect.stringContaining("Shader stage creation failed"));
        expect(firstOnError).toHaveBeenCalledExactlyOnceWith(first, first.getCompilationError());
        expect(thirdOnError).toHaveBeenCalledExactlyOnceWith(first, first.getCompilationError());
        expect(engineOnError).toHaveBeenCalledOnce();
        expect(engineOnError.mock.calls[0][0]).toEqual({ effect: first, errors: first.getCompilationError() });
        expect(Logger.Error).toHaveBeenCalledWith([expect.any(String), failure]);
    });

    it("calls the later callers and keeps the result of the compilation when reporting the failure of a callback throws", async () => {
        // The logger itself, whose hook throws, given a thrown value that cannot be turned into a string
        vi.mocked(Logger.Error).mockRestore();
        const onNewCacheEntry = Logger.OnNewCacheEntry;
        Logger.OnNewCacheEntry = () => {
            throw new Error("Log hook failure");
        };
        const unprintable = {
            get stack(): string {
                throw new Error("Unreadable stack");
            },
            toString(): string {
                throw new Error("Unprintable value");
            },
        };
        try {
            const firstOnCompiled = vi.fn();
            const firstOnError = vi.fn();
            const compileObserver = vi.fn();
            const thirdOnCompiled = vi.fn();
            const thirdOnError = vi.fn();

            const first = createWithOptions({ onCompiled: firstOnCompiled, onError: firstOnError });
            first.onCompileObservable.add(compileObserver);
            createWithOptions({
                onCompiled: () => {
                    throw unprintable;
                },
            });
            createWithOptions({ onCompiled: thirdOnCompiled, onError: thirdOnError });

            await vi.waitFor(() => expect(firstOnCompiled).toHaveBeenCalledOnce());

            expect(thirdOnCompiled).toHaveBeenCalledExactlyOnceWith(first);
            expect(thirdOnError).not.toHaveBeenCalled();
            // The shader result is the one of the compilation: the effect is ready and its own callbacks and observers are called
            expect(first.isReady()).toBe(true);
            expect(first.getCompilationError()).toBe("");
            expect(firstOnCompiled).toHaveBeenCalledExactlyOnceWith(first);
            expect(firstOnError).not.toHaveBeenCalled();
            expect(compileObserver).toHaveBeenCalledOnce();
            expect(compileObserver.mock.calls[0][0]).toBe(first);
        } finally {
            Logger.OnNewCacheEntry = onNewCacheEntry;
        }
    });

    it("calls each request once when its requester looks the effect up again in every frame until it is compiled", async () => {
        const firstOnCompiled = vi.fn();
        const secondOnCompiled = vi.fn();
        const secondOnError = vi.fn();
        const thirdOnCompiled = vi.fn();
        // Like the materials that keep their previous effect while the new one compiles (shader hot swapping): the lookups of a
        // material for a draw wrapper are retries of one request
        const firstRequester = new DrawWrapper(engine);
        const secondRequester = new DrawWrapper(engine);
        const lookUpInFrame = () => {
            createWithOptions({ onCompiled: firstOnCompiled, requester: firstRequester });
            createWithOptions({ onCompiled: secondOnCompiled, onError: secondOnError, requester: secondRequester });
        };

        const first = createWithOptions({ onCompiled: firstOnCompiled, requester: firstRequester });
        lookUpInFrame();
        lookUpInFrame();
        lookUpInFrame();
        createWithOptions({ onCompiled: thirdOnCompiled });
        expect(first.isReady()).toBe(false);

        await vi.waitFor(() => expect(first.isReady()).toBe(true));
        lookUpInFrame();

        expect(firstOnCompiled).toHaveBeenCalledExactlyOnceWith(first);
        expect(secondOnCompiled).toHaveBeenCalledExactlyOnceWith(first);
        expect(secondOnError).not.toHaveBeenCalled();
        expect(thirdOnCompiled).toHaveBeenCalledExactlyOnceWith(first);
    });

    it("reports the compilation error once to each request when its requester looks the effect up again in every frame", async () => {
        vi.spyOn(engine, "_preparePipelineContextAsync").mockImplementation(() => {
            throw new Error("Shader stage creation failed");
        });
        const firstOnError = vi.fn();
        const secondOnCompiled = vi.fn();
        const secondOnError = vi.fn();
        const firstRequester = new DrawWrapper(engine);
        const secondRequester = new DrawWrapper(engine);
        const lookUpInFrame = () => {
            createWithOptions({ onError: firstOnError, requester: firstRequester });
            createWithOptions({ onCompiled: secondOnCompiled, onError: secondOnError, requester: secondRequester });
        };

        const first = createWithOptions({ onError: firstOnError, requester: firstRequester });
        lookUpInFrame();
        lookUpInFrame();
        await vi.waitFor(() => expect(first.allFallbacksProcessed()).toBe(true));
        lookUpInFrame();
        lookUpInFrame();

        expect(firstOnError).toHaveBeenCalledExactlyOnceWith(first, first.getCompilationError());
        expect(secondOnError).toHaveBeenCalledExactlyOnceWith(first, first.getCompilationError());
        expect(secondOnCompiled).not.toHaveBeenCalled();
    });

    it("calls a handler once for each independent request that hits the cache of a ready effect", async () => {
        const first = createWithOptions();
        await vi.waitFor(() => expect(first.isReady()).toBe(true));
        const onCompiled = vi.fn();

        // Each lookup without requester is a request of its own, and so is each requester
        createWithArguments(onCompiled, vi.fn());
        createWithArguments(onCompiled, vi.fn());
        createWithOptions({ onCompiled });
        createWithOptions({ onCompiled, requester: new DrawWrapper(engine) });
        createWithOptions({ onCompiled, requester: new DrawWrapper(engine) });

        expectCalledWith(onCompiled, 5, first);
    });

    it("calls a handler once for each independent request that hit the cache while the effect was compiling", async () => {
        const firstOnCompiled = vi.fn();
        const onCompiled = vi.fn();
        const onError = vi.fn();

        const first = createWithOptions({ onCompiled: firstOnCompiled });
        createWithArguments(onCompiled, onError);
        createWithArguments(onCompiled, onError);
        createWithOptions({ onCompiled, onError, requester: new DrawWrapper(engine) });
        createWithOptions({ onCompiled, onError, requester: new DrawWrapper(engine) });
        expect(first.isReady()).toBe(false);

        await vi.waitFor(() => expect(firstOnCompiled).toHaveBeenCalledOnce());

        expectCalledWith(onCompiled, 4, first);
        expect(onError).not.toHaveBeenCalled();
    });

    it("does not call a request whose requester no longer waits for the effect, also once the calls of the compilation have started", async () => {
        const firstOnCompiled = vi.fn();
        const thirdOnCompiled = vi.fn();
        const fourthOnCompiled = vi.fn();
        const thirdRequester = new DrawWrapper(engine);
        const fourthRequester = new DrawWrapper(engine);

        createWithOptions({ onCompiled: firstOnCompiled });
        // Like a material that disposes the material it replaces once it is compiled
        createWithOptions({ onCompiled: () => thirdRequester.dispose(), requester: new DrawWrapper(engine) });
        createWithOptions({ onCompiled: thirdOnCompiled, requester: thirdRequester });
        createWithOptions({ onCompiled: fourthOnCompiled, requester: fourthRequester });
        fourthRequester.dispose();

        await vi.waitFor(() => expect(firstOnCompiled).toHaveBeenCalledOnce());

        expect(thirdOnCompiled).not.toHaveBeenCalled();
        expect(fourthOnCompiled).not.toHaveBeenCalled();
    });

    it("waits for the rebuild of an effect that failed before calling a caller that hits the cache", async () => {
        let compileRebuild: (() => void) | undefined;
        vi.spyOn(engine, "_preparePipelineContextAsync")
            .mockImplementationOnce(() => {
                throw new Error("Shader stage creation failed");
            })
            .mockImplementationOnce((...args) => {
                compileRebuild = () => ThinEngine.prototype._preparePipelineContextAsync.apply(engine, args);
            });
        const firstOnError = vi.fn();
        const first = createWithOptions({ onError: firstOnError });
        await vi.waitFor(() => expect(firstOnError).toHaveBeenCalledOnce());

        // Restoring the context compiles the cached effects again
        const restored = vi.fn();
        engine.onContextRestoredObservable.add(restored);
        engine["_restoreEngineAfterContextLost"](async () => {});
        await vi.waitFor(() => expect(restored).toHaveBeenCalledOnce());
        expect(compileRebuild).toBeDefined();

        const secondOnCompiled = vi.fn();
        const secondOnError = vi.fn();
        createWithOptions({ onCompiled: secondOnCompiled, onError: secondOnError });
        expect(secondOnError).not.toHaveBeenCalled();

        compileRebuild!();
        await vi.waitFor(() => expect(first.isReady()).toBe(true));

        expect(secondOnCompiled).toHaveBeenCalledExactlyOnceWith(first);
        expect(secondOnError).not.toHaveBeenCalled();
    });

    it("does not call a caller that hit the cache when the effect is disposed before its compilation completes", async () => {
        let completeCompilation: (() => void) | undefined;
        vi.spyOn(engine, "_executeWhenRenderingStateIsCompiled").mockImplementationOnce((_pipelineContext, action) => {
            completeCompilation = action;
        });
        const secondOnCompiled = vi.fn();
        const secondOnError = vi.fn();

        const first = createWithOptions();
        createWithOptions({ onCompiled: secondOnCompiled, onError: secondOnError });
        await vi.waitFor(() => expect(completeCompilation).toBeDefined());
        first.dispose();
        first.dispose();
        expect(first.isDisposed).toBe(true);

        // The compilation still completes on the disposed effect
        completeCompilation!();
        expect(first.isReady()).toBe(true);

        expect(secondOnCompiled).not.toHaveBeenCalled();
        expect(secondOnError).not.toHaveBeenCalled();
    });

    it("calls a caller that hits the cache after the compile observers of the effect were cleared", async () => {
        const firstOnCompiled = vi.fn();
        const secondOnCompiled = vi.fn();
        const thirdOnCompiled = vi.fn();

        const first = createWithOptions({ onCompiled: firstOnCompiled });
        createWithOptions({ onCompiled: secondOnCompiled });
        // The observables of the effect are public: their users can clear them
        first.onCompileObservable.clear();
        createWithOptions({ onCompiled: thirdOnCompiled });
        expect(first.isReady()).toBe(false);

        await vi.waitFor(() => expect(firstOnCompiled).toHaveBeenCalledOnce());

        expect(secondOnCompiled).toHaveBeenCalledExactlyOnceWith(first);
        expect(thirdOnCompiled).toHaveBeenCalledExactlyOnceWith(first);
    });

    it("reports the compilation error to a caller that hits the cache after the error observers of the effect were cleared", async () => {
        vi.spyOn(engine, "_preparePipelineContextAsync").mockImplementation(() => {
            throw new Error("Shader stage creation failed");
        });
        const firstOnError = vi.fn();
        const secondOnError = vi.fn();
        const thirdOnError = vi.fn();

        const first = createWithOptions({ onError: firstOnError });
        createWithOptions({ onError: secondOnError });
        first.onErrorObservable.clear();
        createWithOptions({ onError: thirdOnError });

        await vi.waitFor(() => expect(firstOnError).toHaveBeenCalledOnce());

        expect(secondOnError).toHaveBeenCalledExactlyOnceWith(first, first.getCompilationError());
        expect(thirdOnError).toHaveBeenCalledExactlyOnceWith(first, first.getCompilationError());
    });

    it("throws the exception of the onCompiled argument of a caller that hits the cache of a ready effect without keeping its reference", async () => {
        const first = createWithOptions();
        await vi.waitFor(() => expect(first.isReady()).toBe(true));
        const failure = new Error("Callback failure");
        const onCompiled = () => {
            throw failure;
        };

        expect(() => createWithArguments(onCompiled, vi.fn())).toThrow(failure);
        expect(first._refCount).toBe(1);

        // The lookup that threw is undone: the next lookup calls the callback again
        expect(() => createWithArguments(onCompiled, vi.fn())).toThrow(failure);
        expect(first._refCount).toBe(1);
        expect(first.isDisposed).toBe(false);
    });

    it("calls the callback of a requester again after a lookup of the requester threw", async () => {
        const first = createWithOptions();
        await vi.waitFor(() => expect(first.isReady()).toBe(true));
        const failure = new Error("Callback failure");
        const onCompiled = vi.fn(() => {
            throw failure;
        });
        const requester = new DrawWrapper(engine);

        expect(() => createWithOptions({ onCompiled, requester })).toThrow(failure);
        expect(() => createWithOptions({ onCompiled, requester })).toThrow(failure);

        expect(onCompiled).toHaveBeenCalledTimes(2);
        expect(first._refCount).toBe(1);
    });

    it("leaves the reference count unchanged when reading the callbacks from the creation options of a caller that hits the cache throws", async () => {
        const first = createWithOptions();
        await vi.waitFor(() => expect(first.isReady()).toBe(true));
        const failure = new Error("Getter failure");
        const options = baseOptions();
        Object.defineProperty(options, "onCompiled", {
            get: () => {
                throw failure;
            },
        });

        expect(() => createEffect.call(engine, shaders, options, engine)).toThrow(failure);

        expect(first._refCount).toBe(1);
        expect(first.isDisposed).toBe(false);
    });

    it("gives back the reference of a lookup that threw in persistent mode, so that its owner releases the effect after restoring normal mode", async () => {
        const first = createWithOptions();
        await vi.waitFor(() => expect(first.isReady()).toBe(true));
        const failure = new Error("Callback failure");

        Effect.PersistentMode = true;
        try {
            expect(() =>
                createWithArguments(() => {
                    throw failure;
                }, vi.fn())
            ).toThrow(failure);

            // The persistent effect is not evicted
            expect(first.isDisposed).toBe(false);
            expect(first._refCount).toBe(1);
        } finally {
            Effect.PersistentMode = false;
        }

        first.dispose();
        expect(first.isDisposed).toBe(true);
    });

    it("releases the cached effect when the onCompiled argument of a caller that hits the cache of a ready effect releases the other reference and throws", async () => {
        const first = createWithOptions();
        await vi.waitFor(() => expect(first.isReady()).toBe(true));
        const failure = new Error("Callback failure");

        expect(() =>
            createWithArguments(() => {
                first.dispose();
                throw failure;
            }, vi.fn())
        ).toThrow(failure);

        expect(first.isDisposed).toBe(true);
    });

    it("calls a caller that hit the cache while the effect was compiling when the onCompiled of the effect throws", async () => {
        const secondOnCompiled = vi.fn();
        const secondOnError = vi.fn();

        const first = createWithOptions({
            onCompiled: () => {
                throw new Error("Callback failure");
            },
        });
        createWithOptions({ onCompiled: secondOnCompiled, onError: secondOnError });
        expect(first.isReady()).toBe(false);

        await vi.waitFor(() => expect(secondOnCompiled.mock.calls.length + secondOnError.mock.calls.length).toBe(1));

        expect(secondOnCompiled).toHaveBeenCalledExactlyOnceWith(first);
        expect(secondOnError).not.toHaveBeenCalled();
    });

    it("calls a caller whose readiness check completes the compilation when the onCompiled of the effect throws", async () => {
        let completeCompilation: (() => void) | undefined;
        vi.spyOn(engine, "_executeWhenRenderingStateIsCompiled").mockImplementationOnce((_pipelineContext, action) => {
            completeCompilation = action;
        });
        const first = createWithOptions({
            onCompiled: () => {
                throw new Error("Callback failure");
            },
        });
        await vi.waitFor(() => expect(completeCompilation).toBeDefined());

        // Like a parallel compilation (WebGL), the compilation completes when the readiness of the effect is checked
        Object.defineProperty(first.getPipelineContext()!, "isReady", {
            get: () => {
                const complete = completeCompilation;
                completeCompilation = undefined;
                complete?.();
                return true;
            },
        });
        const secondOnCompiled = vi.fn();
        const secondOnError = vi.fn();
        createWithOptions({ onCompiled: secondOnCompiled, onError: secondOnError });

        expect(secondOnCompiled).toHaveBeenCalledExactlyOnceWith(first);
        expect(secondOnError).not.toHaveBeenCalled();
    });
});

describe("Material.onCompiled with an effect from the engine cache", () => {
    let engine: NullEngine;
    let scene: Scene;

    const createMaterial = (name: string, onCompiled: (effect: Effect) => void) => {
        const material = new ShaderMaterial(
            name,
            scene,
            shaders,
            { attributes: ["position"], uniforms: ["worldViewProjection"], extraInitializationsAsync: deferCompilation },
            false
        );
        material.onCompiled = onCompiled;
        return material;
    };

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("is called for a material that gets the effect another material compiled", async () => {
        const mesh = CreateBox("box", {}, scene);
        const first = createMaterial("first", vi.fn());
        await vi.waitFor(() => expect(first.isReady(mesh)).toBe(true));

        const secondOnCompiled = vi.fn();
        const second = createMaterial("second", secondOnCompiled);
        second.isReady(mesh);

        expect(second.getEffect()).toBe(first.getEffect());
        expect(secondOnCompiled).toHaveBeenCalledExactlyOnceWith(first.getEffect());
    });

    it("is called for a material that got the effect while another material was compiling it", async () => {
        const mesh = CreateBox("box", {}, scene);
        const first = createMaterial("first", vi.fn());
        const secondOnCompiled = vi.fn();
        const second = createMaterial("second", secondOnCompiled);
        expect(first.isReady(mesh)).toBe(false);
        expect(second.isReady(mesh)).toBe(false);
        expect(second.getEffect()).toBe(first.getEffect());

        await vi.waitFor(() => expect(first.isReady(mesh)).toBe(true));

        expect(secondOnCompiled).toHaveBeenCalledExactlyOnceWith(first.getEffect());
    });

    it("keeps the effect of a material whose onCompiled disposes the material that compiled the effect", async () => {
        const mesh = CreateBox("box", {}, scene);
        const first = createMaterial("first", vi.fn());
        await vi.waitFor(() => expect(first.isReady(mesh)).toBe(true));
        const effect = first.getEffect()!;

        // Like a replacement material that disposes the material it replaces once it is compiled
        const second = createMaterial("second", () => first.dispose());
        expect(second.isReady(mesh)).toBe(true);

        expect(second.getEffect()).toBe(effect);
        expect(effect.isDisposed).toBe(false);
    });

    it("is not called for a material disposed while the effect it got from the engine cache is compiling", async () => {
        const mesh = CreateBox("box", {}, scene);
        const firstOnCompiled = vi.fn();
        const first = createMaterial("first", firstOnCompiled);
        const secondOnCompiled = vi.fn();
        const second = createMaterial("second", secondOnCompiled);
        expect(first.isReady(mesh)).toBe(false);
        expect(second.isReady(mesh)).toBe(false);
        const effect = first.getEffect()!;
        expect(second.getEffect()).toBe(effect);

        second.dispose();
        await vi.waitFor(() => expect(first.isReady(mesh)).toBe(true));

        expect(firstOnCompiled).toHaveBeenCalledExactlyOnceWith(effect);
        expect(secondOnCompiled).not.toHaveBeenCalled();
        expect(effect.isDisposed).toBe(false);
    });

    it("is not called for a material that the onCompiled of another material disposes once the effect is compiled", async () => {
        const mesh = CreateBox("box", {}, scene);
        const firstOnCompiled = vi.fn();
        const first = createMaterial("first", firstOnCompiled);
        const thirdOnCompiled = vi.fn();
        // Like a material that disposes the material it replaces once it is compiled
        const secondOnCompiled = vi.fn(() => third.dispose());
        const second = createMaterial("second", secondOnCompiled);
        const third = createMaterial("third", thirdOnCompiled);
        expect(first.isReady(mesh)).toBe(false);
        expect(second.isReady(mesh)).toBe(false);
        expect(third.isReady(mesh)).toBe(false);
        const effect = first.getEffect()!;
        expect(third.getEffect()).toBe(effect);

        await vi.waitFor(() => expect(first.isReady(mesh)).toBe(true));

        expect(firstOnCompiled).toHaveBeenCalledExactlyOnceWith(effect);
        expect(secondOnCompiled).toHaveBeenCalledExactlyOnceWith(effect);
        expect(thirdOnCompiled).not.toHaveBeenCalled();
    });

    it("is called for a material that passed the same function as a material disposed while the effect was compiling", async () => {
        const mesh = CreateBox("box", {}, scene);
        const first = createMaterial("first", vi.fn());
        const sharedOnCompiled = vi.fn();
        const second = createMaterial("second", sharedOnCompiled);
        const third = createMaterial("third", sharedOnCompiled);
        expect(first.isReady(mesh)).toBe(false);
        expect(second.isReady(mesh)).toBe(false);
        expect(third.isReady(mesh)).toBe(false);

        third.dispose();
        await vi.waitFor(() => expect(first.isReady(mesh)).toBe(true));

        expect(second.getEffect()).toBe(first.getEffect());
        expect(sharedOnCompiled).toHaveBeenCalledExactlyOnceWith(first.getEffect());
    });

    it("is called for each of two materials that passed the same function and got the effect while it was compiling", async () => {
        const mesh = CreateBox("box", {}, scene);
        const first = createMaterial("first", vi.fn());
        const sharedOnCompiled = vi.fn();
        const second = createMaterial("second", sharedOnCompiled);
        const third = createMaterial("third", sharedOnCompiled);
        expect(first.isReady(mesh)).toBe(false);
        expect(second.isReady(mesh)).toBe(false);
        expect(third.isReady(mesh)).toBe(false);
        const effect = first.getEffect()!;

        await vi.waitFor(() => expect(first.isReady(mesh)).toBe(true));

        expect(sharedOnCompiled).toHaveBeenCalledTimes(2);
        expect(sharedOnCompiled.mock.calls[0][0]).toBe(effect);
        expect(sharedOnCompiled.mock.calls[1][0]).toBe(effect);
    });

    describe("with shader hot swapping", () => {
        let mesh: ReturnType<typeof CreateBox>;
        let ownerMesh: ReturnType<typeof CreateBox>;
        let material: StandardMaterial;
        let owner: StandardMaterial;

        const isMaterialReadyInFrame = () => {
            scene.incrementRenderId();
            return material.isReadyForSubMesh(mesh, mesh.subMeshes[0], false);
        };

        const isOwnerReadyInFrame = () => {
            scene.incrementRenderId();
            return owner.isReadyForSubMesh(ownerMesh, ownerMesh.subMeshes[0], false);
        };

        afterEach(() => {
            vi.restoreAllMocks();
        });

        // Gets a material whose effect is ready to look up the effect of another variant while another material (its owner) compiles it.
        // Returns that effect, and the function that compiles it
        const lookUpVariantCompiledByOwner = async (ownerOnCompiled: () => void, materialOnCompiled: () => void) => {
            new FreeCamera("camera", new Vector3(0, 0, -5), scene);
            mesh = CreateBox("mesh", {}, scene);
            ownerMesh = CreateBox("ownerMesh", {}, scene);
            material = new StandardMaterial("material", scene);
            owner = new StandardMaterial("owner", scene);
            mesh.material = material;
            ownerMesh.material = owner;
            await vi.waitFor(() => expect(isMaterialReadyInFrame()).toBe(true));
            const previousEffect = mesh.subMeshes[0].effect!;

            // Once its shaders are loaded, the null engine compiles a new effect before the constructor returns: the compilation is held
            let compile: (() => void) | undefined;
            vi.spyOn(engine, "_preparePipelineContextAsync").mockImplementationOnce((...args) => {
                compile = () => ThinEngine.prototype._preparePipelineContextAsync.apply(engine, args);
            });
            owner.onCompiled = ownerOnCompiled;
            material.onCompiled = materialOnCompiled;
            owner.pointsCloud = true;
            material.pointsCloud = true;
            expect(isOwnerReadyInFrame()).toBe(false);
            const effect = ownerMesh.subMeshes[0].effect!;
            await vi.waitFor(() => expect(compile).toBeDefined());
            expect(effect.isReady()).toBe(false);

            isMaterialReadyInFrame();
            // The material got the effect of the owner from the engine cache, and keeps its previous effect while it compiles
            expect(effect._refCount).toBe(2);
            expect(mesh.subMeshes[0].effect).toBe(previousEffect);
            expect(effect).not.toBe(previousEffect);
            return { effect, compile: () => compile!() };
        };

        it("is called once for a material that looks the effect up again in every frame until it is compiled", async () => {
            const ownerOnCompiled = vi.fn();
            const materialOnCompiled = vi.fn();
            const { effect, compile } = await lookUpVariantCompiledByOwner(ownerOnCompiled, materialOnCompiled);
            isMaterialReadyInFrame();
            isMaterialReadyInFrame();

            compile();
            await vi.waitFor(() => expect(isOwnerReadyInFrame()).toBe(true));
            expect(isMaterialReadyInFrame()).toBe(true);

            expect(mesh.subMeshes[0].effect).toBe(effect);
            expect(ownerOnCompiled).toHaveBeenCalledExactlyOnceWith(effect);
            expect(materialOnCompiled).toHaveBeenCalledExactlyOnceWith(effect);
        });

        it("is not called for a material disposed while the effect that replaces its effect is compiling", async () => {
            const ownerOnCompiled = vi.fn();
            const materialOnCompiled = vi.fn();
            const { effect, compile } = await lookUpVariantCompiledByOwner(ownerOnCompiled, materialOnCompiled);

            material.dispose();
            compile();
            await vi.waitFor(() => expect(isOwnerReadyInFrame()).toBe(true));

            expect(ownerOnCompiled).toHaveBeenCalledExactlyOnceWith(effect);
            expect(materialOnCompiled).not.toHaveBeenCalled();
        });
    });
});
