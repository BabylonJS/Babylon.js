import { ThinNativeEngine } from "core/Engines/thinNativeEngine";
import { RegisterNativeEngineCubeTexture } from "core/Engines/Native/Extensions/nativeEngine.cubeTexture.pure";
import { InternalTextureSource, type InternalTexture } from "core/Materials/Textures/internalTexture";
import { type IHardwareTextureWrapper } from "core/Materials/Textures/hardwareTextureWrapper";
import { describe, expect, it, vi } from "vitest";

type NativeFrameRequester = {
    requestAnimationFrame: (callback: () => void) => number;
};

type TestThinNativeEngine = {
    _engine: {
        requestAnimationFrame: (callback: () => void) => void;
    };
    _queueNewFrame: (callback: () => void, requester?: NativeFrameRequester) => number;
};

// Structurally typed so the test does not have to import the full Scene module.
type TestScene = {
    render: () => void;
};

type TestCommandScopeEngine = {
    _commandBufferEncoder: {
        beginCommandScope: () => void;
        endCommandScope: () => void;
    };
    _wrapSceneRenderWithCommandScope: (scene: TestScene) => void;
};

describe("ThinNativeEngine", () => {
    describe("dynamic textures", () => {
        it("coerces fractional canvas dimensions before allocating native texture data", () => {
            const thinNativeEngine = Object.create(ThinNativeEngine.prototype) as ThinNativeEngine;
            const createRawTexture = vi.spyOn(thinNativeEngine, "createRawTexture").mockReturnValue({} as InternalTexture);

            thinNativeEngine.createDynamicTexture(3379.2, 102.4, false, 3);

            const [data, width, height] = createRawTexture.mock.calls[0];
            expect(width).toBe(3379);
            expect(height).toBe(102);
            expect(data).toBeInstanceOf(Uint8Array);
            expect(data?.byteLength).toBe(3379 * 102 * 4);
        });
    });

    describe("render loop", () => {
        it("returns the custom animation frame request id", () => {
            const thinNativeEngine = Object.create(ThinNativeEngine.prototype) as TestThinNativeEngine;
            let nativeRequestUsed = false;
            let requestedCallback: (() => void) | undefined;
            const renderFunction = () => {};

            thinNativeEngine._engine = {
                requestAnimationFrame: () => {
                    nativeRequestUsed = true;
                },
            };

            const requestId = thinNativeEngine._queueNewFrame(renderFunction, {
                requestAnimationFrame: (callback: () => void) => {
                    requestedCallback = callback;
                    return 23;
                },
            });

            expect(requestId).toBe(23);
            expect(requestedCallback).toBe(renderFunction);
            expect(nativeRequestUsed).toBe(false);
        });
    });

    describe("command scope", () => {
        const createEngineWithScope = (onSubmit?: () => void) => {
            const engine = Object.create(ThinNativeEngine.prototype) as TestCommandScopeEngine;
            let active = false;

            engine._commandBufferEncoder = {
                beginCommandScope: () => {
                    if (active) {
                        throw new Error("Command scope already active.");
                    }
                    active = true;
                },
                endCommandScope: () => {
                    if (!active) {
                        throw new Error("Command scope is not active.");
                    }
                    active = false;
                    onSubmit?.();
                },
            };

            return engine;
        };

        it("closes the command scope when the scene render throws, so later frames still work", () => {
            const engine = createEngineWithScope();
            const renderError = new Error("render failed");
            let shouldThrow = true;
            let renderCount = 0;

            const scene = {
                render: () => {
                    renderCount++;
                    if (shouldThrow) {
                        throw renderError;
                    }
                },
            };

            engine._wrapSceneRenderWithCommandScope(scene);

            // The original error must still reach the caller.
            expect(() => scene.render()).toThrow(renderError);

            // Without closing the scope, this second render would fail with
            // "Command scope already active." instead of running.
            shouldThrow = false;
            expect(() => scene.render()).not.toThrow();
            expect(renderCount).toBe(2);
        });

        it("does not let a failure closing the scope mask the render error", () => {
            const engine = createEngineWithScope(() => {
                throw new Error("submit failed");
            });
            const renderError = new Error("render failed");

            const scene = {
                render: () => {
                    throw renderError;
                },
            };

            engine._wrapSceneRenderWithCommandScope(scene);

            expect(() => scene.render()).toThrow(renderError);
        });

        it("propagates errors from closing the scope when the render succeeds", () => {
            const submitError = new Error("submit failed");
            const engine = createEngineWithScope(() => {
                throw submitError;
            });

            const scene = { render: () => {} };

            engine._wrapSceneRenderWithCommandScope(scene);

            expect(() => scene.render()).toThrow(submitError);
        });
    });

    describe("cube textures", () => {
        type NativeCubeEngine = ThinNativeEngine & {
            _engine: {
                loadCubeTexture: ReturnType<typeof vi.fn>;
                getTextureWidth: (texture: unknown) => number;
                getTextureHeight: (texture: unknown) => number;
            };
            _internalTexturesCache: InternalTexture[];
            _getUseSRGBBuffer: (useSRGBBuffer: boolean, noMipmap: boolean) => boolean;
            _doNotHandleContextLost: boolean;
            _createHardwareTexture: () => IHardwareTextureWrapper;
            _loadFileAsync: (url: string, scene?: unknown, useArrayBuffer?: boolean) => Promise<ArrayBuffer>;
            createCubeTexture: ThinNativeEngine["createCubeTexture"];
            createPrefilteredCubeTexture: ThinNativeEngine["createPrefilteredCubeTexture"];
        };

        const createCubeEngine = (textureSize = 128) => {
            RegisterNativeEngineCubeTexture();

            const hardwareResource = { id: "native-cube" };
            const engine = Object.create(ThinNativeEngine.prototype) as NativeCubeEngine;
            engine._internalTexturesCache = [];
            engine._doNotHandleContextLost = true;
            engine._getUseSRGBBuffer = () => false;
            engine._createHardwareTexture = () =>
                ({
                    underlyingResource: hardwareResource,
                    setUsage() {},
                    set() {},
                    reset() {},
                    release() {},
                }) as IHardwareTextureWrapper;
            engine._engine = {
                loadCubeTexture: vi.fn((_texture, _data, _generateMipMaps, _invertY, _srgb, onSuccess: (sp?: ArrayLike<number>) => void) => {
                    onSuccess(undefined);
                }),
                getTextureWidth: () => textureSize,
                getTextureHeight: () => textureSize,
            };
            engine._loadFileAsync = vi.fn(async () => new ArrayBuffer(8));

            return engine;
        };

        const flushAsync = async () => {
            // Nested native load paths chain thenables (_loadFileAsync -> container parse -> onLoad).
            for (let i = 0; i < 10; i++) {
                await Promise.resolve();
            }
        };

        it("syncs width/height/base sizes and notifies onLoadedObservable for a buffer cube load", async () => {
            const engine = createCubeEngine(256);
            const onLoad = vi.fn();
            let loadedObserverCalls = 0;

            const texture = engine.createCubeTexture(
                "container.ktx2",
                null,
                null,
                true,
                onLoad,
                null,
                undefined,
                null,
                false,
                0,
                0,
                null,
                undefined,
                false,
                new Uint8Array([1, 2, 3, 4])
            );

            texture.onLoadedObservable.add(() => {
                loadedObserverCalls++;
            });

            await flushAsync();

            expect(engine._engine.loadCubeTexture).toHaveBeenCalledTimes(1);
            expect(engine._loadFileAsync).not.toHaveBeenCalled();
            expect(texture.width).toBe(256);
            expect(texture.height).toBe(256);
            expect(texture.baseWidth).toBe(256);
            expect(texture.baseHeight).toBe(256);
            expect(texture.isReady).toBe(true);
            expect(onLoad).toHaveBeenCalledTimes(1);
            expect(loadedObserverCalls).toBe(1);
            expect(texture.onLoadedObservable.hasObservers()).toBe(false);
        });

        it("createPrefilteredCubeTexture sets CubePrefiltered and empty SP when createPolynomials is false", async () => {
            const engine = createCubeEngine(64);
            const onLoad = vi.fn();

            const texture = engine.createPrefilteredCubeTexture("prefiltered.ktx2", null, 0.8, 0, onLoad, null, undefined, null, false);

            await flushAsync();

            expect(texture._source).toBe(InternalTextureSource.CubePrefiltered);
            expect(texture._sphericalPolynomial).toBeTruthy();
            expect(onLoad).toHaveBeenCalledWith(texture);
            expect(texture.width).toBe(64);
            expect(texture.baseWidth).toBe(64);
        });
    });
});
