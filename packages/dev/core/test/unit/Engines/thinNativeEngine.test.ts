import { ThinNativeEngine } from "core/Engines/thinNativeEngine";
import { NullEngine } from "core/Engines/nullEngine";
import { RegisterNativeEngineCubeTexture } from "core/Engines/Native/Extensions/nativeEngine.cubeTexture.pure";
import { CubeTexture } from "core/Materials/Textures/cubeTexture";
import "core/Materials/Textures/baseTexture.polynomial";
import { InternalTextureSource, type InternalTexture } from "core/Materials/Textures/internalTexture";
import { type IHardwareTextureWrapper } from "core/Materials/Textures/hardwareTextureWrapper";
import { SphericalPolynomial } from "core/Maths/sphericalPolynomial";
import { CubeMapToSphericalPolynomialTools } from "core/Misc/HighDynamicRange/cubemapToSphericalPolynomial";
import { Scene } from "core/scene";
import { afterEach, describe, expect, it, onTestFinished, vi } from "vitest";

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
        afterEach(() => {
            vi.restoreAllMocks();
        });

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

        it.each([".ktx", ".ktx2"])("loads a public %s CubeTexture from the supplied buffer without fetching faces", async (extension) => {
            const engine = createCubeEngine(256);
            const bytes = new Uint8Array([99, 1, 2, 3, 88]);
            const buffer = new DataView(bytes.buffer, 1, 3);
            const onLoad = vi.fn();
            const cube = new CubeTexture(`environment${extension}`, engine, { buffer, onLoad });

            await flushAsync();

            expect(engine._loadFileAsync).not.toHaveBeenCalled();
            expect(engine._engine.loadCubeTexture).toHaveBeenCalledTimes(1);
            const data = engine._engine.loadCubeTexture.mock.calls[0][1] as Uint8Array[];
            expect(data).toHaveLength(1);
            expect(Array.from(data[0])).toEqual([1, 2, 3]);
            expect(data[0].buffer).toBe(bytes.buffer);
            expect(data[0].byteOffset).toBe(1);
            expect(cube.getSize()).toEqual({ width: 256, height: 256 });
            expect(cube.isReady()).toBe(true);
            expect(onLoad).toHaveBeenCalledTimes(1);
        });

        it.each([".ktx", ".ktx2"])("loads a public %s CubeTexture as one container URL", async (extension) => {
            const engine = createCubeEngine();
            const url = `environment${extension}?version=1`;
            const cube = new CubeTexture(url, engine);

            await flushAsync();

            expect(engine._loadFileAsync).toHaveBeenCalledTimes(1);
            expect(engine._loadFileAsync).toHaveBeenCalledWith(url, undefined, true);
            expect(engine._engine.loadCubeTexture.mock.calls[0][1]).toHaveLength(1);
            expect(cube.isReady()).toBe(true);
        });

        it.each([".ktx", ".ktx2"])("honors a forced %s extension without generating face URLs", async (forcedExtension) => {
            const engine = createCubeEngine();
            const cube = new CubeTexture("environment.bin", engine, { forcedExtension });

            await flushAsync();

            expect(engine._loadFileAsync).toHaveBeenCalledTimes(1);
            expect(engine._loadFileAsync).toHaveBeenCalledWith("environment.bin", undefined, true);
            expect(engine._engine.loadCubeTexture.mock.calls[0][1]).toHaveLength(1);
            expect(cube.isReady()).toBe(true);
        });

        it("prioritizes a supplied container buffer over generated face URLs", async () => {
            const engine = createCubeEngine();
            const buffer = new Uint8Array([1, 2, 3, 4]);
            const cube = new CubeTexture("cached-environment", engine, { buffer });

            await flushAsync();

            expect(engine._loadFileAsync).not.toHaveBeenCalled();
            expect(engine._engine.loadCubeTexture.mock.calls[0][1]).toEqual([buffer]);
            expect(cube.isReady()).toBe(true);
        });

        it("preserves explicit six-face loading for a KTX root", async () => {
            const engine = createCubeEngine();
            const files = ["px.ktx", "py.ktx", "pz.ktx", "nx.ktx", "ny.ktx", "nz.ktx"];
            const cube = new CubeTexture("skybox.ktx", engine, { files });

            await flushAsync();

            expect(engine._loadFileAsync).toHaveBeenCalledTimes(6);
            expect(engine._loadFileAsync).toHaveBeenNthCalledWith(1, "px.ktx", undefined, true);
            expect(engine._loadFileAsync).toHaveBeenNthCalledWith(2, "nx.ktx", undefined, true);
            expect(engine._engine.loadCubeTexture.mock.calls[0][1]).toHaveLength(6);
            expect(cube.isReady()).toBe(true);
        });

        it("makes an immediately cloned six-face environment ready without lazy Native readback", async () => {
            const engine = createCubeEngine(128);
            const sceneEngine = new NullEngine();
            const scene = new Scene(sceneEngine);
            onTestFinished(() => {
                scene.environmentTexture = null;
                scene.dispose();
                sceneEngine.dispose();
            });
            const computePolynomial = vi
                .spyOn(CubeMapToSphericalPolynomialTools, "ConvertCubeMapTextureToSphericalPolynomial")
                .mockReturnValue(new Promise<SphericalPolynomial>(() => {}));
            const cube = new CubeTexture("skybox", engine);
            const clone = cube.clone();
            scene.environmentTexture = clone;
            const texture = cube.getInternalTexture()!;
            const observer = vi.fn(() => ({
                size: clone.getSize(),
                polynomial: scene.environmentTexture!.sphericalPolynomial,
            }));
            clone.onLoadObservable.add(observer);

            expect(clone.getInternalTexture()).toBe(texture);
            expect(clone.isReady()).toBe(false);

            await flushAsync();

            expect(engine._loadFileAsync).toHaveBeenCalledTimes(6);
            expect(engine._loadFileAsync).toHaveBeenNthCalledWith(1, "skybox_px.jpg", undefined, true);
            expect(engine._loadFileAsync).toHaveBeenNthCalledWith(2, "skybox_nx.jpg", undefined, true);
            expect(engine._engine.loadCubeTexture.mock.calls[0][1]).toHaveLength(6);
            expect(clone.isReady()).toBe(true);
            expect(observer).toHaveBeenCalledTimes(1);
            expect(observer.mock.results[0].value).toEqual({
                size: { width: 128, height: 128 },
                polynomial: new SphericalPolynomial(),
            });
            expect(computePolynomial).not.toHaveBeenCalled();
            expect(texture._sphericalPolynomialPromise).toBeNull();
            expect(engine._internalTexturesCache).toEqual([texture]);
        });

        it.each([false, true])("falls back when Native supplies no prefiltered polynomial (createPolynomials=%s)", async (createPolynomials) => {
            const engine = createCubeEngine(64);
            const onLoad = vi.fn();

            const texture = engine.createPrefilteredCubeTexture("prefiltered.ktx2", null, 0.8, 0, onLoad, null, undefined, null, createPolynomials);

            await flushAsync();

            expect(texture._source).toBe(InternalTextureSource.CubePrefiltered);
            expect(texture._sphericalPolynomial).toEqual(new SphericalPolynomial());
            expect(onLoad).toHaveBeenCalledWith(texture);
            expect(texture.width).toBe(64);
            expect(texture.baseWidth).toBe(64);
        });

        it.each([false, true])("exposes complete prefiltered state to load observers (createPolynomials=%s)", async (createPolynomials) => {
            const engine = createCubeEngine(64);
            const coefficients = Array.from({ length: 27 }, (_, index) => index + 1);
            engine._engine.loadCubeTexture.mockImplementation((_texture, _data, _generateMipMaps, _invertY, _srgb, onSuccess: (sp: ArrayLike<number>) => void) => {
                onSuccess(coefficients);
            });
            const computePolynomial = vi.spyOn(CubeMapToSphericalPolynomialTools, "ConvertCubeMapTextureToSphericalPolynomial").mockReturnValue(null);
            const onLoad = vi.fn();
            const cube = new CubeTexture("prefiltered.ktx2", engine, { prefiltered: true, createPolynomials, onLoad });
            const texture = cube.getInternalTexture()!;
            const observer = vi.fn((loadedCube: CubeTexture) => ({
                source: loadedCube.getInternalTexture()?._source,
                ready: loadedCube.getInternalTexture()?.isReady,
                polynomial: loadedCube.sphericalPolynomial,
            }));
            cube.onLoadObservable.add(observer);

            await flushAsync();

            expect(observer).toHaveBeenCalledTimes(1);
            expect(observer.mock.calls[0][0]).toBe(cube);
            const observed = observer.mock.results[0].value;
            expect(observed).toEqual({
                source: InternalTextureSource.CubePrefiltered,
                ready: true,
                polynomial: expect.any(SphericalPolynomial),
            });
            const components = ["x", "y", "z", "xx", "yy", "zz", "yz", "zx", "xy"] as const;
            const observedCoefficients = components.flatMap((component) => observed.polynomial?.[component].asArray());
            expect(observedCoefficients).toEqual(createPolynomials ? coefficients : new Array(27).fill(0));
            expect(computePolynomial).not.toHaveBeenCalled();
            expect(texture._sphericalPolynomialPromise).toBeNull();
            expect(onLoad).toHaveBeenCalledTimes(1);
            expect(onLoad).toHaveBeenCalledWith(texture);
            expect(observer.mock.invocationCallOrder[0]).toBeLessThan(onLoad.mock.invocationCallOrder[0]);
            expect(texture.onLoadedObservable.hasObservers()).toBe(false);
            expect(engine._internalTexturesCache).toEqual([texture]);
        });
    });
});
