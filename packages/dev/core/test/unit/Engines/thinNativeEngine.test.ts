import { ThinNativeEngine } from "core/Engines/thinNativeEngine";
import { type NativeRenderTargetWrapper } from "core/Engines/Native/nativeRenderTargetWrapper";
import { NullEngine } from "core/Engines/nullEngine";
import { RegisterNativeEngineCubeTexture } from "core/Engines/Native/Extensions/nativeEngine.cubeTexture.pure";
import { CubeTexture } from "core/Materials/Textures/cubeTexture";
import "core/Materials/Textures/baseTexture.polynomial";
import { InternalTextureSource, type InternalTexture } from "core/Materials/Textures/internalTexture";
import { Constants } from "core/Engines/constants";
import { EngineStore } from "core/Engines/engineStore";
import { Logger } from "core/Misc/logger";
import { type IHardwareTextureWrapper } from "core/Materials/Textures/hardwareTextureWrapper";
import { SphericalPolynomial } from "core/Maths/sphericalPolynomial";
import { CubeMapToSphericalPolynomialTools } from "core/Misc/HighDynamicRange/cubemapToSphericalPolynomial";
import { Scene } from "core/scene";
import { RawTexture3D } from "core/Materials/Textures/rawTexture3D";
import { RawCubeTexture } from "core/Materials/Textures/rawCubeTexture";
import { AbstractEngine } from "core/Engines/abstractEngine";
import { RegisterEnginesExtensionsEngineRawTexture } from "core/Engines/Extensions/engine.rawTexture.pure";
import { _KTXTextureLoader } from "core/Materials/Textures/Loaders/ktxTextureLoader";
import { KhronosTextureContainer2 } from "core/Misc/khronosTextureContainer2";
import { FrameGraphRenderContext } from "core/FrameGraph/frameGraphRenderContext";
import { FrameGraphTextureManager } from "core/FrameGraph/frameGraphTextureManager";
import { HasStencilAspect, IsDepthTexture } from "core/Materials/Textures/textureHelper.functions";
import { _IblShadowsVoxelRenderer } from "core/Rendering/IBLShadows/iblShadowsVoxelRenderer.pure";
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";

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
            const engine = Object.assign(Object.create(ThinNativeEngine.prototype), {
                _internalTexturesCache: [],
                _doNotHandleContextLost: true,
                _getUseSRGBBuffer: () => false,
                _createHardwareTexture: (): IHardwareTextureWrapper => ({
                    underlyingResource: hardwareResource,
                    setUsage() {},
                    set() {},
                    reset() {},
                    release() {},
                }),
                _engine: {
                    loadCubeTexture: vi.fn((_texture, _data, _generateMipMaps, _invertY, _srgb, onSuccess: (sp?: ArrayLike<number>) => void) => {
                        onSuccess(undefined);
                    }),
                    getTextureWidth: () => textureSize,
                    getTextureHeight: () => textureSize,
                },
                _loadFileAsync: vi.fn(async () => new ArrayBuffer(8)),
            }) as NativeCubeEngine;

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
                "container.dds",
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

        it.each(["environment.dds", "environment.dds?version=1"])("loads a public DDS CubeTexture from a buffer at %s without fetching faces", async (url) => {
            const engine = createCubeEngine(256);
            const bytes = new Uint8Array([99, 1, 2, 3, 88]);
            const buffer = new DataView(bytes.buffer, 1, 3);
            const onLoad = vi.fn();
            const cube = new CubeTexture(url, engine, { buffer, onLoad });

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

        it.each([
            { extension: ".ktx", buffered: false },
            { extension: ".ktx", buffered: true },
            { extension: ".ktx2", buffered: false },
            { extension: ".ktx2", buffered: true },
        ])("keeps standard six-face routing for $extension (buffered=$buffered)", async ({ extension, buffered }) => {
            const engine = createCubeEngine();
            const url = `environment${extension}?version=1`;
            const buffer = buffered ? new Uint8Array([1, 2, 3, 4]) : undefined;
            const cube = new CubeTexture(url, engine, { buffer });

            await flushAsync();

            expect(engine._loadFileAsync).toHaveBeenCalledTimes(6);
            expect(engine._loadFileAsync).toHaveBeenNthCalledWith(1, `${url}_px.jpg`, undefined, true);
            expect(engine._loadFileAsync).toHaveBeenNthCalledWith(2, `${url}_nx.jpg`, undefined, true);
            expect(engine._loadFileAsync).not.toHaveBeenCalledWith(url, undefined, true);
            expect(engine._engine.loadCubeTexture.mock.calls[0][1]).toHaveLength(6);
            expect(cube.isReady()).toBe(true);
        });

        it("loads and rebuilds a public prefiltered DDS CubeTexture from its buffer without fetching", async () => {
            const engine = createCubeEngine(256);
            engine._doNotHandleContextLost = false;
            const bytes = new Uint8Array([99, 1, 2, 3, 88]);
            const buffer = new DataView(bytes.buffer, 1, 3);
            const onLoad = vi.fn();
            const cube = new CubeTexture("buffered-environment", engine, { prefiltered: true, forcedExtension: ".dds", buffer, onLoad });
            const texture = cube.getInternalTexture()!;

            await flushAsync();

            expect(engine._loadFileAsync).not.toHaveBeenCalled();
            expect(texture._buffer).toBe(buffer);
            expect(texture._source).toBe(InternalTextureSource.CubePrefiltered);
            expect(cube.getSize()).toEqual({ width: 256, height: 256 });
            expect(cube.isReady()).toBe(true);
            expect(onLoad).toHaveBeenCalledTimes(1);

            for (let rebuild = 0; rebuild < 2; rebuild++) {
                texture._rebuild();
                expect(cube.isReady()).toBe(false);

                await flushAsync();

                expect(cube.isReady()).toBe(true);
                expect(cube.getInternalTexture()).toBe(texture);
                expect(texture._buffer).toBe(buffer);
                expect(texture._source).toBe(InternalTextureSource.CubePrefiltered);
                expect(engine._internalTexturesCache).toEqual([texture]);
                expect(engine._loadFileAsync).not.toHaveBeenCalled();
            }

            expect(engine._engine.loadCubeTexture).toHaveBeenCalledTimes(3);
            for (const call of engine._engine.loadCubeTexture.mock.calls) {
                const data = call[1] as Uint8Array[];
                expect(data).toHaveLength(1);
                expect(Array.from(data[0])).toEqual([1, 2, 3]);
                expect(data[0].buffer).toBe(bytes.buffer);
                expect(data[0].byteOffset).toBe(buffer.byteOffset);
                expect(data[0].byteLength).toBe(buffer.byteLength);
            }
        });

        it.each([".ktx", ".ktx2"])("keeps standard face URLs for a forced %s extension", async (forcedExtension) => {
            const engine = createCubeEngine();
            const cube = new CubeTexture("environment.bin", engine, { forcedExtension });

            await flushAsync();

            expect(engine._loadFileAsync).toHaveBeenCalledTimes(6);
            expect(engine._loadFileAsync).toHaveBeenNthCalledWith(1, "environment.bin_px.jpg", undefined, true);
            expect(engine._loadFileAsync).toHaveBeenNthCalledWith(2, "environment.bin_nx.jpg", undefined, true);
            expect(engine._loadFileAsync).not.toHaveBeenCalledWith("environment.bin", undefined, true);
            expect(engine._engine.loadCubeTexture.mock.calls[0][1]).toHaveLength(6);
            expect(cube.isReady()).toBe(true);
        });

        it.each([".ktx", ".ktx2"])("rejects direct single-file %s cube loads, including supplied buffers", (extension) => {
            const engine = createCubeEngine();
            for (const buffer of [null, new Uint8Array([1, 2, 3, 4])]) {
                expect(() =>
                    engine.createCubeTexture(`environment${extension}`, null, null, false, null, null, undefined, null, false, 0, 0, null, undefined, false, buffer)
                ).toThrow("Cannot load cubemap because 6 files were not defined");
            }
            expect(engine._loadFileAsync).not.toHaveBeenCalled();
            expect(engine._engine.loadCubeTexture).not.toHaveBeenCalled();
        });

        it.each([".ktx", ".ktx2"])("rejects public prefiltered %s containers instead of adding a Native-only route", (extension) => {
            const engine = createCubeEngine();
            for (const forced of [false, true]) {
                for (const buffer of [undefined, new Uint8Array([1, 2, 3, 4])]) {
                    expect(
                        () =>
                            new CubeTexture(forced ? "environment.bin" : `environment${extension}`, engine, {
                                prefiltered: true,
                                forcedExtension: forced ? extension : undefined,
                                buffer,
                            })
                    ).toThrow("Cannot load cubemap because 6 files were not defined");
                }
            }
            expect(engine._loadFileAsync).not.toHaveBeenCalled();
            expect(engine._engine.loadCubeTexture).not.toHaveBeenCalled();
        });

        it("uses a supplied DDS buffer with a forced extension instead of fetching", async () => {
            const engine = createCubeEngine();
            const buffer = new Uint8Array([1, 2, 3, 4]);
            const cube = new CubeTexture("cached-environment", engine, { forcedExtension: ".dds", buffer });

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

            const texture = engine.createPrefilteredCubeTexture("prefiltered.dds", null, 0.8, 0, onLoad, null, undefined, null, createPolynomials);

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
            const cube = new CubeTexture("prefiltered.dds", engine, { prefiltered: true, createPolynomials, onLoad });
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

    describe("layered render targets", () => {
        beforeEach(() => {
            // Native enum constants are only read to be passed through to the mocked native engine.
            vi.stubGlobal("_native", { Engine: new Proxy({}, { get: (_target, name) => String(name) }) });
        });

        afterEach(() => {
            vi.restoreAllMocks();
            vi.unstubAllGlobals();
        });

        type FakeFramebuffer = { id: number; texture: unknown; layer: number | undefined; depth: boolean; stencil: boolean; samples: number };

        const createLayeredEngine = () => {
            let nextFramebufferId = 0;
            let nextTextureId = 0;
            const created: FakeFramebuffer[] = [];
            const released: FakeFramebuffer[] = [];
            const nativeEngine = {
                initializeTexture: vi.fn(),
                setTextureSampling: vi.fn(),
                getTextureWidth: () => 64,
                getTextureHeight: () => 64,
                createFrameBuffer: vi.fn(
                    (texture: unknown, _width: number, _height: number, stencil: boolean, depth: boolean, samples: number, layer?: number): FakeFramebuffer => {
                        const framebuffer = { id: nextFramebufferId++, texture, layer, depth, stencil, samples };
                        created.push(framebuffer);
                        return framebuffer;
                    }
                ),
            };
            const engine = Object.assign(Object.create(ThinNativeEngine.prototype), {
                _engine: nativeEngine,
                _caps: { textureFloatLinearFiltering: true, textureHalfFloatLinearFiltering: true, textureFloat: true, supportSRGBBuffers: true },
                _internalTexturesCache: [],
                _renderTargetWrapperCache: [],
                _getUseSRGBBuffer: () => false,
                _createHardwareTexture: (): IHardwareTextureWrapper => ({
                    underlyingResource: { id: `texture-${nextTextureId++}` },
                    setUsage() {},
                    set() {},
                    reset() {},
                    release() {},
                }),
                _setTextureSampling: () => {},
                _releaseFramebufferObjects: (framebuffer: FakeFramebuffer | null) => {
                    if (framebuffer) {
                        released.push(framebuffer);
                    }
                },
            }) as ThinNativeEngine;

            return { engine, nativeEngine, created, released };
        };

        const expectReleasedOnce = (released: FakeFramebuffer[], framebuffers: FakeFramebuffer[]) => {
            for (const framebuffer of framebuffers) {
                expect(released.filter((candidate) => candidate === framebuffer)).toHaveLength(1);
            }
        };

        it("rebuilds every layer framebuffer against a replaced wrapped native array texture", () => {
            const { engine, released } = createLayeredEngine();
            (engine as any)._engine.getTextureLayerCount = () => 3;
            const wrapped = engine.wrapNativeTexture({ id: "external-array" } as any);
            wrapped.is2DArray = true;
            wrapped.depth = 3;
            const rtWrapper = engine.createRenderTargetTexture(
                { width: 64, height: 64, layers: 3 },
                {
                    colorAttachment: wrapped,
                    generateDepthBuffer: true,
                }
            ) as NativeRenderTargetWrapper;
            const previous = [...(rtWrapper._framebuffers as unknown as FakeFramebuffer[])];
            const replacement = { id: "external-array-2" };

            engine.updateWrappedNativeTexture(wrapped, replacement as any);

            const rebuilt = rtWrapper._framebuffers as unknown as FakeFramebuffer[];
            expect(rebuilt.map((framebuffer) => [framebuffer.texture, framebuffer.layer, framebuffer.depth])).toEqual([0, 1, 2].map((layer) => [replacement, layer, true]));
            expectReleasedOnce(released, previous);
            expect(released).toHaveLength(previous.length);
            expect(rtWrapper._framebuffer).toBe(rebuilt[0]);

            const bind = vi.spyOn(engine as any, "_bindUnboundFramebuffer").mockImplementation(() => {});
            vi.spyOn(engine, "setViewport").mockImplementation(() => {});
            for (const layer of [0, 1, 2]) {
                engine.bindFramebuffer(rtWrapper, undefined, undefined, undefined, undefined, 0, layer);
                const bound = bind.mock.lastCall![0] as unknown as FakeFramebuffer;
                expect(bound).toBe(rebuilt[layer]);
                expect(bound.texture).toBe(replacement);
                expect(bound.layer).toBe(layer);
                expect(released).not.toContain(bound);
            }
        });
    });
    describe("render target lifetime and layout", () => {
        beforeEach(() => {
            // Native enum constants are only read to be passed through to the mocked native engine.
            vi.stubGlobal("_native", { Engine: new Proxy({}, { get: (_target, name) => String(name) }) });
        });

        afterEach(() => {
            vi.restoreAllMocks();
            vi.unstubAllGlobals();
        });

        type FakeFramebuffer = {
            id: number;
            colors: unknown[];
            layers: number[] | undefined;
            depth: boolean;
            stencil: boolean;
            samples: number;
            explicitDepth: unknown;
            multi: boolean;
        };

        const createEngine = (options: { multiFrameBuffer?: boolean; multisampledMipmaps?: boolean } = {}) => {
            let nextFramebufferId = 0;
            let nextTextureId = 0;
            const created: FakeFramebuffer[] = [];
            const released: FakeFramebuffer[] = [];
            const releasedTextures: unknown[] = [];
            const commands: unknown[][] = [];
            const nativeEngine: Record<string, any> = {
                supportsMultisampledMipmaps: options.multisampledMipmaps,
                initializeTexture: vi.fn(),
                loadRawTexture: vi.fn(),
                loadRawTexture3D: vi.fn(),
                updateTextureData: vi.fn(),
                deleteTexture: vi.fn(),
                getTextureWidth: () => 64,
                getTextureHeight: () => 64,
                createFrameBuffer: vi.fn(
                    (texture: unknown, _width: number, _height: number, stencil: boolean, depth: boolean, samples: number, layer?: number): FakeFramebuffer => {
                        const framebuffer = {
                            id: nextFramebufferId++,
                            colors: texture ? [texture] : [],
                            layers: layer === undefined ? undefined : [layer],
                            depth,
                            stencil,
                            samples,
                            explicitDepth: undefined,
                            multi: false,
                        };
                        created.push(framebuffer);
                        return framebuffer;
                    }
                ),
            };
            if (options.multiFrameBuffer !== false) {
                nativeEngine.createMultiFrameBuffer = vi.fn(
                    (colors: unknown[], _width: number, _height: number, stencil: boolean, depth: boolean, samples: number, layers?: number[], explicitDepth?: unknown) => {
                        const framebuffer = { id: nextFramebufferId++, colors, layers, depth, stencil, samples, explicitDepth, multi: true };
                        created.push(framebuffer);
                        return framebuffer;
                    }
                );
            }
            let currentCommand: unknown[] = [];
            const engine = Object.assign(Object.create(ThinNativeEngine.prototype), {
                _engine: nativeEngine,
                _caps: { textureFloatLinearFiltering: true, textureHalfFloatLinearFiltering: true, textureFloat: true, supportSRGBBuffers: true },
                _internalTexturesCache: [],
                _renderTargetWrapperCache: [],
                _frameGraphFramebufferRefCount: new Map(),
                _doNotHandleContextLost: false,
                _getUseSRGBBuffer: (useSRGBBuffer: boolean) => useSRGBBuffer,
                _createHardwareTexture: (): IHardwareTextureWrapper => {
                    const resource = { id: `texture-${nextTextureId++}` };
                    return {
                        underlyingResource: resource,
                        setUsage() {},
                        set() {},
                        reset() {},
                        release() {
                            releasedTextures.push(resource);
                        },
                    };
                },
                _setTextureSampling: () => {},
                _loadFile: vi.fn((_url: string, onSuccess: (data: ArrayBuffer) => void) => onSuccess(new ArrayBuffer(8))),
                _commandBufferEncoder: {
                    startEncodingCommand: (command: unknown) => {
                        currentCommand = [command];
                    },
                    encodeCommandArgAsNativeData: (arg: unknown) => currentCommand.push(arg),
                    encodeCommandArgAsUInt32: (arg: unknown) => currentCommand.push(arg),
                    finishEncodingCommand: () => commands.push(currentCommand),
                },
                _boundUniforms: [{ id: "uniform-0" }],
            }) as ThinNativeEngine;
            // Record releases but keep the real frame graph reference counting.
            const releaseFramebuffer = ThinNativeEngine.prototype._releaseFramebufferObjects;
            (engine as any)._releaseFramebufferObjects = function (framebuffer: FakeFramebuffer | null) {
                if (framebuffer) {
                    released.push(framebuffer);
                }
                releaseFramebuffer.call(this, framebuffer as any);
            };
            const bind = vi.spyOn(engine as any, "_bindUnboundFramebuffer").mockImplementation(() => {});
            const setViewport = vi.spyOn(engine, "setViewport").mockImplementation(() => {});
            const bound = () => bind.mock.lastCall![0] as unknown as FakeFramebuffer;

            return { engine, nativeEngine, created, released, releasedTextures, commands, bound, setViewport };
        };

        const resourceOf = (texture: InternalTexture) => texture._hardwareTexture!.underlyingResource;
        const flushAsync = async () => {
            for (let i = 0; i < 5; i++) {
                await Promise.resolve();
            }
        };

        it("falls back to a single-attachment framebuffer when the runtime lacks createMultiFrameBuffer", () => {
            const { engine, nativeEngine } = createEngine({ multiFrameBuffer: false });
            const warn = vi.spyOn(Logger, "Warn").mockImplementation(() => {});

            const rtWrapper = engine.createMultipleRenderTarget({ width: 64, height: 64 }, { textureCount: 2 }) as NativeRenderTargetWrapper;

            expect(nativeEngine.createFrameBuffer).toHaveBeenCalledTimes(1);
            expect((rtWrapper._framebuffer as unknown as FakeFramebuffer).colors).toEqual([resourceOf(rtWrapper.textures![0])]);
            expect(warn).toHaveBeenCalledWith(expect.stringContaining("createMultiFrameBuffer is not supported"), 1);
        });

        it("keeps a depth buffer for an MRT that requests a depth texture", () => {
            const { engine } = createEngine();
            vi.spyOn(Logger, "Warn").mockImplementation(() => {});

            const rtWrapper = engine.createMultipleRenderTarget(
                { width: 64, height: 64 },
                { textureCount: 2, generateDepthBuffer: false, generateDepthTexture: true }
            ) as NativeRenderTargetWrapper;

            const framebuffer = rtWrapper._framebuffer as unknown as FakeFramebuffer;
            expect(framebuffer.colors).toEqual(rtWrapper.textures!.map(resourceOf));
            expect(framebuffer.depth).toBe(true);
        });

        it("only allocates mips for multisampled render targets when the runtime supports it", () => {
            for (const supported of [false, true]) {
                const { engine, nativeEngine } = createEngine({ multisampledMipmaps: supported });
                engine._createInternalTexture({ width: 64, height: 64 }, { generateMipMaps: true, samples: 4 });
                expect(nativeEngine.initializeTexture.mock.lastCall![3]).toBe(supported);
            }
        });

        it("rebuilds the shared frame graph framebuffer when a non-primary attachment changes", () => {
            const { engine, bound } = createEngine();
            const primary = engine._createInternalTexture({ width: 64, height: 64 }, {});
            const secondaryA = engine._createInternalTexture({ width: 64, height: 64 }, {});
            const secondaryB = engine._createInternalTexture({ width: 64, height: 64 }, {});
            const createFrameGraphTarget = (secondary: InternalTexture) => {
                const rtWrapper = engine.createMultipleRenderTarget({ width: 64, height: 64 }, { textureCount: 2, dontCreateTextures: true }) as NativeRenderTargetWrapper;
                rtWrapper.setTexture(primary, 0, false);
                rtWrapper.setTexture(secondary, 1, false);
                return rtWrapper;
            };

            const retained = createFrameGraphTarget(secondaryA);
            engine.bindFramebuffer(retained);
            const first = bound();
            const changed = createFrameGraphTarget(secondaryA);
            engine.bindFramebuffer(changed);
            expect(bound()).toBe(first);
            changed.setTexture(secondaryB, 1, false);
            engine.bindFramebuffer(changed);

            expect(bound()).not.toBe(first);
            expect(bound().colors).toEqual([resourceOf(primary), resourceOf(secondaryB)]);
            engine.bindFramebuffer(retained);
            expect(bound()).toBe(first);
            expect(bound().colors).toEqual([resourceOf(primary), resourceOf(secondaryA)]);
        });

        it("rebuilds a flat frame graph framebuffer when its depth attachment changes", () => {
            const { engine, bound } = createEngine();
            const color = engine._createInternalTexture({ width: 64, height: 64 }, {});
            const depth1 = engine._createInternalTexture({ width: 64, height: 64 }, {});
            const depth2 = engine._createInternalTexture({ width: 64, height: 64 }, {});
            const rtWrapper = engine.createMultipleRenderTarget({ width: 64, height: 64 }, { textureCount: 1, dontCreateTextures: true }) as NativeRenderTargetWrapper;
            rtWrapper.setTexture(color, 0, false);
            rtWrapper.setDepthStencilTexture(depth1, false);

            engine.bindFramebuffer(rtWrapper);
            const first = bound();
            expect(first.explicitDepth).toBe(resourceOf(depth1));

            rtWrapper.setDepthStencilTexture(depth2);
            engine.bindFramebuffer(rtWrapper);

            expect(bound()).not.toBe(first);
            expect(bound().explicitDepth).toBe(resourceOf(depth2));
        });

        it("keeps every flat MRT color attachment when adding a depth texture", () => {
            const { engine, bound } = createEngine();
            const rtWrapper = engine.createMultipleRenderTarget({ width: 64, height: 64 }, { textureCount: 2, generateDepthBuffer: false }) as NativeRenderTargetWrapper;

            rtWrapper.createDepthStencilTexture(0, false, false, 1);
            engine.bindFramebuffer(rtWrapper);

            expect(bound().colors).toEqual(rtWrapper.textures!.map(resourceOf));
            expect(bound().explicitDepth).toBe(resourceOf(rtWrapper._depthStencilTexture!));
        });

        it("rebuilds a depth-attached flat MRT when a color attachment changes", () => {
            const { engine, bound } = createEngine();
            const rtWrapper = engine.createMultipleRenderTarget({ width: 64, height: 64 }, { textureCount: 2, generateDepthBuffer: false }) as NativeRenderTargetWrapper;
            const firstColor = rtWrapper.textures![0];
            const replacement = engine._createInternalTexture({ width: 64, height: 64 }, {});
            rtWrapper.createDepthStencilTexture(0, false, false, 1);
            const depth = rtWrapper._depthStencilTexture!;

            engine.bindFramebuffer(rtWrapper);
            const firstFramebuffer = bound();
            rtWrapper.setTexture(replacement, 1);
            engine.bindFramebuffer(rtWrapper);

            expect(bound()).not.toBe(firstFramebuffer);
            expect(bound().colors).toEqual([resourceOf(firstColor), resourceOf(replacement)]);
            expect(bound().explicitDepth).toBe(resourceOf(depth));
        });

        it("invalidates cached volume framebuffers when the color texture changes", () => {
            const { engine, released, bound } = createEngine();
            const rtWrapper = engine.createRenderTargetTexture({ width: 64, height: 64, depth: 4 }, {}) as NativeRenderTargetWrapper;
            const replacement = engine._createInternalTexture({ width: 64, height: 64, depth: 4 }, {});

            engine.bindFramebuffer(rtWrapper, undefined, 32, 32, true, 1, 2);
            const first = bound();
            rtWrapper.setTexture(replacement, 0, false);
            engine.bindFramebuffer(rtWrapper, undefined, 32, 32, true, 1, 2);

            expect(released).toContain(first);
            expect(bound()).not.toBe(first);
            expect(bound().colors).toEqual([resourceOf(replacement)]);
        });

        it("binds explicit depth to volume slices and rebuilds it for sample changes", () => {
            const { engine, released, bound } = createEngine();
            const depthTarget = engine.createRenderTargetTexture({ width: 64, height: 64 }, { generateDepthBuffer: false }) as NativeRenderTargetWrapper;
            const depth = depthTarget.createDepthStencilTexture();
            const rtWrapper = engine.createRenderTargetTexture({ width: 64, height: 64, depth: 4 }, { generateDepthBuffer: false }) as NativeRenderTargetWrapper;
            rtWrapper.setDepthStencilTexture(depth, false);

            engine.bindFramebuffer(rtWrapper, undefined, undefined, undefined, true, 0, 2);
            const first = bound();
            expect(first.multi).toBe(true);
            expect(first.colors).toEqual([resourceOf(rtWrapper.texture!)]);
            expect(first.layers).toEqual([2]);
            expect(first.explicitDepth).toBe(resourceOf(depth));

            engine.updateRenderTargetTextureSampleCount(rtWrapper, 4);
            engine.bindFramebuffer(rtWrapper, undefined, undefined, undefined, true, 0, 2);

            expect(released).toContain(first);
            expect(bound()).not.toBe(first);
            expect(bound().samples).toBe(4);
            expect(bound().explicitDepth).toBe(resourceOf(depth));
            expect(depth.samples).toBe(4);
            expect(() => engine.bindFramebuffer(rtWrapper, undefined, 32, 32, true, 1, 2)).toThrow("only support rendering to mip 0");

            const { engine: legacyEngine } = createEngine({ multiFrameBuffer: false });
            const legacyVolume = legacyEngine.createRenderTargetTexture({ width: 64, height: 64, depth: 4 }, {}) as NativeRenderTargetWrapper;
            const unsupportedDepth = legacyEngine._createInternalTexture({ width: 64, height: 64 }, {});
            unsupportedDepth.samples = 1;
            expect(() => legacyVolume.setDepthStencilTexture(unsupportedDepth, false)).toThrow("require createMultiFrameBuffer support");
            expect(legacyVolume._depthStencilTexture).toBeNull();
        });

        it("invalidates cached volume slices when depth is created or recreated on the volume", () => {
            const { engine, released, bound } = createEngine();
            const rtWrapper = engine.createRenderTargetTexture({ width: 64, height: 64, depth: 4 }, { generateDepthBuffer: false }) as NativeRenderTargetWrapper;

            // Cache a slice framebuffer and a nonzero-mip framebuffer before any depth exists.
            engine.bindFramebuffer(rtWrapper, undefined, undefined, undefined, true, 0, 1);
            const noDepth = bound();
            expect(noDepth.explicitDepth).toBeUndefined();
            engine.bindFramebuffer(rtWrapper, undefined, 32, 32, true, 1, 1);
            const noDepthMip = bound();

            const depth = rtWrapper.createDepthStencilTexture();
            expect(released).toContain(noDepth);
            expect(released).toContain(noDepthMip);
            engine.bindFramebuffer(rtWrapper, undefined, undefined, undefined, true, 0, 1);
            const withDepth = bound();
            expect(withDepth).not.toBe(noDepth);
            expect(withDepth.multi).toBe(true);
            expect(withDepth.layers).toEqual([1]);
            expect(withDepth.explicitDepth).toBe(resourceOf(depth));
            // A depth texture created on the volume has no native handle yet, so the first slice must request depth
            // for the native side to allocate and alias it.
            expect(withDepth.depth).toBe(true);
            expect(withDepth.stencil).toBe(false);
            // The previously cached nonzero mip must not bypass the explicit-depth mip rejection.
            expect(() => engine.bindFramebuffer(rtWrapper, undefined, 32, 32, true, 1, 1)).toThrow("only support rendering to mip 0");

            const recreated = rtWrapper.createDepthStencilTexture(0, true, true);
            expect(recreated).not.toBe(depth);
            expect(released).toContain(withDepth);
            engine.bindFramebuffer(rtWrapper, undefined, undefined, undefined, true, 0, 1);
            expect(bound()).not.toBe(withDepth);
            expect(bound().explicitDepth).toBe(resourceOf(recreated));
            expect(bound().stencil).toBe(true);
        });

        it("rebuilds a layered MRT when its faces, attachments or explicit depth change", () => {
            const { engine, bound } = createEngine();
            const rtWrapper = engine.createMultipleRenderTarget(
                { width: 64, height: 64 },
                { textureCount: 2, targetTypes: [Constants.TEXTURE_CUBE_MAP, Constants.TEXTURE_2D], faceIndex: [0, 0], layerIndex: [0, 0] }
            ) as NativeRenderTargetWrapper;

            engine.bindFramebuffer(rtWrapper);
            const first = bound();
            expect(first.layers).toEqual([0, 0]);
            engine.bindFramebuffer(rtWrapper);
            expect(bound()).toBe(first);

            rtWrapper.setLayerAndFaceIndex(0, 0, 3);
            engine.bindFramebuffer(rtWrapper);
            expect(bound().layers).toEqual([3, 0]);

            const replacement = engine._createInternalTexture({ width: 64, height: 64 }, {});
            rtWrapper.setTexture(replacement, 1, false);
            engine.bindFramebuffer(rtWrapper);
            expect(bound().colors).toEqual([resourceOf(rtWrapper.textures![0]), resourceOf(replacement)]);
            expect(bound().layers).toEqual([3, 0]);

            const depthTexture = engine._createInternalTexture({ width: 64, height: 64 }, {});
            rtWrapper._depthStencilTexture = depthTexture;
            engine.bindFramebuffer(rtWrapper);
            expect(bound().explicitDepth).toBe(resourceOf(depthTexture));
            expect(bound().depth).toBe(true);
        });

        it("allocates volume storage for TEXTURE_3D MRT attachments and renders the selected slice", () => {
            const { engine, nativeEngine, bound } = createEngine();
            const rtWrapper = engine.createMultipleRenderTarget(
                { width: 64, height: 64 },
                { textureCount: 1, targetTypes: [Constants.TEXTURE_3D], layerCounts: [4] }
            ) as NativeRenderTargetWrapper;

            const texture = rtWrapper.textures![0];
            expect(texture.is3D).toBe(true);
            expect(texture.depth).toBe(4);
            expect(nativeEngine.initializeTexture.mock.lastCall!.slice(9)).toEqual([4, true]);

            rtWrapper.setLayerAndFaceIndex(0, 2);
            engine.bindFramebuffer(rtWrapper);
            expect(bound().colors).toEqual([resourceOf(texture)]);
            expect(bound().layers).toEqual([2]);
        });

        it("defers voxelization slab attachments to the shared voxel grid without allocating placeholders", () => {
            const { engine, nativeEngine, bound } = createEngine();
            const resolution = 16;
            const drawBuffers = 4;
            const numSlabs = resolution / drawBuffers;
            const voxelGrid = engine.createRenderTargetTexture(
                { width: resolution, height: resolution, depth: resolution },
                { generateMipMaps: false, generateDepthBuffer: false, type: Constants.TEXTURETYPE_UNSIGNED_BYTE, format: Constants.TEXTUREFORMAT_R }
            ).texture!;
            nativeEngine.initializeTexture.mockClear();

            const slabs = Array.from({ length: numSlabs }, (_, slab) => {
                const rtWrapper = engine.createMultipleRenderTarget(
                    { width: resolution, height: resolution, depth: resolution },
                    { textureCount: drawBuffers, ..._IblShadowsVoxelRenderer._CreateVoxelSlabMRTOptions(drawBuffers, resolution, slab) },
                    true
                ) as NativeRenderTargetWrapper;
                for (let i = 0; i < drawBuffers; i++) {
                    rtWrapper.setTexture(voxelGrid, i, false);
                }
                return rtWrapper;
            });
            expect(nativeEngine.initializeTexture).not.toHaveBeenCalled();

            slabs.forEach((rtWrapper, slab) => {
                engine.bindFramebuffer(rtWrapper);
                expect(bound().colors).toEqual(new Array(drawBuffers).fill(resourceOf(voxelGrid)));
                expect(bound().layers).toEqual(Array.from({ length: drawBuffers }, (_, i) => slab * drawBuffers + i));
            });
            expect(nativeEngine.initializeTexture).not.toHaveBeenCalled();
        });

        it("keeps cube and array MRT attachments layered when the sample count changes", () => {
            const { engine, nativeEngine, bound } = createEngine();
            const rtWrapper = engine.createMultipleRenderTarget(
                { width: 64, height: 64 },
                { textureCount: 2, targetTypes: [Constants.TEXTURE_CUBE_MAP, Constants.TEXTURE_2D_ARRAY], layerCounts: [0, 3], faceIndex: [2, 0], layerIndex: [0, 1] }
            ) as NativeRenderTargetWrapper;
            engine.bindFramebuffer(rtWrapper);
            nativeEngine.initializeTexture.mockClear();

            engine.updateMultipleRenderTargetTextureSampleCount(rtWrapper, 4);

            expect(nativeEngine.initializeTexture.mock.calls.map((call: unknown[]) => call.slice(7))).toEqual([
                [4, true, 0, false],
                [4, false, 3, false],
            ]);
            engine.bindFramebuffer(rtWrapper);
            expect(bound().layers).toEqual([2, 1]);
            expect(bound().samples).toBe(4);
        });

        it("reattaches a recreated sampleable depth array when a layered render target changes samples", () => {
            const { engine, created, releasedTextures } = createEngine();
            const rtWrapper = engine.createRenderTargetTexture({ width: 64, height: 64, layers: 3 }, { generateDepthBuffer: false }) as NativeRenderTargetWrapper;
            rtWrapper.createDepthStencilTexture(0, false, false, 1);
            const depthTexture = rtWrapper._depthStencilTexture!;
            const previousDepth = resourceOf(depthTexture);
            created.length = 0;

            engine.updateRenderTargetTextureSampleCount(rtWrapper, 4);

            const newDepth = resourceOf(depthTexture);
            expect(newDepth).not.toBe(previousDepth);
            expect(releasedTextures).toContain(previousDepth);
            expect(depthTexture.samples).toBe(4);
            const framebuffers = rtWrapper._framebuffers as unknown as FakeFramebuffer[];
            expect(framebuffers.map((framebuffer) => [framebuffer.layers, framebuffer.explicitDepth, framebuffer.samples])).toEqual(
                [0, 1, 2].map((layer) => [[layer], newDepth, 4])
            );
        });

        it("preserves 2D-array layers across render target rebuilding", () => {
            const { engine, nativeEngine, bound } = createEngine();
            const rtWrapper = engine.createRenderTargetTexture({ width: 64, height: 64, layers: 3 }, {}) as NativeRenderTargetWrapper;
            const texture = rtWrapper.texture!;
            nativeEngine.initializeTexture.mockClear();

            (rtWrapper as any)._rebuild();
            engine.bindFramebuffer(rtWrapper, undefined, undefined, undefined, undefined, undefined, 2);

            expect(rtWrapper.texture).toBe(texture);
            expect(rtWrapper.layers).toBe(3);
            expect(rtWrapper.depth).toBe(0);
            expect(nativeEngine.initializeTexture.mock.lastCall!.slice(8)).toEqual([false, 3, false]);
            expect(bound().layers).toEqual([2]);
        });

        it("keeps every 2D-array framebuffer after removing its depth texture", () => {
            const { engine, bound } = createEngine();
            const rtWrapper = engine.createRenderTargetTexture({ width: 64, height: 64, layers: 3 }, { generateDepthBuffer: false }) as NativeRenderTargetWrapper;
            rtWrapper.createDepthStencilTexture(0, false, false, 1);

            rtWrapper.setDepthStencilTexture(null);
            engine.bindFramebuffer(rtWrapper, undefined, undefined, undefined, undefined, undefined, 2);

            expect(rtWrapper._framebuffers).toHaveLength(3);
            expect(bound().layers).toEqual([2]);
            expect(bound().explicitDepth).toBeUndefined();
        });

        it("recreates an owned MRT depth texture when its sample count changes", () => {
            const { engine, bound, releasedTextures } = createEngine();
            const rtWrapper = engine.createMultipleRenderTarget({ width: 64, height: 64 }, { textureCount: 2, generateDepthBuffer: false }) as NativeRenderTargetWrapper;
            rtWrapper.createDepthStencilTexture(0, false, false, 1);
            const depth = rtWrapper._depthStencilTexture!;
            const previousDepth = resourceOf(depth);

            engine.updateMultipleRenderTargetTextureSampleCount(rtWrapper, 4);
            engine.bindFramebuffer(rtWrapper);

            expect(depth.samples).toBe(4);
            expect(resourceOf(depth)).not.toBe(previousDepth);
            expect(releasedTextures).toContain(previousDepth);
            expect(bound().samples).toBe(4);
            expect(bound().explicitDepth).toBe(resourceOf(depth));
        });

        it("rejects changing MRT samples while its depth texture is shared", () => {
            const { engine } = createEngine();
            const source = engine.createMultipleRenderTarget({ width: 64, height: 64 }, { textureCount: 1 }) as NativeRenderTargetWrapper;
            const destination = engine.createMultipleRenderTarget({ width: 64, height: 64 }, { textureCount: 1 }) as NativeRenderTargetWrapper;
            source.createDepthStencilTexture(0, false, false, 1);
            source.shareDepth(destination);

            expect(() => engine.updateMultipleRenderTargetTextureSampleCount(destination, 4)).toThrow("cannot change samples while using a shared depth texture");
            expect(destination.samples).toBe(1);
            expect(destination.textures![0].samples).toBe(1);
        });

        it("rejects changing single-target samples while its depth texture is shared", () => {
            const { engine, nativeEngine } = createEngine();
            const source = engine.createRenderTargetTexture({ width: 64, height: 64 }, { generateDepthBuffer: false }) as NativeRenderTargetWrapper;
            const destination = engine.createRenderTargetTexture({ width: 64, height: 64 }, { generateDepthBuffer: false }) as NativeRenderTargetWrapper;
            source.createDepthStencilTexture(0, false, false, 1);
            source.shareDepth(destination);
            const colorResource = resourceOf(destination.texture!);
            const depthResource = resourceOf(source._depthStencilTexture!);
            nativeEngine.initializeTexture.mockClear();

            expect(() => engine.updateRenderTargetTextureSampleCount(destination, 4)).toThrow(
                "updateRenderTargetTextureSampleCount: cannot change samples while using a shared depth texture."
            );
            expect(destination.samples).toBe(1);
            expect(destination.texture!.samples).toBe(1);
            expect(resourceOf(destination.texture!)).toBe(colorResource);
            expect(resourceOf(source._depthStencilTexture!)).toBe(depthResource);
            expect(nativeEngine.initializeTexture).not.toHaveBeenCalled();
        });

        it("reattaches shared depth to an ordinary render target", () => {
            const { engine, bound } = createEngine();
            const source = engine.createRenderTargetTexture({ width: 64, height: 64 }, { generateDepthBuffer: false }) as NativeRenderTargetWrapper;
            const destination = engine.createRenderTargetTexture({ width: 64, height: 64 }, { generateDepthBuffer: false }) as NativeRenderTargetWrapper;
            source.createDepthStencilTexture(0, false, false, 1);
            destination.createDepthStencilTexture(0, false, false, 1);
            const sharedDepth = source._depthStencilTexture!;

            source.shareDepth(destination);
            engine.bindFramebuffer(destination);

            expect(destination._depthStencilTexture).toBe(sharedDepth);
            expect(bound().colors).toEqual([resourceOf(destination.texture!)]);
            expect(bound().explicitDepth).toBe(resourceOf(sharedDepth));
        });

        it("releases cached per-mip framebuffers when the texture is recreated for a new sample count", () => {
            const { engine, released, bound } = createEngine();
            const rtWrapper = engine.createRenderTargetCubeTexture(64, { generateMipMaps: true }) as NativeRenderTargetWrapper;

            engine.bindFramebuffer(rtWrapper, 0, undefined, undefined, undefined, 1);
            const beforeMip = bound();
            engine.updateRenderTargetTextureSampleCount(rtWrapper, 4);
            engine.bindFramebuffer(rtWrapper, 0, undefined, undefined, undefined, 1);

            expect(released).toContain(beforeMip);
            expect(bound()).not.toBe(beforeMip);
            expect(bound().samples).toBe(4);
        });

        it("preserves authored cube mip storage across sample changes and rebuilding", () => {
            const { engine, nativeEngine } = createEngine({ multisampledMipmaps: true });
            const rtWrapper = engine.createRenderTargetCubeTexture(64, { createMipMaps: true, generateMipMaps: false }) as NativeRenderTargetWrapper;
            const texture = rtWrapper.texture!;

            engine.updateRenderTargetTextureSampleCount(rtWrapper, 4);
            expect(nativeEngine.initializeTexture.mock.lastCall![3]).toBe(true);
            expect(texture.generateMipMaps).toBe(false);

            (rtWrapper as any)._rebuild();
            expect(rtWrapper.texture).toBe(texture);
            expect(nativeEngine.initializeTexture.mock.lastCall![3]).toBe(true);
            expect(engine._hasMipStorage(texture)).toBe(true);
        });

        it("preserves allocation-only mip storage when rebuilding an MRT", () => {
            const { engine, nativeEngine } = createEngine();
            const rtWrapper = engine.createMultipleRenderTarget(
                { width: 64, height: 64 },
                { textureCount: 1, createMipMaps: true, generateMipMaps: false }
            ) as NativeRenderTargetWrapper;
            const texture = rtWrapper.textures![0];
            nativeEngine.initializeTexture.mockClear();

            (rtWrapper as any)._rebuild();

            expect(rtWrapper.textures![0]).toBe(texture);
            expect(texture.generateMipMaps).toBe(false);
            expect(engine._hasMipStorage(texture)).toBe(true);
            expect(nativeEngine.initializeTexture.mock.lastCall![3]).toBe(true);
        });

        it("rebuilds a multisampled render target with matching color and explicit depth samples", () => {
            const { engine, nativeEngine } = createEngine();
            const rtWrapper = engine.createRenderTargetTexture({ width: 64, height: 64 }, { generateDepthBuffer: false, samples: 4 }) as NativeRenderTargetWrapper;
            rtWrapper.createDepthStencilTexture(0, false, false, 4);
            nativeEngine.initializeTexture.mockClear();
            nativeEngine.createFrameBuffer.mockClear();
            nativeEngine.createMultiFrameBuffer.mockClear();

            (rtWrapper as any)._rebuild();

            const colorSamples = new Map(nativeEngine.initializeTexture.mock.calls.map((call: unknown[]) => [call[0], call[7]]));
            expect([...colorSamples.values()]).toEqual([4]);
            for (const call of nativeEngine.createFrameBuffer.mock.calls) {
                if (call[0]) {
                    expect(colorSamples.get(call[0])).toBe(call[5]);
                }
            }
            for (const call of nativeEngine.createMultiFrameBuffer.mock.calls) {
                for (const color of call[0]) {
                    expect(colorSamples.get(color)).toBe(call[5]);
                }
            }
        });

        it("rebuilds a multisampled MRT with matching samples and per-attachment sRGB", () => {
            const { engine, nativeEngine } = createEngine();
            const rtWrapper = engine.createMultipleRenderTarget(
                { width: 64, height: 64 },
                { textureCount: 2, samples: 4, useSRGBBuffers: [false, true], generateDepthBuffer: false }
            ) as NativeRenderTargetWrapper;
            rtWrapper.createDepthStencilTexture(0, false, false, 4);
            nativeEngine.initializeTexture.mockClear();
            nativeEngine.createMultiFrameBuffer.mockClear();

            (rtWrapper as any)._rebuild();

            const allocations = nativeEngine.initializeTexture.mock.calls.map((call: unknown[]) => ({ resource: call[0], srgb: call[6], samples: call[7] }));
            expect(allocations.map(({ srgb, samples }) => [srgb, samples])).toEqual([
                [false, 4],
                [true, 4],
            ]);
            const colorSamples = new Map(allocations.map(({ resource, samples }) => [resource, samples]));
            for (const call of nativeEngine.createMultiFrameBuffer.mock.calls) {
                for (const color of call[0]) {
                    expect(colorSamples.get(color)).toBe(call[5]);
                }
            }
        });

        it("preserves cube auto-mip policy when framebuffers are recreated", () => {
            const { engine, nativeEngine } = createEngine({ multisampledMipmaps: true });
            const rtWrapper = engine.createRenderTargetCubeTexture(64, { createMipMaps: true, generateMipMaps: false }) as NativeRenderTargetWrapper;

            expect(nativeEngine.createFrameBuffer.mock.calls.map((call: unknown[]) => call[8])).toEqual(new Array(6).fill(false));
            nativeEngine.createFrameBuffer.mockClear();
            engine.updateRenderTargetTextureSampleCount(rtWrapper, 4);
            expect(nativeEngine.createFrameBuffer.mock.calls.map((call: unknown[]) => call[8])).toEqual(new Array(6).fill(false));

            rtWrapper.createDepthStencilTexture(0, false, false, 4);
            nativeEngine.createFrameBuffer.mockClear();
            rtWrapper.setDepthStencilTexture(null);
            expect(nativeEngine.createFrameBuffer.mock.calls.map((call: unknown[]) => call[8])).toEqual(new Array(6).fill(false));

            nativeEngine.createFrameBuffer.mockClear();
            (rtWrapper as any)._rebuild();
            expect(nativeEngine.createFrameBuffer.mock.calls.map((call: unknown[]) => call[8])).toEqual(new Array(6).fill(false));
        });

        it("records native depth formats and routes frame graph copies through the depth path", () => {
            const { engine } = createEngine();
            const depthOnlyTarget = engine.createRenderTargetTexture({ width: 64, height: 64 }, { generateDepthBuffer: false }) as NativeRenderTargetWrapper;
            const depthOnly = depthOnlyTarget.createDepthStencilTexture();
            const stencilTarget = engine.createRenderTargetTexture({ width: 64, height: 64 }, { generateDepthBuffer: false }) as NativeRenderTargetWrapper;
            const stencil = stencilTarget.createDepthStencilTexture(0, false, true);
            const explicitStencilTarget = engine.createRenderTargetTexture({ width: 64, height: 64 }, { generateDepthBuffer: false }) as NativeRenderTargetWrapper;
            const explicitStencil = explicitStencilTarget.createDepthStencilTexture(0, false, false, 1, Constants.TEXTUREFORMAT_DEPTH24_STENCIL8);

            expect(depthOnly.format).toBe(Constants.TEXTUREFORMAT_DEPTH32_FLOAT);
            expect(IsDepthTexture(depthOnly.format)).toBe(true);
            expect(HasStencilAspect(depthOnly.format)).toBe(false);
            expect(stencil.format).toBe(Constants.TEXTUREFORMAT_DEPTH24_STENCIL8);
            expect(HasStencilAspect(stencil.format)).toBe(true);
            expect(explicitStencil.format).toBe(Constants.TEXTUREFORMAT_DEPTH24_STENCIL8);
            expect(explicitStencilTarget._depthStencilTextureWithStencil).toBe(true);
            const mappedDepthOnly = engine.createRenderTargetTexture({ width: 64, height: 64 }, { generateDepthBuffer: false }) as NativeRenderTargetWrapper;
            expect(mappedDepthOnly.createDepthStencilTexture(0, false, false, 1, Constants.TEXTUREFORMAT_DEPTH24).format).toBe(Constants.TEXTUREFORMAT_DEPTH32_FLOAT);
            expect(mappedDepthOnly._depthStencilTextureWithStencil).toBe(false);
            const mappedStencil = engine.createRenderTargetTexture({ width: 64, height: 64 }, { generateDepthBuffer: false }) as NativeRenderTargetWrapper;
            expect(mappedStencil.createDepthStencilTexture(0, false, false, 1, Constants.TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8).format).toBe(
                Constants.TEXTUREFORMAT_DEPTH24_STENCIL8
            );
            expect(mappedStencil._depthStencilTextureWithStencil).toBe(true);
            const unsupportedTarget = engine.createRenderTargetTexture({ width: 64, height: 64 }, { generateDepthBuffer: false }) as NativeRenderTargetWrapper;
            expect(() => unsupportedTarget.createDepthStencilTexture(0, false, false, 1, Constants.TEXTUREFORMAT_RGBA)).toThrow(
                `NativeEngine: depth texture format ${Constants.TEXTUREFORMAT_RGBA} is not supported.`
            );

            const colorCopy = {
                source: null,
                lodLevel: 0,
                effectWrapper: { drawWrapper: {}, onApplyObservable: { notifyObservers: vi.fn() } },
            };
            const depthCopy = {
                source: null,
                lodLevel: 0,
                effectWrapper: { drawWrapper: {}, onApplyObservable: { notifyObservers: vi.fn() } },
            };
            // Import the native depth textures through a real texture manager so the imported description is
            // derived from the native InternalTexture metadata.
            // The manager registers backbuffer system textures on construction; give the mocked engine a backbuffer size.
            Object.assign(engine, { getRenderWidth: () => 64, getRenderHeight: () => 64, getCreationOptions: () => ({}) });
            const textureManager = new FrameGraphTextureManager(engine, false, {} as Scene);
            const depthOnlyHandle = textureManager.importTexture("native depth", depthOnly);
            const stencilHandle = textureManager.importTexture("native depth stencil", stencil);
            const depthOnlyFormat = textureManager.getTextureDescription(depthOnlyHandle).options.formats![0];
            const stencilFormat = textureManager.getTextureDescription(stencilHandle).options.formats![0];
            expect(depthOnlyFormat).toBe(Constants.TEXTUREFORMAT_DEPTH32_FLOAT);
            expect(IsDepthTexture(depthOnlyFormat)).toBe(true);
            expect(HasStencilAspect(depthOnlyFormat)).toBe(false);
            expect(stencilFormat).toBe(Constants.TEXTUREFORMAT_DEPTH24_STENCIL8);
            expect(HasStencilAspect(stencilFormat)).toBe(true);

            const context = Object.assign(Object.create(FrameGraphRenderContext.prototype), {
                _textureManager: textureManager,
                _copyTexture: colorCopy,
                _copyDepthTexture: depthCopy,
                applyFullScreenEffect: vi.fn(),
            }) as FrameGraphRenderContext;

            context.copyTexture(depthOnlyHandle);
            expect(depthCopy.source).toBe(depthOnly);
            expect(colorCopy.source).toBeNull();

            context.copyTexture(stencilHandle);
            expect(depthCopy.source).toBe(stencil);
            expect(colorCopy.source).toBeNull();
        });

        it("keeps stencil disabled while cached stencil parameters change", () => {
            const { engine, commands } = createEngine();
            Object.assign(engine as any, {
                _stencilTest: false,
                _stencilMask: 0xff,
                _stencilOpStencilFail: Constants.KEEP,
                _stencilOpDepthFail: Constants.KEEP,
                _stencilOpStencilDepthPass: Constants.KEEP,
                _stencilFunc: Constants.ALWAYS,
                _stencilFuncRef: 0,
                _stencilFuncMask: 0xff,
            });

            engine.setStencilFunction(Constants.NEVER);
            expect(commands).toHaveLength(0);
            engine.setStencilBuffer(true);
            expect(commands).toHaveLength(1);
            engine.setStencilFunctionMask(0x7f);
            expect(commands).toHaveLength(2);
            engine.setStencilBuffer(false);
            expect(commands).toHaveLength(3);

            engine.setStencilFunction(Constants.ALWAYS);
            engine.setStencilFunctionReference(3);
            engine.setStencilFunctionMask(0x3f);
            engine.setStencilMask(0x1f);
            engine.setStencilOperationFail(Constants.REPLACE);
            engine.setStencilOperationDepthFail(Constants.INCR);
            engine.setStencilOperationPass(Constants.DECR);

            expect(commands).toHaveLength(3);
            engine.setStencilBuffer(true);
            expect(commands).toHaveLength(4);
            expect(commands.at(-1)?.at(-1)).toBe(0x3f);
        });

        it("reapplies MRT depth sampling after recreating flat and layered depth textures", () => {
            for (const layered of [false, true]) {
                const { engine } = createEngine();
                const rtWrapper = engine.createMultipleRenderTarget(
                    { width: 64, height: 64 },
                    layered ? { textureCount: 1, targetTypes: [Constants.TEXTURE_2D_ARRAY], layerCounts: [3] } : { textureCount: 1, generateDepthBuffer: false }
                ) as NativeRenderTargetWrapper;
                rtWrapper.createDepthStencilTexture(Constants.LEQUAL, false, false, 1);
                const depth = rtWrapper._depthStencilTexture!;
                depth.samplingMode = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;
                const setSampling = vi.fn();
                (engine as any)._setTextureSampling = setSampling;
                const updateComparison = vi.spyOn(engine, "updateTextureComparisonFunction");

                engine.updateMultipleRenderTargetTextureSampleCount(rtWrapper, 4);
                if (layered) {
                    engine.bindFramebuffer(rtWrapper);
                }

                expect(setSampling).toHaveBeenCalledWith(resourceOf(depth), expect.anything());
                expect(updateComparison).toHaveBeenCalledWith(depth, Constants.LEQUAL);
            }
        });

        it("honors createMipMaps and sRGB for cube internal textures", () => {
            const { engine, nativeEngine } = createEngine();
            const texture = engine._createInternalTexture({ width: 64, height: 64 }, { isCube: true, createMipMaps: true, useSRGBBuffer: true });

            const call = nativeEngine.initializeTexture.mock.lastCall!;
            expect([call[3], call[6], call[8]]).toEqual([true, true, true]);
            expect(texture._useSRGBBuffer).toBe(true);
        });

        it("keeps public RawTexture3D updates inverted", () => {
            const { engine, nativeEngine } = createEngine();
            const initial = new Uint8Array(4 * 4 * 4 * 4);
            const updated = new Uint8Array(initial.length);
            const internalTexture = engine.createRawTexture3D(initial, 4, 4, 4, Constants.TEXTUREFORMAT_RGBA, false, true, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
            const publicTexture = Object.assign(Object.create(RawTexture3D.prototype), {
                _texture: internalTexture,
                _getEngine: () => engine,
            }) as RawTexture3D;

            publicTexture.update(updated);

            expect(nativeEngine.loadRawTexture3D.mock.calls.map((call: unknown[]) => call[7])).toEqual([true, true]);
            expect(internalTexture.invertY).toBe(true);
        });

        it("rebuilds raw volume and cube textures from their latest data", () => {
            const { engine, nativeEngine } = createEngine();
            const data = new Uint8Array(4 * 4 * 4 * 4);
            const texture3D = engine.createRawTexture3D(data, 4, 4, 4, Constants.TEXTUREFORMAT_RGBA, false, true, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
            const updated = new Uint8Array(data.length);
            engine.updateRawTexture3D(texture3D, updated, Constants.TEXTUREFORMAT_RGBA, true);
            const texture3DIdentity = texture3D;
            texture3D._rebuild();
            expect(texture3D).toBe(texture3DIdentity);
            expect(nativeEngine.loadRawTexture3D.mock.lastCall![1]).toBe(updated);

            const faces = Array.from({ length: 6 }, () => new Uint8Array(4 * 4 * 4));
            const cube = engine.createRawCubeTexture(
                faces,
                4,
                Constants.TEXTUREFORMAT_RGBA,
                Constants.TEXTURETYPE_UNSIGNED_BYTE,
                false,
                false,
                Constants.TEXTURE_NEAREST_SAMPLINGMODE
            );
            const updatedFaces = Array.from({ length: 6 }, () => new Uint8Array(4 * 4 * 4));
            engine.updateRawCubeTexture(cube, updatedFaces, Constants.TEXTUREFORMAT_RGBA, Constants.TEXTURETYPE_UNSIGNED_BYTE, false);
            const cubeIdentity = cube;
            nativeEngine.updateTextureData.mockClear();
            cube._rebuild();
            expect(cube).toBe(cubeIdentity);
            expect(nativeEngine.updateTextureData.mock.calls.map((call: unknown[]) => call[1])).toEqual(updatedFaces);
        });

        it("reallocates raw cube storage before public format and type changes", () => {
            const { engine, nativeEngine } = createEngine();
            const byteFaces = Array.from({ length: 6 }, () => new Uint8Array(4 * 4 * 4));
            const internalTexture = engine.createRawCubeTexture(
                byteFaces,
                4,
                Constants.TEXTUREFORMAT_RGBA,
                Constants.TEXTURETYPE_UNSIGNED_BYTE,
                false,
                false,
                Constants.TEXTURE_NEAREST_SAMPLINGMODE
            );
            const publicTexture = Object.assign(Object.create(RawCubeTexture.prototype), { _texture: internalTexture }) as RawCubeTexture;
            nativeEngine.initializeTexture.mockClear();

            const floatFaces = Array.from({ length: 6 }, () => new Float32Array(4 * 4 * 4));
            publicTexture.update(floatFaces, Constants.TEXTUREFORMAT_RGBA, Constants.TEXTURETYPE_FLOAT, false);
            expect(nativeEngine.initializeTexture.mock.lastCall![4]).toBe("TEXTURE_FORMAT_RGBA32F");
            expect([internalTexture.format, internalTexture.type]).toEqual([Constants.TEXTUREFORMAT_RGBA, Constants.TEXTURETYPE_FLOAT]);

            const rgFaces = Array.from({ length: 6 }, () => new Uint8Array(4 * 4 * 2));
            publicTexture.update(rgFaces, Constants.TEXTUREFORMAT_RG, Constants.TEXTURETYPE_UNSIGNED_BYTE, false);
            expect(nativeEngine.initializeTexture.mock.lastCall![4]).toBe("TEXTURE_FORMAT_RG8");
            expect([internalTexture.format, internalTexture.type]).toEqual([Constants.TEXTUREFORMAT_RG, Constants.TEXTURETYPE_UNSIGNED_BYTE]);
            expect(nativeEngine.initializeTexture).toHaveBeenCalledTimes(2);
        });

        it("rejects compressed raw cube creation and updates before mutation", () => {
            const { engine, nativeEngine } = createEngine();
            const faces = Array.from({ length: 6 }, () => new Uint8Array(8));
            const compression = "COMPRESSED_RGBA_S3TC_DXT1_EXT";

            expect(() =>
                engine.createRawCubeTexture(
                    faces,
                    4,
                    Constants.TEXTUREFORMAT_RGBA,
                    Constants.TEXTURETYPE_UNSIGNED_BYTE,
                    false,
                    false,
                    Constants.TEXTURE_NEAREST_SAMPLINGMODE,
                    compression
                )
            ).toThrow("compressed raw cube uploads are not supported");
            expect(nativeEngine.initializeTexture).not.toHaveBeenCalled();

            const texture = engine.createRawCubeTexture(
                faces,
                4,
                Constants.TEXTUREFORMAT_RGBA,
                Constants.TEXTURETYPE_UNSIGNED_BYTE,
                false,
                false,
                Constants.TEXTURE_NEAREST_SAMPLINGMODE
            );
            const previousBuffer = texture._bufferViewArray;
            nativeEngine.updateTextureData.mockClear();
            expect(() => engine.updateRawCubeTexture(texture, faces, Constants.TEXTUREFORMAT_RG, Constants.TEXTURETYPE_FLOAT, true, compression)).toThrow(
                "compressed raw cube uploads are not supported"
            );
            expect([texture.format, texture.type, texture.invertY, texture._compression, texture._bufferViewArray]).toEqual([
                Constants.TEXTUREFORMAT_RGBA,
                Constants.TEXTURETYPE_UNSIGNED_BYTE,
                false,
                null,
                previousBuffer,
            ]);
            expect(nativeEngine.updateTextureData).not.toHaveBeenCalled();
        });

        it("rejects compressed raw volume creation and updates before allocation or mutation", () => {
            const { engine, nativeEngine } = createEngine();
            const data = new Uint8Array(4 * 4 * 4 * 4);
            const compression = "COMPRESSED_RGBA_S3TC_DXT1_EXT";
            const cachedTextures = engine._internalTexturesCache.length;

            expect(() => engine.createRawTexture3D(data, 4, 4, 4, Constants.TEXTUREFORMAT_RGBA, false, false, Constants.TEXTURE_NEAREST_SAMPLINGMODE, compression)).toThrow(
                "compressed raw volume uploads are not supported"
            );
            expect(nativeEngine.initializeTexture).not.toHaveBeenCalled();
            expect(nativeEngine.loadRawTexture3D).not.toHaveBeenCalled();
            expect(engine._internalTexturesCache.length).toBe(cachedTextures);

            const texture = engine.createRawTexture3D(data, 4, 4, 4, Constants.TEXTUREFORMAT_RGBA, false, false, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
            const previousBuffer = texture._bufferView;
            nativeEngine.loadRawTexture3D.mockClear();
            expect(() => engine.updateRawTexture3D(texture, new Uint8Array(data.length), Constants.TEXTUREFORMAT_RG, true, compression, Constants.TEXTURETYPE_FLOAT)).toThrow(
                "compressed raw volume uploads are not supported"
            );
            expect([texture.format, texture.type, texture.invertY, texture._compression, texture._bufferView]).toEqual([
                Constants.TEXTUREFORMAT_RGBA,
                Constants.TEXTURETYPE_UNSIGNED_BYTE,
                false,
                null,
                previousBuffer,
            ]);
            expect(nativeEngine.loadRawTexture3D).not.toHaveBeenCalled();
            expect(nativeEngine.initializeTexture).not.toHaveBeenCalled();
        });

        it("preserves sRGB volume allocation through rebuilding", () => {
            const { engine, nativeEngine } = createEngine();
            const rtWrapper = engine.createRenderTargetTexture({ width: 64, height: 64, depth: 4 }, { useSRGBBuffer: true }) as NativeRenderTargetWrapper;

            expect(rtWrapper.texture!._useSRGBBuffer).toBe(true);
            expect(nativeEngine.initializeTexture.mock.lastCall![6]).toBe(true);

            (rtWrapper as any)._rebuild();

            expect(rtWrapper.texture!._useSRGBBuffer).toBe(true);
            expect(nativeEngine.initializeTexture.mock.lastCall![6]).toBe(true);
        });

        it("honors boolean mipmap options for volume render targets", () => {
            const { engine, nativeEngine } = createEngine();
            const booleanTarget = engine.createRenderTargetTexture({ width: 64, height: 64, depth: 4 }, true);
            const booleanAllocation = nativeEngine.initializeTexture.mock.lastCall!;
            const objectTarget = engine.createRenderTargetTexture({ width: 64, height: 64, depth: 4 }, { generateMipMaps: true });
            const objectAllocation = nativeEngine.initializeTexture.mock.lastCall!;

            expect(booleanTarget.texture!.generateMipMaps).toBe(true);
            expect(objectTarget.texture!.generateMipMaps).toBe(true);
            expect(booleanAllocation[3]).toBe(true);
            expect(objectAllocation[3]).toBe(true);
        });

        it("rebuilds a 3D render target as a bindable volume", () => {
            const { engine, nativeEngine } = createEngine();
            const rtWrapper = engine.createRenderTargetTexture({ width: 64, height: 64, depth: 4 }, {}) as NativeRenderTargetWrapper;
            const texture = rtWrapper.texture!;

            (rtWrapper as any)._rebuild();
            engine.bindFramebuffer(rtWrapper, undefined, 32, 32, true, 1, 2);

            expect(rtWrapper.texture).toBe(texture);
            expect(rtWrapper.is3D).toBe(true);
            expect(rtWrapper.texture!.is3D).toBe(true);
            expect(rtWrapper.texture!.depth).toBe(4);
            expect(nativeEngine.initializeTexture.mock.lastCall!.slice(9)).toEqual([4, true]);
            expect(nativeEngine.createFrameBuffer.mock.lastCall!.slice(6, 8)).toEqual([2, 1]);
        });

        it("does not compact missing layered MRT attachments", () => {
            const { engine, bound } = createEngine();
            const rtWrapper = engine.createMultipleRenderTarget(
                { width: 64, height: 64 },
                { textureCount: 3, targetTypes: [Constants.TEXTURE_CUBE_MAP, -1, Constants.TEXTURE_2D], faceIndex: [2, 0, 0] }
            ) as NativeRenderTargetWrapper;

            expect(() => engine.bindFramebuffer(rtWrapper)).toThrow("until every color attachment is assigned");

            const middle = engine._createInternalTexture({ width: 64, height: 64 }, {});
            rtWrapper.setTexture(middle, 1, false);
            engine.bindFramebuffer(rtWrapper);

            expect(bound().colors).toEqual(rtWrapper.textures!.map(resourceOf));
            expect(bound().layers).toEqual([2, 0, 0]);
        });

        it("forgets frame graph framebuffer bookkeeping on context restoration", () => {
            const { engine } = createEngine();
            Object.assign(engine, {
                _clearEmptyResources: () => {},
                _rebuildGraphicsResources: () => {},
                _flagContextRestored: () => {},
                _depthCullingState: {},
                _stencilState: {},
            });
            const refCount = (engine as any)._frameGraphFramebufferRefCount as Map<unknown, unknown>;
            for (let i = 0; i < 3; i++) {
                const rtWrapper = engine.createMultipleRenderTarget({ width: 64, height: 64 }, { textureCount: 1, dontCreateTextures: true }) as NativeRenderTargetWrapper;
                const texture = engine._createInternalTexture({ width: 64, height: 64 }, {});
                rtWrapper.setTexture(texture, 0, false);
                engine.bindFramebuffer(rtWrapper);
                expect(refCount.size).toBe(1);

                (engine as any)._restoreEngineAfterContextLost();

                expect(refCount.size).toBe(0);
                expect((texture._hardwareTexture as any)._frameGraphFramebuffer).toBeNull();
            }
        });

        it("applies wrapping mode changes to the native texture", () => {
            const { engine, commands } = createEngine();
            const texture = engine._createInternalTexture({ width: 64, height: 64 }, {});

            engine.updateTextureWrappingMode(texture, Constants.TEXTURE_CLAMP_ADDRESSMODE);
            engine.updateTextureWrappingMode(texture, null, Constants.TEXTURE_MIRROR_ADDRESSMODE);
            engine._bindTexture(0, texture);

            expect(commands.filter((command) => command[0] === "COMMAND_SETTEXTUREWRAPMODE")).toEqual([
                ["COMMAND_SETTEXTUREWRAPMODE", resourceOf(texture), "ADDRESS_MODE_CLAMP", "ADDRESS_MODE_WRAP", "ADDRESS_MODE_WRAP"],
                ["COMMAND_SETTEXTUREWRAPMODE", resourceOf(texture), "ADDRESS_MODE_CLAMP", "ADDRESS_MODE_MIRROR", "ADDRESS_MODE_WRAP"],
            ]);
            expect(commands.at(-1)).toEqual(["COMMAND_SETTEXTURE", { id: "uniform-0" }, resourceOf(texture)]);
        });

        it("uploads decoded mip levels into the requested level", () => {
            const { engine, nativeEngine } = createEngine();
            const texture = engine._createInternalTexture({ width: 4, height: 4 }, {});
            texture.width = 2;
            texture.height = 2;
            const mip = new Uint8Array(2 * 2 * 4);

            engine._uploadDataToTextureDirectly(texture, mip, 0, 1);

            expect(nativeEngine.loadRawTexture).not.toHaveBeenCalled();
            expect(nativeEngine.updateTextureData).toHaveBeenCalledWith(resourceOf(texture), mip, 0, 0, 2, 2, 0, 1, texture.invertY, false);
        });

        it("keeps decoded multi-mip textures at their level-zero dimensions", async () => {
            const { engine, nativeEngine } = createEngine();
            const useFallbackTexture = EngineStore.UseFallbackTexture;
            EngineStore.UseFallbackTexture = false;
            onTestFinished(() => {
                EngineStore.UseFallbackTexture = useFallbackTexture;
            });
            const workerPool = KhronosTextureContainer2.WorkerPool;
            KhronosTextureContainer2.WorkerPool = {} as any;
            onTestFinished(() => {
                KhronosTextureContainer2.WorkerPool = workerPool;
            });
            vi.spyOn(KhronosTextureContainer2.prototype as any, "_decodeAsync").mockResolvedValue({
                width: 4,
                height: 4,
                transcodedFormat: 0x8058,
                mipmaps: [4, 2, 1].map((size, lod) => ({ data: new Uint8Array(size * size * 4), width: size, height: size, layerIndex: 0, lod })),
                layerCount: 1,
                isInGammaSpace: false,
                hasAlpha: true,
                transcoderName: "mock",
            });
            vi.spyOn(AbstractEngine, "GetCompatibleTextureLoader").mockResolvedValue(new _KTXTextureLoader());
            const ktx2Data = new Uint8Array([0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a]);

            const texture = engine.createTexture("texture.ktx2", false, false, null, undefined, null, null, ktx2Data);
            await flushAsync();

            expect([texture.width, texture.height, texture.baseWidth, texture.baseHeight]).toEqual([4, 4, 4, 4]);
            expect(nativeEngine.loadRawTexture.mock.calls.map((call: unknown[]) => call.slice(2, 4))).toEqual([[4, 4]]);
            expect(nativeEngine.updateTextureData.mock.calls.map((call: unknown[]) => call.slice(4, 8))).toEqual([
                [2, 2, 0, 1],
                [1, 1, 0, 2],
            ]);
            expect(texture.isReady).toBe(true);
        });

        it("removes rejected loader textures from pending data without an error callback", async () => {
            const { engine } = createEngine();
            const useFallbackTexture = EngineStore.UseFallbackTexture;
            EngineStore.UseFallbackTexture = false;
            onTestFinished(() => {
                EngineStore.UseFallbackTexture = useFallbackTexture;
            });
            const pending = new Set<InternalTexture>();
            const removePendingData = vi.fn((texture: InternalTexture) => pending.delete(texture));
            const scene = {
                addPendingData: (texture: InternalTexture) => pending.add(texture),
                removePendingData,
            };

            const texture = engine.createTexture("profile.ies", true, false, scene as any, undefined, null, null, "not a buffer" as any);

            expect(pending.has(texture)).toBe(false);
            expect(removePendingData).toHaveBeenCalledWith(texture);
            expect(texture._loadError?.message).toContain("only ArrayBuffer or ArrayBufferView is supported");
        });

        it("leaves a loader texture unready when its GPU upload throws", async () => {
            const { engine } = createEngine();
            const useFallbackTexture = EngineStore.UseFallbackTexture;
            EngineStore.UseFallbackTexture = false;
            onTestFinished(() => {
                EngineStore.UseFallbackTexture = useFallbackTexture;
            });
            const uploadError = new Error("upload failed");
            const loader = {
                loadData: (
                    _data: ArrayBufferView,
                    _texture: InternalTexture,
                    callback: (width: number, height: number, loadMipmap: boolean, isCompressed: boolean, done: () => void) => void
                ) =>
                    callback(4, 4, false, false, () => {
                        throw uploadError;
                    }),
            };
            vi.spyOn(AbstractEngine, "GetCompatibleTextureLoader").mockResolvedValue(loader as any);
            const pending = new Set<InternalTexture>();
            const scene = {
                addPendingData: (texture: InternalTexture) => pending.add(texture),
                removePendingData: (texture: InternalTexture) => pending.delete(texture),
            };

            const texture = engine.createTexture("texture.ktx2", true, false, scene as any, undefined, null, null, new Uint8Array(4));
            await flushAsync();

            expect(texture.isReady).toBe(false);
            expect(texture._loadError?.exception).toBe(uploadError);
            expect(pending.has(texture)).toBe(false);
        });

        it("leaves a multi-mip loader texture unready when a later mip upload fails", async () => {
            const { engine, nativeEngine } = createEngine();
            const useFallbackTexture = EngineStore.UseFallbackTexture;
            EngineStore.UseFallbackTexture = false;
            onTestFinished(() => {
                EngineStore.UseFallbackTexture = useFallbackTexture;
            });
            const uploadError = new Error("later mip upload failed");
            nativeEngine.updateTextureData.mockImplementationOnce(() => {
                throw uploadError;
            });
            const loader = {
                loadData: (
                    _data: ArrayBufferView,
                    texture: InternalTexture,
                    callback: (width: number, height: number, loadMipmap: boolean, isCompressed: boolean, done: () => void, loadFailed?: boolean) => void
                ) => {
                    texture.format = Constants.TEXTUREFORMAT_RGBA;
                    texture.type = Constants.TEXTURETYPE_UNSIGNED_BYTE;
                    texture.width = texture.height = 4;
                    engine._uploadDataToTextureDirectly(texture, new Uint8Array(4 * 4 * 4), 0, 0);
                    try {
                        texture.width = texture.height = 2;
                        engine._uploadDataToTextureDirectly(texture, new Uint8Array(2 * 2 * 4), 0, 1);
                    } catch {
                        callback(4, 4, true, false, () => {}, true);
                    }
                },
            };
            vi.spyOn(AbstractEngine, "GetCompatibleTextureLoader").mockResolvedValue(loader as any);

            const texture = engine.createTexture("texture.ktx2", false, false, null, undefined, null, null, new Uint8Array(4));
            await flushAsync();

            expect(nativeEngine.loadRawTexture).toHaveBeenCalledTimes(1);
            expect(texture.isReady).toBe(false);
            expect(texture._loadError?.message).toContain("TextureLoader failed to load data");
        });

        it("keeps one URL raw-cube cache entry through rebuild and removes it on disposal", async () => {
            RegisterEnginesExtensionsEngineRawTexture();
            const { engine } = createEngine();
            const faces = Array.from({ length: 6 }, () => new Uint8Array(4 * 4 * 4));

            const texture = engine.createRawCubeTextureFromUrl(
                "environment.hdr",
                null,
                4,
                Constants.TEXTUREFORMAT_RGBA,
                Constants.TEXTURETYPE_UNSIGNED_BYTE,
                true,
                () => faces,
                null
            );
            await flushAsync();
            const cache = (engine as any)._internalTexturesCache as InternalTexture[];
            expect(cache.filter((entry) => entry === texture)).toHaveLength(1);

            texture._rebuild();
            expect(cache.filter((entry) => entry === texture)).toHaveLength(1);

            texture.dispose();
            expect(cache).not.toContain(texture);
        });

        it("reuses one fullscreen viewport for forced fullscreen binds", () => {
            const { engine, setViewport } = createEngine();
            const rtWrapper = engine.createRenderTargetTexture({ width: 64, height: 64 }, {});

            engine.bindFramebuffer(rtWrapper, undefined, undefined, undefined, true);
            engine.bindFramebuffer(rtWrapper, undefined, undefined, undefined, true);

            expect(setViewport.mock.calls[0][0]).toBe(setViewport.mock.calls[1][0]);
            expect(setViewport.mock.calls[0][0]).toEqual({ x: 0, y: 0, width: 1, height: 1 });
        });
    });
});
