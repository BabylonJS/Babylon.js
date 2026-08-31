import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Logger } from "core/Misc/logger";
import { MultiTexture, MultiBlendMode } from "core/Materials/Textures/multiTexture.pure";
import { type Scene } from "core/scene";

/** MultiTexture's internal (mocked) ProceduralTexture composite exposes call-recording props. */
interface MockComposite {
    name: string;
    size: unknown;
    defines: string;
    refreshRate: number;
    resetCount: number;
    creationOptions: any;
    setTextureCalls: [string, unknown][];
    setIntCalls: [string, number][];
    setFragmentCalls: string[];
    render: ReturnType<typeof vi.fn>;
    disposed: boolean;
    resetRefreshCounter(): void;
    _shouldRender(): boolean;
    isReady(): boolean;
    executeWhenReady(cb: () => void): void;
    getInternalTexture(): unknown;
    dispose(): void;
}

type MockMultiTexture = MultiTexture & {
    composite: MockComposite;
};

// ---------------------------------------------------------------------------
// Mock state
// ---------------------------------------------------------------------------

const mockState = vi.hoisted(() => {
    const state: any = {
        // RawTexture2DArray instances constructed during the test.
        rawInstances: [] as any[],
        // Upload spy (engine.updateTextureArrayLayerFromImageSource replacement).
        upload: null as any,
        // When true the fake engine does NOT expose updateTextureArrayLayerFromImageSource
        // (simulates a consumer that never imported the side-effect extension).
        engineExtMissing: false,
        // ProceduralTexture mock instances.
        ptInstances: [] as any[],
        // Controllable base-class readiness.
        ptReady: true,
        // createImageBitmap instrumentation.
        decodeCalls: [] as { source: any; opts: any }[],
        inFlight: 0,
        maxInFlight: 0,
        decodeImpl: null as ((source: any, opts: any) => any) | null,
        // fetch instrumentation.
        fetchCalls: [] as { url: string; init?: any }[],
        urlBehaviors: {} as Record<string, "notok" | "reject">,
        headers: {} as Record<string, string>,
        // Fake 2d context backing the OffscreenCanvas stub.
        ctx: null as any,
        // Engine spies.
        generateMipmaps: null as any,
        createEffect: null as any,
    };

    class MockProceduralTexture {
        public defines = "";
        public refreshRate = 1;
        public disposed = false;
        public shaderLanguage: unknown;
        public creationOptions: any;
        public setTextureCalls: [string, unknown][] = [];
        public setIntCalls: [string, number][] = [];
        public setFragmentCalls: string[] = [];
        public resetCount = 0;
        public render = vi.fn();
        public onLoadObservable = { notifyObservers: vi.fn() };
        /** Base-texture name as passed by the subclass constructor (clone contract). */
        public name: string;
        /** RTT size object as passed by the subclass constructor (clone contract). */
        public size: unknown;
        private _currentRefreshId = -1;
        private _frameId = -1;
        private _scene: any;
        constructor(name: string, size: unknown, fragment: string, scene: any, options: any, _generateMipMaps?: boolean, _isCube?: boolean, _textureType?: number) {
            this._scene = scene;
            this.name = name;
            this.size = size;
            this.creationOptions = options;
            this.shaderLanguage = options?.shaderLanguage;
            this.setFragmentCalls.push(fragment);
            if (scene && Array.isArray(scene.proceduralTextures) && !options?.skipSceneRegistration) {
                scene.proceduralTextures.push(this);
            }
            state.ptInstances.push(this);
        }
        public getScene() {
            return this._scene;
        }
        public setTexture(textureName: string, texture: unknown) {
            this.setTextureCalls.push([textureName, texture]);
            return this;
        }
        public setInt(name: string, value: number) {
            this.setIntCalls.push([name, value]);
            return this;
        }
        public setFragment(fragment: string) {
            this.setFragmentCalls.push(fragment);
        }
        public resetRefreshCounter() {
            this.resetCount++;
            this._currentRefreshId = -1;
        }
        public isReady() {
            return state.ptReady;
        }
        public executeWhenReady(cb: () => void) {
            cb();
        }
        public getInternalTexture() {
            return state.ptReady ? { isReady: true } : null;
        }
        // Mirrors the real ProceduralTexture._shouldRender refresh gating.
        public _shouldRender() {
            if (!this.isReady()) {
                return false;
            }
            if (this._currentRefreshId === -1) {
                this._currentRefreshId = 1;
                this._frameId++;
                return true;
            }
            if (this.refreshRate === this._currentRefreshId) {
                this._currentRefreshId = 1;
                this._frameId++;
                return true;
            }
            this._currentRefreshId++;
            return false;
        }
        public dispose() {
            this.disposed = true;
            const list = this._scene?.proceduralTextures;
            if (Array.isArray(list)) {
                const index = list.indexOf(this);
                if (index >= 0) {
                    list.splice(index, 1);
                }
            }
        }
    }

    state.ptMock = MockProceduralTexture;
    return state;
});

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("core/Materials/Textures/rawTexture2DArray", () => {
    return {
        RawTexture2DArray: class {
            public dispose = vi.fn();
            public depth: number;
            public width: number;
            public height: number;
            public samplingMode: number;
            private _internal: { generateMipMaps: boolean };
            constructor(
                _data: unknown,
                width: number,
                height: number,
                depth: number,
                _format: number,
                _scene: unknown,
                generateMipMaps = true,
                _invertY = false,
                samplingMode = 0
            ) {
                this.width = width;
                this.height = height;
                this.depth = depth;
                this.samplingMode = samplingMode;
                this._internal = { generateMipMaps: !!generateMipMaps };
                mockState.rawInstances.push(this);
            }
            public getInternalTexture() {
                return this._internal;
            }
            public getScene() {
                return {
                    getEngine: () => {
                        const engine: any = {};
                        if (!mockState.engineExtMissing) {
                            engine.updateTextureArrayLayerFromImageSource = (...args: unknown[]) => {
                                mockState.upload(...args);
                            };
                        }
                        return engine;
                    },
                };
            }
        },
    };
});

vi.mock("core/Materials/Textures/Procedurals/proceduralTexture", () => ({
    ProceduralTexture: mockState.ptMock,
}));
vi.mock("core/Materials/Textures/Procedurals/proceduralTexture.pure", () => ({
    ProceduralTexture: mockState.ptMock,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createFakeCtx() {
    return {
        clearRect: vi.fn(),
        drawImage: vi.fn(),
        getImageData: vi.fn((_x: number, _y: number, w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4).fill(200) })),
    };
}

function makeScene(opts?: { webglVersion?: number; isWebGPU?: boolean; texture2DArrayMaxLayerCount?: number }): Scene {
    const cap = opts?.texture2DArrayMaxLayerCount ?? 128;
    const engine: any = {
        isWebGPU: opts?.isWebGPU ?? false,
        webGLVersion: opts?.webglVersion ?? 2,
        generateMipmaps: mockState.generateMipmaps,
        createEffect: mockState.createEffect,
        getCaps: () => ({ texture2DArrayMaxLayerCount: cap }),
    };
    let uid = 0;
    const textures: any[] = [];
    return {
        getEngine: () => engine,
        proceduralTextures: [] as any[],
        markAllMaterialsAsDirty: () => {},
        removePendingData: () => {},
        stopAnimation: () => {},
        textures,
        getUniqueId: () => ++uid,
        addTexture: (t: any) => {
            textures.push(t);
        },
        onTextureRemovedObservable: { notifyObservers: vi.fn() },
        getClassName: () => "Scene",
    } as unknown as Scene;
}

function createLoaded(
    urls: string[],
    options: any,
    sceneOpts?: { webglVersion?: number; isWebGPU?: boolean; texture2DArrayMaxLayerCount?: number }
): Promise<{ mt: MockMultiTexture; scene: any }> {
    const scene = makeScene(sceneOpts);
    let resolveLoad!: () => void;
    const loaded = new Promise<void>((resolve) => (resolveLoad = resolve));
    const mt = new MultiTexture("myMultiTexture", urls, scene, { ...options, onLoad: () => resolveLoad() }) as MockMultiTexture;
    // MultiTexture owns a real Observable for onLoadObservable; spy it per-instance so tests can
    // await/count the async init notification after createLoaded resolves.
    vi.spyOn(mt.onLoadObservable, "notifyObservers").mockImplementation(() => true);
    return loaded.then(() => ({ mt, scene }));
}

// Fetches stay pending until the test resolves them, so initial loads stay in flight while
// structure changes (insertLayerAsync/removeLayerAsync/updateLayerAsync) run. Every decoded bitmap
// is tagged with its source url so upload assertions can say WHICH layer's pixels landed in which
// slot. Each fetches-holding test shares this so the deferred-load mechanics live in one place.
function deferredScene() {
    const resolvers: Record<string, () => void> = {};
    const bitmaps: any[] = [];
    vi.stubGlobal(
        "fetch",
        (url: string) =>
            new Promise((resolve) => {
                mockState.fetchCalls.push({ url });
                resolvers[url] = () =>
                    resolve({
                        ok: true,
                        status: 200,
                        statusText: "OK",
                        headers: { get: () => null },
                        blob: async () => ({ __url: url }),
                    });
            })
    );
    mockState.decodeImpl = (source: any) => {
        const bitmap = { width: 8, height: 8, close: vi.fn(), url: source.__url };
        bitmaps.push(bitmap);
        return bitmap;
    };
    return { scene: makeScene(), resolvers, bitmaps };
}

/** Flush the microtask/macrotask queue so a settled promise's continuations have run. */
const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
    mockState.rawInstances.length = 0;
    mockState.ptInstances.length = 0;
    mockState.ptReady = true;
    mockState.decodeCalls.length = 0;
    mockState.inFlight = 0;
    mockState.maxInFlight = 0;
    mockState.decodeImpl = null;
    mockState.fetchCalls.length = 0;
    mockState.urlBehaviors = {};
    mockState.headers = {};
    mockState.engineExtMissing = false;
    mockState.upload = vi.fn();
    mockState.generateMipmaps = vi.fn();
    mockState.createEffect = vi.fn();
    mockState.ctx = createFakeCtx();

    vi.spyOn(Logger, "Error").mockImplementation(() => undefined);

    vi.stubGlobal("fetch", (url: string, init?: any) => {
        mockState.fetchCalls.push({ url, init });
        const behavior = mockState.urlBehaviors[url];
        if (behavior === "reject") {
            return Promise.reject(new Error(`MultiTexture: failed to fetch ${url}: 500 Internal Server Error`));
        }
        if (behavior === "notok") {
            return Promise.resolve({
                ok: false,
                status: 500,
                statusText: "Internal Server Error",
                headers: { get: () => null },
                blob: async () => ({}),
            });
        }
        return Promise.resolve({
            ok: true,
            status: 200,
            statusText: "OK",
            headers: { get: (key: string) => mockState.headers[key.toLowerCase()] ?? null },
            blob: async () => ({ __url: url }),
        });
    });

    vi.stubGlobal("createImageBitmap", (source: any, opts?: any) => {
        mockState.decodeCalls.push({ source, opts });
        mockState.inFlight++;
        mockState.maxInFlight = Math.max(mockState.maxInFlight, mockState.inFlight);
        const bitmap = mockState.decodeImpl ? mockState.decodeImpl(source, opts) : { width: opts?.resizeWidth ?? 8, height: opts?.resizeHeight ?? 8, close: vi.fn() };
        return Promise.resolve(bitmap).finally(() => {
            mockState.inFlight--;
        });
    });

    vi.stubGlobal(
        "OffscreenCanvas",
        class {
            public width: number;
            public height: number;
            constructor(width: number, height: number) {
                this.width = width;
                this.height = height;
            }
            public getContext() {
                return mockState.ctx;
            }
        }
    );
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MultiTexture", () => {
    it("constructs on a WebGL2 engine and wires the composite before the first frame", async () => {
        const { mt, scene } = await createLoaded(["a.png", "b.png"], { width: 8, height: 8 });

        // Neither MultiTexture nor its internal composite registers in the scene's procedural list
        // (skipSceneRegistration), so the scene render loop does not drive the composite.
        expect(scene.proceduralTextures).toHaveLength(0);
        expect(mt.arrayTexture.depth).toBe(2);

        expect(mt.composite.setTextureCalls).toContainEqual(["uLayers", expect.anything()]);
        expect(mt.composite.setIntCalls).toContainEqual(["uLayerCount", 2]);
        expect(mt.urls).toEqual(["a.png", "b.png"]);
        expect(mt.layerCount).toBe(2);
    });

    it("registers itself in the supplied scene (not the engine's last-created scene)", () => {
        const scene = makeScene();
        const mt = new MultiTexture("myMultiTexture", ["a.png"], scene, { width: 8, height: 8 }) as unknown as MultiTexture;
        expect(scene.textures).toContain(mt);
    });

    it("does not leave a partially-constructed texture registered after a validation throw", () => {
        const scene = makeScene();
        expect(() => new MultiTexture("myMultiTexture", ["a.png"], scene, { width: 0, height: 8 })).toThrow();
        expect(scene.textures).toHaveLength(0);
    });

    it("throws on a WebGL1 engine and allocates nothing", () => {
        const scene = makeScene({ webglVersion: 1 });

        expect(() => new MultiTexture("myMultiTexture", ["a.png"], scene, { width: 8, height: 8 })).toThrow(/requires WebGL2/);
        expect(scene.proceduralTextures).toHaveLength(0);
        expect(mockState.rawInstances).toHaveLength(0);
    });

    it("throws on non-positive dimensions", () => {
        const scene = makeScene();

        expect(() => new MultiTexture("myMultiTexture", ["a.png"], scene, { width: 0, height: 8 })).toThrow("MultiTexture: width and height must be positive integers.");
    });

    it("throws when maxLayers < urls.length", () => {
        const scene = makeScene();

        expect(() => new MultiTexture("myMultiTexture", ["a.png", "b.png"], scene, { width: 8, height: 8, maxLayers: 1 })).toThrow(
            "MultiTexture: maxLayers (1) must be >= urls.length (2)."
        );
    });

    it("throws when maxLayers is not a positive integer", () => {
        const scene = makeScene();

        expect(() => new MultiTexture("myMultiTexture", ["a.png"], scene, { width: 8, height: 8, maxLayers: 1.5 })).toThrow(
            "MultiTexture: maxLayers must be a positive integer (got 1.5)."
        );
        expect(() => new MultiTexture("myMultiTexture", ["a.png"], scene, { width: 8, height: 8, maxLayers: 0 })).toThrow(
            "MultiTexture: maxLayers must be a positive integer (got 0)."
        );
        expect(() => new MultiTexture("myMultiTexture", ["a.png"], scene, { width: 8, height: 8, maxLayers: -2 })).toThrow(
            "MultiTexture: maxLayers must be a positive integer (got -2)."
        );
        expect(mockState.rawInstances).toHaveLength(0);
    });

    it("throws on empty urls without an explicit maxLayers", () => {
        const scene = makeScene();

        expect(() => new MultiTexture("myMultiTexture", [], scene, { width: 8, height: 8 })).toThrow(
            "MultiTexture: urls is empty; pass options.maxLayers (positive integer, <= device limit 128) to define the array depth."
        );
        expect(mockState.rawInstances).toHaveLength(0);
    });

    it("accepts empty urls with an explicit positive maxLayers", async () => {
        const { mt } = await createLoaded([], { width: 8, height: 8, maxLayers: 4 });

        expect(mt.arrayTexture.depth).toBe(4);
        expect(mt.layerCount).toBe(0);
        expect(mockState.fetchCalls).toHaveLength(0);
    });

    it("throws when an explicit maxLayers exceeds the device texture2DArrayMaxLayerCount", () => {
        const scene = makeScene({ texture2DArrayMaxLayerCount: 2 });

        expect(() => new MultiTexture("myMultiTexture", ["a.png"], scene, { width: 8, height: 8, maxLayers: 4 })).toThrow(
            "MultiTexture: array depth 4 exceeds the device limit texture2DArrayMaxLayerCount (2). Pass a smaller maxLayers (or fewer urls) or use a device with a higher limit."
        );
        expect(mockState.rawInstances).toHaveLength(0);
    });

    it("throws when urls.length alone exceeds the device texture2DArrayMaxLayerCount", () => {
        const scene = makeScene({ texture2DArrayMaxLayerCount: 1 });

        expect(() => new MultiTexture("myMultiTexture", ["a.png", "b.png"], scene, { width: 8, height: 8 })).toThrow(
            "MultiTexture: array depth 2 exceeds the device limit texture2DArrayMaxLayerCount (1). Pass a smaller maxLayers (or fewer urls) or use a device with a higher limit."
        );
    });

    it("allows a depth exactly equal to the device cap", async () => {
        const { mt } = await createLoaded(["a.png", "b.png"], { width: 8, height: 8, maxLayers: 4 }, { texture2DArrayMaxLayerCount: 4 });

        expect(mt.arrayTexture.depth).toBe(4);
    });

    it("addLayerAsync growth beyond the device cap throws an actionable error and keeps the old array", async () => {
        const onError = vi.fn();
        const { mt } = await createLoaded(["a.png", "b.png"], { width: 8, height: 8, maxLayers: 2, onError }, { texture2DArrayMaxLayerCount: 2 });

        const rawsBefore = mockState.rawInstances.length;
        await expect(mt.addLayerAsync("c.png")).rejects.toThrow(
            "MultiTexture: cannot grow the array from depth 2 to 4: the device limit texture2DArrayMaxLayerCount is 2. Remove a layer, or recreate the MultiTexture with a larger options.maxLayers (<= 2) to allow more growth headroom."
        );

        // No new array allocated, no layer appended, failure surfaced via onError as well.
        expect(mockState.rawInstances).toHaveLength(rawsBefore);
        expect(mt.layerCount).toBe(2);
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError.mock.calls[0][0]).toContain("texture2DArrayMaxLayerCount");
    });

    it("addLayerAsync can grow up to the device cap but not past it", async () => {
        const { mt } = await createLoaded(["a.png"], { width: 8, height: 8 }, { texture2DArrayMaxLayerCount: 8 });

        // Depth doubles only when full: 1 -> 2 -> 4 (fits) -> 8 (fits for layers 6-8).
        await mt.addLayerAsync("b.png");
        expect(mt.arrayTexture.depth).toBe(2);
        await mt.addLayerAsync("c.png");
        expect(mt.arrayTexture.depth).toBe(4);
        await mt.addLayerAsync("d.png");
        expect(mt.arrayTexture.depth).toBe(4);
        await mt.addLayerAsync("e.png");
        expect(mt.arrayTexture.depth).toBe(8);
        await mt.addLayerAsync("f.png");
        await mt.addLayerAsync("g.png");
        await mt.addLayerAsync("h.png");
        expect(mt.arrayTexture.depth).toBe(8);
        expect(mt.layerCount).toBe(8);

        // The 9th layer would need depth 16 > 8 and must fail without touching the array.
        await expect(mt.addLayerAsync("i.png")).rejects.toThrow(/device limit texture2DArrayMaxLayerCount is 8/);
        expect(mt.arrayTexture.depth).toBe(8);
        expect(mt.layerCount).toBe(8);
    });

    it("loads all layers, caches pixels and issues one final mip generation", async () => {
        const mipmapObservations: boolean[] = [];
        mockState.upload = vi.fn((internal: any) => {
            mipmapObservations.push(internal.generateMipMaps);
        });

        const { mt } = await createLoaded(["a.png", "b.png"], { width: 8, height: 8, generateMipMaps: true });

        // Both fetched and uploaded to their own layer.
        expect(mockState.fetchCalls.map((c: any) => c.url)).toEqual(["a.png", "b.png"]);
        const layers = mockState.upload.mock.calls.map((call: any[]) => call[2]);
        expect(layers).toContain(0);
        expect(layers).toContain(1);

        // Mips suppressed during uploads, restored after, single final generation.
        expect(mipmapObservations.every((v) => v === false)).toBe(true);
        expect(mockState.generateMipmaps).toHaveBeenCalledTimes(1);
        expect(mt.arrayTexture.getInternalTexture()!.generateMipMaps).toBe(true);

        // onLoad + observable fired exactly once each.
        expect(mt.onLoadObservable.notifyObservers).toHaveBeenCalledTimes(1);

        // CPU pixel cache populated.
        expect(mt.pixels).toHaveLength(2);
        expect(mt.pixels[0]).toBeInstanceOf(Uint8ClampedArray);
        expect(mt.pixels[0]).toHaveLength(8 * 8 * 4);
        expect(mt.pixels[1]).toBeInstanceOf(Uint8ClampedArray);
    });

    it("decodes at most 4 layers concurrently during init", async () => {
        const urls = ["0.png", "1.png", "2.png", "3.png", "4.png", "5.png", "6.png", "7.png", "8.png"];
        await createLoaded(urls, { width: 8, height: 8 });

        expect(mockState.decodeCalls).toHaveLength(9);
        expect(mockState.maxInFlight).toBeLessThanOrEqual(4);
        expect(mockState.maxInFlight).toBe(4);
    });

    it("routes a failed layer to onError while other layers still load", async () => {
        const onError = vi.fn();
        mockState.urlBehaviors["bad.png"] = "notok";

        const { mt } = await createLoaded(["good.png", "bad.png"], { width: 8, height: 8, onError });

        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError.mock.calls[0][0]).toBe("MultiTexture: failed to fetch bad.png: 500 Internal Server Error");

        const layers = (mt as any)._layers;
        expect(layers[0].loaded).toBe(true);
        expect(layers[1].loaded).toBe(false);
        expect(mt.pixels[0]).toBeInstanceOf(Uint8ClampedArray);
        expect(mt.pixels[1]).toBeNull();
    });

    it("rejects mismatched dimensions in strict mode and closes the bitmap", async () => {
        const onError = vi.fn();
        const badBitmap = { width: 16, height: 8, close: vi.fn() };
        mockState.decodeImpl = () => badBitmap;

        const { mt } = await createLoaded(["a.png"], { width: 8, height: 8, fit: "strict", onError });

        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError.mock.calls[0][0]).toBe('MultiTexture: layer 0 (a.png) is 16x8, expected 8x8. Use fit: "resize" to auto-scale.');
        expect(badBitmap.close).toHaveBeenCalled();
        expect((mt as any)._layers[0].loaded).toBe(false);
    });

    it("rescales during decode by default", async () => {
        await createLoaded(["a.png"], { width: 32, height: 16 });

        // Default premultiplyAlpha:false decodes straight alpha ("none") so WebGL2 (which writes an
        // ImageBitmap as-is) and WebGPU (which inverse-premultiplies per its flag) agree on straight layers.
        expect(mockState.decodeCalls[0].opts).toEqual({ premultiplyAlpha: "none", resizeWidth: 32, resizeHeight: 16, resizeQuality: "high" });
    });

    it("updateLayerAsync(url) re-uploads only that layer without touching uLayerCount", async () => {
        const { mt } = await createLoaded(["a.png", "b.png"], { width: 8, height: 8 });

        const uploadsBefore = mockState.upload.mock.calls.length;
        const rendersBefore = mt.composite.render.mock.calls.length;
        const setIntsBefore = mt.composite.setIntCalls.length;
        mockState.fetchCalls.length = 0;

        await mt.updateLayerAsync(0, "new.png");

        expect(mockState.fetchCalls.map((c: any) => c.url)).toEqual(["new.png"]);
        const newCalls = mockState.upload.mock.calls.slice(uploadsBefore);
        expect(newCalls).toHaveLength(1);
        expect(newCalls[0][2]).toBe(0);
        expect(mt.composite.setIntCalls.length).toBe(setIntsBefore);
        expect(mt.composite.render).toHaveBeenCalledTimes(rendersBefore + 1);
    });

    it("updateLayer with an out-of-range index throws RangeError", async () => {
        const { mt } = await createLoaded(["a.png", "b.png"], { width: 8, height: 8 });

        await expect(mt.updateLayerAsync(5, "x.png")).rejects.toThrow(RangeError);
        await expect(mt.updateLayerAsync(5, "x.png")).rejects.toThrow("MultiTexture: layer index 5 out of range [0, 2).");
    });

    it("addLayerAsync beyond maxLayers grows the array and re-uploads existing layers", async () => {
        const { mt } = await createLoaded(["a.png", "b.png"], { width: 8, height: 8, maxLayers: 2 });

        const oldRaw = mockState.rawInstances[0];
        const initUploads = mockState.upload.mock.calls.slice();
        const bitmapA = initUploads.find((call: any[]) => call[2] === 0)[1];
        const bitmapB = initUploads.find((call: any[]) => call[2] === 1)[1];
        const uploadsBefore = mockState.upload.mock.calls.length;
        const setTextureBefore = mt.composite.setTextureCalls.length;
        const setIntBefore = mt.composite.setIntCalls.length;

        const newIndex = await mt.addLayerAsync("c.png");

        expect(newIndex).toBe(2);
        expect(mt.layerCount).toBe(3);
        expect(mt.urls).toEqual(["a.png", "b.png", "c.png"]);
        expect(mt.pixels).toHaveLength(3);

        // The uLayerCount uniform must advance to 3 or the new layer is never sampled by the shader.
        expect(mt.composite.setIntCalls.slice(setIntBefore)).toContainEqual(["uLayerCount", 3]);

        // New array at doubled depth; old one disposed and rebound.
        const newRaw = mockState.rawInstances[1];
        expect(newRaw.depth).toBe(4);
        expect(oldRaw.dispose).toHaveBeenCalledTimes(1);
        expect(mt.arrayTexture).toBe(newRaw);
        const newSetTextures = mt.composite.setTextureCalls.slice(setTextureBefore);
        expect(newSetTextures).toEqual([["uLayers", newRaw]]);

        // Existing layers re-uploaded from retained bitmaps, then the new layer loaded.
        const newUploads = mockState.upload.mock.calls.slice(uploadsBefore);
        expect(newUploads).toHaveLength(3);
        expect(newUploads[0][0]).toBe(newRaw.getInternalTexture());
        expect(newUploads[0][1]).toBe(bitmapA);
        expect(newUploads[0][2]).toBe(0);
        expect(newUploads[1][0]).toBe(newRaw.getInternalTexture());
        expect(newUploads[1][1]).toBe(bitmapB);
        expect(newUploads[1][2]).toBe(1);
        expect(newUploads[2][2]).toBe(2);

        // The MAXLAYERS loop bound is baked to the device cap (not the grown depth), so growth
        // never rewrites the defines/no effect rebuild; the actual grown depth is checked above.
        expect(mt.composite.defines).toContain("#define MULTITEXTURE_MAXLAYERS 128");
    });

    it("removeLayerAsync shifts layers down, re-uploads them and decrements uLayerCount", async () => {
        const { mt } = await createLoaded(["a.png", "b.png", "c.png"], { width: 8, height: 8, maxLayers: 3 });

        const initUploads = mockState.upload.mock.calls.slice();
        const bitmapA = initUploads.find((call: any[]) => call[2] === 0)[1];
        const bitmapB = initUploads.find((call: any[]) => call[2] === 1)[1];
        const uploadsBefore = mockState.upload.mock.calls.length;
        const setIntsBefore = mt.composite.setIntCalls.length;
        const rendersBefore = mt.composite.render.mock.calls.length;

        await mt.removeLayerAsync(0);

        expect(mt.layerCount).toBe(2);
        expect(mt.urls).toEqual(["b.png", "c.png"]);
        expect(mt.pixels).toHaveLength(2);
        expect(bitmapA.close).toHaveBeenCalledTimes(1);

        // Only slot 0 needs re-uploading (old layer 1); slot 1 still holds old layer 2's pixels.
        const newUploads = mockState.upload.mock.calls.slice(uploadsBefore);
        expect(newUploads[0][1]).toBe(bitmapB);
        expect(newUploads[0][2]).toBe(0);

        expect(mt.composite.setIntCalls.slice(setIntsBefore)).toEqual([["uLayerCount", 2]]);

        // A re-composite must be performed even when the shift re-uploads layers, so the result
        // is not left stale.
        expect(mt.composite.render).toHaveBeenCalledTimes(rendersBefore + 1);
    });

    it("removeLayerAsync with an out-of-range index throws RangeError", async () => {
        const { mt } = await createLoaded(["a.png", "b.png", "c.png"], { width: 8, height: 8, maxLayers: 3 });

        await expect(mt.removeLayerAsync(9)).rejects.toThrow(RangeError);
        await expect(mt.removeLayerAsync(9)).rejects.toThrow("MultiTexture: layer index 9 out of range [0, 3).");
    });

    it("blendMode swap swaps the fragment, rewrites defines and triggers one re-composite", async () => {
        const { mt } = await createLoaded(["a.png"], { width: 8, height: 8 });

        const fragmentsBefore = mt.composite.setFragmentCalls.length;
        const rendersBefore = mt.composite.render.mock.calls.length;

        mt.blendMode = MultiBlendMode.ADD;

        expect(mt.composite.setFragmentCalls.slice(fragmentsBefore)).toEqual(["multiTextureCompositeAdd"]);
        expect(mt.composite.defines).toContain("#define MULTITEXTURE_BLEND_ADD");
        expect(mt.composite.render).toHaveBeenCalledTimes(rendersBefore + 1);

        // Setting the same value again is a no-op.
        mt.blendMode = MultiBlendMode.ADD;
        expect(mt.composite.setFragmentCalls.length).toBe(fragmentsBefore + 1);
        expect(mt.composite.render).toHaveBeenCalledTimes(rendersBefore + 1);
    });

    it("defaults to ALPHA_BLEND (source-over) when no blendMode is given", async () => {
        const { mt } = await createLoaded(["a.png", "b.png"], { width: 8, height: 8 });
        expect(mt.blendMode).toBe(MultiBlendMode.ALPHA_BLEND);

        // The composite effect is built with the alpha-blend fragment and its defines flag.
        expect(mt.composite.setFragmentCalls[0]).toBe("multiTextureCompositeAlphaBlend");
        expect(mt.composite.defines).toContain("#define MULTITEXTURE_BLEND_ALPHA_BLEND");
    });
    it("emits the MULTITEXTURE_PREMULTIPLY define only when premultiplyAlpha is true", async () => {
        const straight = await createLoaded(["a.png", "b.png"], { width: 8, height: 8 });
        expect(straight.mt.composite.defines).not.toContain("#define MULTITEXTURE_PREMULTIPLY");

        const premultiplied = await createLoaded(["a.png", "b.png"], { width: 8, height: 8, premultiplyAlpha: true });
        expect(premultiplied.mt.composite.defines).toContain("#define MULTITEXTURE_PREMULTIPLY");
        // The blend flag is still present alongside the storage-mode define.
        expect(premultiplied.mt.composite.defines).toContain("#define MULTITEXTURE_BLEND_ALPHA_BLEND");
    });

    it("swapping between ALPHA_BLEND and ALPHA_MAX selects the right fragment and defines", async () => {
        const { mt } = await createLoaded(["a.png"], { width: 8, height: 8 });

        // Default is ALPHA_BLEND.
        expect(mt.composite.setFragmentCalls[0]).toBe("multiTextureCompositeAlphaBlend");

        // Swap to ALPHA_MAX: highest-alpha fragment + flag.
        mt.blendMode = MultiBlendMode.ALPHA_MAX;
        expect(mt.blendMode).toBe(MultiBlendMode.ALPHA_MAX);
        expect(mt.composite.setFragmentCalls[1]).toBe("multiTextureCompositeAlphaMax");
        expect(mt.composite.defines).toContain("#define MULTITEXTURE_BLEND_ALPHA_MAX");

        // Swap back to ALPHA_BLEND.
        mt.blendMode = MultiBlendMode.ALPHA_BLEND;
        expect(mt.composite.setFragmentCalls[2]).toBe("multiTextureCompositeAlphaBlend");
        expect(mt.composite.defines).toContain("#define MULTITEXTURE_BLEND_ALPHA_BLEND");
    });

    it("explicit blendMode option is honored at construction", async () => {
        const { mt } = await createLoaded(["a.png"], { width: 8, height: 8, blendMode: MultiBlendMode.ALPHA_MAX });

        expect(mt.blendMode).toBe(MultiBlendMode.ALPHA_MAX);
        expect(mt.composite.setFragmentCalls[0]).toBe("multiTextureCompositeAlphaMax");
        expect(mt.composite.defines).toContain("#define MULTITEXTURE_BLEND_ALPHA_MAX");
    });

    it.each([
        [MultiBlendMode.ALPHA_BLEND, "AlphaBlend", "ALPHA_BLEND"],
        [MultiBlendMode.ALPHA_MAX, "AlphaMax", "ALPHA_MAX"],
        [MultiBlendMode.ADD, "Add", "ADD"],
        [MultiBlendMode.MULTIPLY, "Multiply", "MULTIPLY"],
        [MultiBlendMode.SUBTRACT, "Subtract", "SUBTRACT"],
        [MultiBlendMode.SCREEN, "Screen", "SCREEN"],
    ])("maps blend mode %p to the matching composite fragment and defines flag", async (mode: MultiBlendMode, suffix: string, flag: string) => {
        const { mt } = await createLoaded(["a.png"], { width: 8, height: 8, blendMode: mode });

        expect(mt.blendMode).toBe(mode);
        // Every mode (incl. MULTIPLY/SUBTRACT) selects its own fragment + MAXLAYERS/flag defines.
        expect(mt.composite.setFragmentCalls[0]).toBe(`multiTextureComposite${suffix}`);
        expect(mt.composite.defines).toContain(`#define MULTITEXTURE_BLEND_${flag}`);
        expect(mt.composite.defines).toContain(`#define MULTITEXTURE_MAXLAYERS 1`);
    });

    it.each([
        [MultiBlendMode.MULTIPLY, "Multiply", "MULTIPLY"],
        [MultiBlendMode.SUBTRACT, "Subtract", "SUBTRACT"],
    ])("swapping to %p at runtime swaps the fragment and rewrites the defines (previously untested modes)", async (mode: MultiBlendMode, suffix: string, flag: string) => {
        const { mt } = await createLoaded(["a.png"], { width: 8, height: 8 });

        mt.blendMode = mode;

        expect(mt.blendMode).toBe(mode);
        expect(mt.composite.setFragmentCalls[mt.composite.setFragmentCalls.length - 1]).toBe(`multiTextureComposite${suffix}`);
        expect(mt.composite.defines).toContain(`#define MULTITEXTURE_BLEND_${flag}`);
    });

    it("forwards isReady()/getInternalTexture() to the internal composite (not its own state)", async () => {
        const { mt } = await createLoaded(["a.png"], { width: 8, height: 8 });

        mockState.ptReady = true;
        expect(mt.isReady()).toBe(true);
        expect(mt.getInternalTexture()).toBeTruthy();

        mockState.ptReady = false;
        expect(mt.isReady()).toBe(false);
        expect(mt.getInternalTexture()).toBeNull();
    });

    it("exposes no lifecycle surface inherited from ProceduralTexture (composition owns rendering)", async () => {
        const { mt } = await createLoaded(["a.png"], { width: 8, height: 8 });

        // The scene render loop must not drive the composite, and the composite is not registered
        // in the scene's procedural list (skipSceneRegistration), so nothing here re-renders it.
        expect(mt.composite).toBeDefined();
        // MultiTexture itself no longer inherits the PT refresh-gating members.
        expect("refreshRate" in mt).toBe(false);
        expect("_shouldRender" in mt).toBe(false);
    });

    it("dispose removes the RTT, disposes the array, closes bitmaps; second dispose is a no-op", async () => {
        const { mt, scene } = await createLoaded(["a.png", "b.png"], { width: 8, height: 8 });

        const initUploads = mockState.upload.mock.calls.slice();
        const bitmapA = initUploads.find((call: any[]) => call[2] === 0)[1];
        const bitmapB = initUploads.find((call: any[]) => call[2] === 1)[1];
        const raw = mt.arrayTexture;
        const composite = mt.composite;
        const onDisposeSpy = vi.spyOn(mt.onDisposeObservable, "notifyObservers");
        const onTextureRemovedSpy = scene.onTextureRemovedObservable.notifyObservers as ReturnType<typeof vi.fn>;

        mt.dispose();

        expect(scene.proceduralTextures).not.toContain(mt);
        expect(raw.dispose).toHaveBeenCalledTimes(1);
        expect(bitmapA.close).toHaveBeenCalledTimes(1);
        expect(bitmapB.close).toHaveBeenCalledTimes(1);
        expect(mt.pixels.every((p) => p === null)).toBe(true);
        expect(composite.disposed).toBe(true);
        // dispose() must honor the base-texture contract: fire onDisposeObservable and clear the
        // scene registration (via super.dispose()).
        expect(onDisposeSpy).toHaveBeenCalledTimes(1);
        expect(onTextureRemovedSpy).toHaveBeenCalledTimes(1);

        mt.dispose();
        expect(raw.dispose).toHaveBeenCalledTimes(1);
        expect(composite.disposed).toBe(true);
        // Second dispose is a no-op: the base contract must not fire again.
        expect(onDisposeSpy).toHaveBeenCalledTimes(1);
        expect(onTextureRemovedSpy).toHaveBeenCalledTimes(1);
    });

    it("watch: a changed etag triggers a forced reload of that layer only", async () => {
        vi.useFakeTimers();
        mockState.headers = { etag: "v1" };

        const { mt } = await createLoaded(["a.png"], { width: 8, height: 8, watch: true, pollInterval: 1000 });

        const uploadsBefore = mockState.upload.mock.calls.length;
        mockState.fetchCalls.length = 0;
        mockState.headers = { etag: "v2" };

        await vi.advanceTimersByTimeAsync(1000);

        const headCalls = mockState.fetchCalls.filter((c: any) => c.init?.method === "HEAD");
        expect(headCalls).toHaveLength(1);
        expect(headCalls[0].url).toBe("a.png");

        const newUploads = mockState.upload.mock.calls.slice(uploadsBefore);
        expect(newUploads).toHaveLength(1);
        expect(newUploads[0][2]).toBe(0);
        expect((mt as any)._layers[0].etag).toBe("v2");
    });

    it("watch: polling is skipped while the document is hidden", async () => {
        vi.useFakeTimers();
        vi.stubGlobal("document", { visibilityState: "hidden" });

        await createLoaded(["a.png"], { width: 8, height: 8, watch: true, pollInterval: 1000 });

        mockState.fetchCalls.length = 0;
        await vi.advanceTimersByTimeAsync(3000);

        expect(mockState.fetchCalls).toHaveLength(0);
    });

    it("watch off by default: no timer is created", async () => {
        const intervalSpy = vi.spyOn(globalThis, "setInterval");

        await createLoaded(["a.png"], { width: 8, height: 8 });

        expect(intervalSpy).not.toHaveBeenCalled();
    });

    it("surfaces the missing engine extension error via onError", async () => {
        const onError = vi.fn();
        mockState.engineExtMissing = true;

        const { mt } = await createLoaded(["a.png"], { width: 8, height: 8, onError });

        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError.mock.calls[0][0]).toContain("engine.texture2DArrayImageSource");
        expect((mt as any)._layers[0].loaded).toBe(false);
    });

    it("accepts a WebGPU engine and selects WGSL", async () => {
        const { mt } = await createLoaded(["a.png"], { width: 8, height: 8 }, { isWebGPU: true, webglVersion: 1 });

        expect(mt.composite.creationOptions.shaderLanguage).toBe(ShaderLanguage.WGSL);
    });

    it("does not attempt upload or log errors when a layer load lands after dispose", async () => {
        const { mt } = await createLoaded(["a.png"], { width: 8, height: 8 });

        const errorSpy = vi.spyOn(Logger, "Error").mockImplementation(() => undefined);

        mt.dispose();

        // Simulate the tail of an in-flight refresh whose decode completes after dispose.
        const entry = { url: "a.png", etag: null, lastModified: null, bitmap: null, pixels: null, loaded: false, generation: 0, warnedLoadFailure: false };
        await expect(mt["_loadEntry"](entry)).resolves.toBeUndefined();
        await expect(mt["_poll"]()).resolves.toBeUndefined();

        expect(errorSpy).not.toHaveBeenCalled();
        errorSpy.mockRestore();
    });

    it("finishes initialization quietly when disposed mid-decode", async () => {
        // Load the seed (harness scene) first; the pending-decode stub below must not park
        // the seed's own init.
        const { mt: seed } = await createLoaded(["seed.png"], { width: 8, height: 8 });

        let releaseImage: ((bitmap: ImageBitmap) => void) | undefined;
        const pendingImage = new Promise<ImageBitmap>((resolve) => {
            releaseImage = resolve;
        });
        vi.stubGlobal("createImageBitmap", () => pendingImage);

        const errorSpy = vi.spyOn(Logger, "Error").mockImplementation(() => undefined);

        const mt = new MultiTexture("myMultiTexture", ["late.png"], seed.getScene()!, { width: 8, height: 8 });
        mt.dispose();
        releaseImage?.({ close: vi.fn(), width: 8, height: 8 } as unknown as ImageBitmap);

        // Decode lands after dispose: init must settle quietly, retain no pixel data, and report nothing.
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(errorSpy).not.toHaveBeenCalled();
        expect(mt.pixels[0]).toBeNull();
        expect((mt as any)._layers.length).toBe(0);
        errorSpy.mockRestore();
    });
});

describe("MultiTexture 2D canvas surface", () => {
    it("sets canvas width/height from options on the HTMLCanvasElement path", async () => {
        const { mt } = await createLoaded(["canvas-size.png"], { width: 12, height: 7 });
        const canvas = (mt as any)._canvas;
        expect(canvas).not.toBeNull();
        expect(canvas.width).toBe(12);
        expect(canvas.height).toBe(7);
        mt.dispose();
    });

    it("throws a clear error when neither OffscreenCanvas nor document is available", async () => {
        const hadDocument = typeof (globalThis as any).document !== "undefined";
        const hadOffscreenCanvas = typeof (globalThis as any).OffscreenCanvas !== "undefined";
        if (hadDocument) {
            vi.stubGlobal("document", undefined);
        }
        if (hadOffscreenCanvas) {
            vi.stubGlobal("OffscreenCanvas", undefined);
        }
        try {
            await expect(Promise.resolve().then(() => createLoaded(["no-canvas.png"], { width: 4, height: 4 }))).rejects.toThrow(/no 2D canvas surface available/i);
        } finally {
            vi.unstubAllGlobals();
        }
    });
});

describe("MultiTexture updateLayerAsync bookkeeping", () => {
    it("updates urls[index] and the layer entry after a successful reload", async () => {
        const { mt } = await createLoaded(["old.png"], { width: 8, height: 8 });

        await mt.updateLayerAsync(0, "new.png");

        expect(mt.urls[0]).toBe("new.png");
        expect((mt as any)._layers[0].url).toBe("new.png");
        mt.dispose();
    });
});

describe("MultiTexture watch retry after failed initial load", () => {
    it("retries layers whose initial load failed instead of skipping them forever", async () => {
        const { mt } = await createLoaded(["flaky.png"], { width: 8, height: 8, watch: true, pollInterval: 1 });

        // Make the URL fail from this point on, then simulate a never-loaded layer
        // entry: no etag/lastModified recorded (and loaded=false, as after a failed
        // initial GET), so HEAD-based change detection cannot apply.
        mockState.urlBehaviors["flaky.png"] = "notok";
        const entry = (mt as any)._layers[0];
        entry.loaded = false;
        entry.etag = null;
        entry.lastModified = null;

        // The poller early-returns while the document is hidden; the mock document may be
        // frozen so defineProperty patches fail silently. Swap in a minimal visible document.
        const originalDocument = (globalThis as any).document;
        vi.stubGlobal("document", { visibilityState: "visible" });

        // Drive one poll tick deterministically instead of waiting on the interval.
        const loadSpy = vi.spyOn(mt as any, "_loadEntry");
        try {
            await (mt as any)._poll();
        } finally {
            if (originalDocument !== undefined) {
                vi.stubGlobal("document", originalDocument);
            } else {
                vi.unstubAllGlobals();
            }
        }
        // The never-loaded layer (etag/lastModified both null) must be retried by the poller
        // instead of being skipped forever.
        expect(loadSpy.mock.calls.some((c: any[]) => c[0] === entry)).toBe(true);
        loadSpy.mockRestore();

        mt.dispose();
    });
});

describe("MultiTexture watch poll overlap", () => {
    it("skips overlapping ticks instead of double-fetching, and releases the guard when the tick settles", async () => {
        vi.useFakeTimers();
        const { mt } = await createLoaded(["a.png"], { width: 8, height: 8, watch: true, pollInterval: 1000 });

        // Simulate a never-loaded layer (no validators recorded) so the poller takes the
        // full-load retry path for it.
        const entry = (mt as any)._layers[0];
        entry.loaded = false;
        entry.etag = null;
        entry.lastModified = null;

        // Gate the reload so a tick can be held in flight indefinitely.
        let releaseLoad: () => void = () => undefined;
        const gate = new Promise<void>((resolve) => {
            releaseLoad = resolve;
        });
        const loadSpy = vi.spyOn(mt as any, "_loadEntry").mockImplementation(async () => {
            await gate;
        });

        const fetchesBefore = mockState.fetchCalls.length;
        const poll1 = (mt as any)._poll();
        expect(loadSpy).toHaveBeenCalledTimes(1);

        // A second tick while the first is in flight must be a no-op: no second load,
        // no duplicate fetch.
        await (mt as any)._poll();
        expect(loadSpy).toHaveBeenCalledTimes(1);
        expect(mockState.fetchCalls.length).toBe(fetchesBefore);

        // Once the in-flight tick settles, the guard releases and polling resumes.
        releaseLoad();
        await poll1;
        await (mt as any)._poll();
        expect(loadSpy).toHaveBeenCalledTimes(2);

        loadSpy.mockRestore();
        mt.dispose();
    });
});

describe("MultiTexture insertLayerAsync", () => {
    it("inserts a loaded layer at index, shifts urls/pixels/layers and re-uploads shifted layers to their new slots", async () => {
        const { mt } = await createLoaded(["a.png", "b.png", "c.png"], { width: 8, height: 8, maxLayers: 4 });

        const initUploads = mockState.upload.mock.calls.slice();
        const bitmapB = initUploads.find((call: any[]) => call[2] === 1)[1];
        const bitmapC = initUploads.find((call: any[]) => call[2] === 2)[1];
        const uploadsBefore = mockState.upload.mock.calls.length;
        const setIntsBefore = mt.composite.setIntCalls.length;
        const rendersBefore = mt.composite.render.mock.calls.length;

        const newIndex = await mt.insertLayerAsync(1, "x.png");

        expect(newIndex).toBe(1);
        expect(mt.layerCount).toBe(4);
        expect(mt.urls).toEqual(["a.png", "x.png", "b.png", "c.png"]);
        expect(mt.pixels).toHaveLength(4);
        expect(mt.pixels[1]).toBeInstanceOf(Uint8ClampedArray);
        expect(mt.pixels[1]).toHaveLength(8 * 8 * 4);
        expect((mt as any)._layers.map((l: any) => l.url)).toEqual(["a.png", "x.png", "b.png", "c.png"]);

        // Shifted layers re-uploaded top-down to their new (higher) slots, then the new layer at index 1.
        const newUploads = mockState.upload.mock.calls.slice(uploadsBefore);
        expect(newUploads.map((c: any[]) => [c[1], c[2]])).toEqual([
            [bitmapC, 3],
            [bitmapB, 2],
            [expect.anything(), 1],
        ]);

        expect(mt.composite.setIntCalls.slice(setIntsBefore)).toEqual([["uLayerCount", 4]]);
        // The shift re-composites immediately AND the settling layer load re-composites again.
        expect(mt.composite.render.mock.calls.length).toBeGreaterThanOrEqual(rendersBefore + 1);
    });

    it("inserting at layerCount appends without any shift work (addLayerAsync-equivalent)", async () => {
        const { mt } = await createLoaded(["a.png"], { width: 8, height: 8, maxLayers: 2 });

        const uploadsBefore = mockState.upload.mock.calls.length;

        const newIndex = await mt.insertLayerAsync(1, "b.png");

        expect(newIndex).toBe(1);
        expect(mt.layerCount).toBe(2);
        expect(mt.urls).toEqual(["a.png", "b.png"]);
        // Array is not full, so no growth; only the new layer is uploaded.
        expect(mt.arrayTexture.depth).toBe(2);
        const newUploads = mockState.upload.mock.calls.slice(uploadsBefore);
        expect(newUploads).toHaveLength(1);
        expect(newUploads[0][2]).toBe(1);
    });

    it("grows the array when full, re-binds uLayers and re-uploads into the new array", async () => {
        const { mt } = await createLoaded(["a.png", "b.png"], { width: 8, height: 8, maxLayers: 2 });

        const oldRaw = mockState.rawInstances[0];
        const initUploads = mockState.upload.mock.calls.slice();
        const bitmapA = initUploads.find((call: any[]) => call[2] === 0)[1];
        const bitmapB = initUploads.find((call: any[]) => call[2] === 1)[1];
        const uploadsBefore = mockState.upload.mock.calls.length;

        await mt.insertLayerAsync(1, "x.png");

        expect(mt.layerCount).toBe(3);
        expect(mt.urls).toEqual(["a.png", "x.png", "b.png"]);

        const newRaw = mockState.rawInstances[1];
        expect(newRaw.depth).toBe(4);
        expect(oldRaw.dispose).toHaveBeenCalledTimes(1);
        expect(mt.arrayTexture).toBe(newRaw);
        expect(mt.composite.setTextureCalls).toContainEqual(["uLayers", newRaw]);

        // Growth re-uploads A,B into the new array, the shift moves B to slot 2, then x loads at 1.
        const newUploads = mockState.upload.mock.calls.slice(uploadsBefore);
        expect(newUploads.map((c: any[]) => [c[1], c[2]])).toEqual([
            [bitmapA, 0],
            [bitmapB, 1],
            [bitmapB, 2],
            [expect.anything(), 1],
        ]);
        expect(newUploads.every((c: any[]) => c[0] === newRaw.getInternalTexture())).toBe(true);
        expect(mt.composite.defines).toContain("#define MULTITEXTURE_MAXLAYERS 128");
    });

    it("refuses to grow beyond the device cap and leaves state untouched", async () => {
        const onError = vi.fn();
        const { mt } = await createLoaded(["a.png", "b.png"], { width: 8, height: 8, maxLayers: 2, onError }, { texture2DArrayMaxLayerCount: 2 });

        const rawsBefore = mockState.rawInstances.length;
        await expect(mt.insertLayerAsync(1, "x.png")).rejects.toThrow(
            "MultiTexture: cannot grow the array from depth 2 to 4: the device limit texture2DArrayMaxLayerCount is 2. Remove a layer, or recreate the MultiTexture with a larger options.maxLayers (<= 2) to allow more growth headroom."
        );

        expect(mockState.rawInstances).toHaveLength(rawsBefore);
        expect(mt.layerCount).toBe(2);
        expect(mt.urls).toEqual(["a.png", "b.png"]);
        expect(mt.pixels).toHaveLength(2);
        expect(onError).toHaveBeenCalledTimes(1);
    });

    it("throws RangeError for out-of-range or non-integer index without loading anything", async () => {
        const { mt } = await createLoaded(["a.png", "b.png"], { width: 8, height: 8 });

        await expect(mt.insertLayerAsync(3, "x.png")).rejects.toThrow(RangeError);
        await expect(mt.insertLayerAsync(3, "x.png")).rejects.toThrow("MultiTexture: layer index 3 out of range [0, 2].");
        await expect(mt.insertLayerAsync(-1, "x.png")).rejects.toThrow(RangeError);
        await expect(mt.insertLayerAsync(1.5, "x.png")).rejects.toThrow(RangeError);

        // No state change and no new fetches from the rejected insertions.
        expect(mt.layerCount).toBe(2);
        expect(mt.urls).toEqual(["a.png", "b.png"]);
        expect(mt.pixels).toHaveLength(2);
        expect(mockState.fetchCalls.map((c: any) => c.url)).toEqual(["a.png", "b.png"]);
    });

    it("reports a failed load via onError and keeps the unpopulated entry in place", async () => {
        const onError = vi.fn();
        mockState.urlBehaviors["bad.png"] = "notok";

        const { mt } = await createLoaded(["a.png", "c.png"], { width: 8, height: 8, maxLayers: 3, onError });

        const initUploads = mockState.upload.mock.calls.slice();
        const bitmapC = initUploads.find((call: any[]) => call[2] === 1)[1];
        const uploadsBefore = mockState.upload.mock.calls.length;
        const setIntsBefore = mt.composite.setIntCalls.length;

        await expect(mt.insertLayerAsync(1, "bad.png")).rejects.toThrow("MultiTexture: failed to fetch bad.png: 500 Internal Server Error");

        expect(onError).toHaveBeenCalledTimes(1);
        // The failed entry stays in place (addLayerAsync semantics); the shifted layer still landed.
        expect(mt.urls).toEqual(["a.png", "bad.png", "c.png"]);
        expect(mt.layerCount).toBe(3);
        expect(mt.pixels).toHaveLength(3);
        expect(mt.pixels[1]).toBeNull();
        expect((mt as any)._layers[1].loaded).toBe(false);
        expect((mt as any)._layers.map((l: any) => l.warnedLoadFailure)).toEqual([false, false, false]);

        const newUploads = mockState.upload.mock.calls.slice(uploadsBefore);
        expect(newUploads.map((c: any[]) => [c[1], c[2]])).toEqual([[bitmapC, 2]]);
        expect(mt.composite.setIntCalls.slice(setIntsBefore)).toEqual([["uLayerCount", 3]]);
    });
});

describe("MultiTexture structure changes racing in-flight loads", () => {
    it("inserting while initial layers are still loading lands every layer in its final slot", async () => {
        const { scene, resolvers } = deferredScene();

        // Mirrors the field report: 2 initial urls (array depth 2, so the insert grows it),
        // insertLayerAsync called before any initial load has settled.
        const mt = new MultiTexture("mt", ["rock.png", "star.png"], scene, { width: 8, height: 8 }) as MockMultiTexture;
        expect(mockState.upload.mock.calls).toHaveLength(0);

        const inserted = mt.insertLayerAsync(1, "circle.png");

        // Star (shifted 1 -> 2) settles first: must land in its NEW slot 2, not in slot 1.
        resolvers["star.png"]();
        await tick();
        resolvers["rock.png"]();
        await tick();
        resolvers["circle.png"]();
        await inserted;

        const uploads = mockState.upload.mock.calls as any[];
        const lastForLayer = (layer: number) => uploads.filter((c) => c[2] === layer).pop()[1].url;
        expect(lastForLayer(0)).toBe("rock.png");
        expect(lastForLayer(1)).toBe("circle.png");
        expect(lastForLayer(2)).toBe("star.png");
        // The original bug: the in-flight star upload must never touch the inserted layer's slot.
        expect(uploads.some((c) => c[2] === 1 && c[1].url === "star.png")).toBe(false);

        expect(mt.arrayTexture.depth).toBe(4);
        expect(mt.urls).toEqual(["rock.png", "circle.png", "star.png"]);
        expect((mt as any)._layers.map((l: any) => l.url)).toEqual(["rock.png", "circle.png", "star.png"]);
        expect((mt as any)._layers[2].bitmap.url).toBe("star.png");
        expect((mt as any)._layers[1].bitmap.url).toBe("circle.png");
        expect(mt.pixels).toHaveLength(3);
        expect(mt.pixels.every((p: any) => p instanceof Uint8ClampedArray)).toBe(true);
    });

    it("removeLayerAsync discards the removed layer's in-flight load and lets the shifted one land in its new slot", async () => {
        const { scene, resolvers, bitmaps } = deferredScene();

        const mt = new MultiTexture("mt", ["a.png", "b.png"], scene, { width: 8, height: 8 }) as MockMultiTexture;

        mt.removeLayerAsync(0);

        // a's in-flight load settles after its entry was removed: dropped, nothing uploaded.
        resolvers["a.png"]();
        await tick();
        // b (shifted 1 -> 0) settles: lands in its new slot 0.
        resolvers["b.png"]();
        await tick();

        expect(mockState.upload.mock.calls.map((c: any[]) => [c[1].url, c[2]])).toEqual([["b.png", 0]]);
        expect(mt.urls).toEqual(["b.png"]);
        expect((mt as any)._layers[0].bitmap.url).toBe("b.png");
        expect(bitmaps.find((b) => b.url === "a.png").close).toHaveBeenCalledTimes(1);
    });

    it("an older in-flight load cannot overwrite a newer updateLayerAsync load", async () => {
        const { scene, resolvers, bitmaps } = deferredScene();

        const mt = new MultiTexture("mt", ["a.png"], scene, { width: 8, height: 8 }) as MockMultiTexture;

        // a's initial load is still in flight when the entry is repointed at b.
        const updated = mt.updateLayerAsync(0, "b.png");

        resolvers["a.png"]();
        await tick();
        resolvers["b.png"]();
        await updated;
        await tick();

        expect(mockState.upload.mock.calls.map((c: any[]) => [c[1].url, c[2]])).toEqual([["b.png", 0]]);
        expect((mt as any)._layers[0].bitmap.url).toBe("b.png");
        expect(bitmaps.find((b) => b.url === "a.png").close).toHaveBeenCalledTimes(1);
        expect(mt.pixels.every((p: any) => p instanceof Uint8ClampedArray)).toBe(true);
    });

    it("a newer same-url load supersedes the older in-flight load via the generation token", async () => {
        // Same url as the in-flight initial load: a url comparison cannot tell the two loads
        // apart, only the per-layer generation token can. Fetches queue per url so both can
        // stay pending and be released together.
        const queues: Record<string, Array<() => void>> = {};
        vi.stubGlobal(
            "fetch",
            (url: string) =>
                new Promise((resolve) => {
                    mockState.fetchCalls.push({ url });
                    (queues[url] ?? (queues[url] = [])).push(() =>
                        resolve({
                            ok: true,
                            status: 200,
                            statusText: "OK",
                            headers: { get: () => null },
                            blob: async () => ({ __url: url }),
                        })
                    );
                })
        );
        const bitmaps: any[] = [];
        mockState.decodeImpl = (source: any) => {
            const bitmap = { width: 8, height: 8, close: vi.fn(), url: source.__url };
            bitmaps.push(bitmap);
            return bitmap;
        };

        const mt = new MultiTexture("mt", ["a.png"], makeScene(), { width: 8, height: 8 }) as MockMultiTexture;

        // The update reuses the SAME url as the in-flight initial load (gen 1 -> gen 2).
        const updated = mt.updateLayerAsync(0, "a.png");

        // Both fetches settle: the initial load must be dropped, only the update commits.
        (queues["a.png"] ?? []).slice().forEach((fn) => fn());
        await updated;
        await tick();

        expect(mockState.upload.mock.calls.map((c: any[]) => [c[1].url, c[2]])).toEqual([["a.png", 0]]);
        expect(bitmaps).toHaveLength(2);
        expect(bitmaps[0].close).toHaveBeenCalledTimes(1); // superseded initial load dropped
        expect(bitmaps[1].close).not.toHaveBeenCalled();
        expect((mt as any)._layers[0].bitmap).toBe(bitmaps[1]);
    });
});

describe("MultiTexture mid-flight array growth and watch races", () => {
    it("generates mips on the live array texture after a mid-pool grow, not on the disposed capture", async () => {
        const { scene, resolvers } = deferredScene();
        let resolveLoad!: () => void;
        const loaded = new Promise<void>((resolve) => (resolveLoad = resolve));

        const mt = new MultiTexture("mt", ["a.png", "b.png"], scene, {
            width: 8,
            height: 8,
            maxLayers: 2,
            generateMipMaps: true,
            onLoad: () => resolveLoad(),
        }) as MockMultiTexture;

        const oldRaw = mockState.rawInstances[0];

        // addLayerAsync hits the capacity while the init pool is still running: the array grows
        // (old raw disposed, new raw bound) before any initial load has settled.
        const added = mt.addLayerAsync("c.png");
        const newRaw = mockState.rawInstances[1];
        expect(oldRaw.dispose).toHaveBeenCalledTimes(1);

        resolvers["a.png"]();
        await tick();
        resolvers["b.png"]();
        await tick();
        resolvers["c.png"]();
        await Promise.all([added, loaded]);

        // The final mip generation must target the LIVE array's internal texture: the capture
        // taken before the pool was disposed by the grow and would leave the live array unmipped.
        expect(mockState.generateMipmaps).toHaveBeenCalledTimes(1);
        expect(mockState.generateMipmaps.mock.calls[0][0]).toBe(newRaw.getInternalTexture());
        expect(newRaw.getInternalTexture().generateMipMaps).toBe(true);

        // Every layer's final upload landed in the live array.
        const uploads = mockState.upload.mock.calls as any[];
        const lastForLayer = (layer: number) => uploads.filter((c) => c[2] === layer).pop();
        expect(lastForLayer(0)[1].url).toBe("a.png");
        expect(lastForLayer(1)[1].url).toBe("b.png");
        expect(lastForLayer(2)[1].url).toBe("c.png");
        expect(lastForLayer(0)[0]).toBe(newRaw.getInternalTexture());
        expect(lastForLayer(1)[0]).toBe(newRaw.getInternalTexture());
        expect(lastForLayer(2)[0]).toBe(newRaw.getInternalTexture());
    });

    it("drops a watch reload whose layer was removed mid-tick", async () => {
        // Fetches (initial GET, HEAD checks, reload GETs) stay pending until released, so a
        // removeLayerAsync can land between a poll tick's snapshot and its reload's settle.
        const headResolvers: Array<() => void> = [];
        const getResolvers: Array<() => void> = [];
        vi.stubGlobal(
            "fetch",
            (url: string, init?: any) =>
                new Promise((resolve) => {
                    mockState.fetchCalls.push({ url, init });
                    const isHead = init?.method === "HEAD";
                    const queue = isHead ? headResolvers : getResolvers;
                    const getOrdinal = queue.length;
                    queue.push(() =>
                        resolve({
                            ok: true,
                            status: 200,
                            statusText: "OK",
                            // Initial GET records v1; the later HEAD reports v2 (changed);
                            // the reload GET would serve v2.
                            headers: { get: () => (isHead ? "v2" : getOrdinal === 0 ? "v1" : "v2") },
                            blob: async () => ({ __url: url }),
                        })
                    );
                })
        );
        const bitmaps: any[] = [];
        mockState.decodeImpl = (source: any) => {
            const bitmap = { width: 8, height: 8, close: vi.fn(), url: source.__url };
            bitmaps.push(bitmap);
            return bitmap;
        };

        const scene = makeScene();
        const mt = new MultiTexture("mt", ["a.png"], scene, { width: 8, height: 8, watch: true, pollInterval: 100000 }) as MockMultiTexture;

        // Settle the initial GET: entry records etag v1.
        getResolvers[0]();
        await tick();
        expect((mt as any)._layers[0].etag).toBe("v1");
        expect(mockState.upload.mock.calls).toHaveLength(1);

        // Start a poll tick (snapshots the entry, issues the pending HEAD), then remove the
        // layer BEFORE the HEAD settles.
        const poll = (mt as any)._poll();
        await mt.removeLayerAsync(0);
        expect(headResolvers).toHaveLength(1);

        // HEAD settles: etag changed -> reload starts for the now-removed entry.
        headResolvers[0]();
        await tick();
        expect(getResolvers).toHaveLength(2);

        // Reload settles: the entry is gone, so the decode must be dropped, not uploaded.
        getResolvers[1]();
        await poll;
        await tick();

        // Only the initial upload ever happened; the reload's bitmap was dropped.
        expect(mockState.upload.mock.calls).toHaveLength(1);
        expect(bitmaps).toHaveLength(2);
        expect(bitmaps[1].close).toHaveBeenCalledTimes(1);
        expect(mt.layerCount).toBe(0);
    });
});

describe("MultiTexture removeLayerAsync GPU alignment", () => {
    // NOTE: full GPU-shift verification (every shifted layer re-uploaded to its new array
    // index) needs a real WebGL2/WebGPU harness; the headless suite's _arrayTexture wrapper
    // exposes no spiable upload seam. CPU alignment invariants are guarded here.
    it("keeps CPU layer state aligned when a non-last layer is removed", async () => {
        const { mt } = await createLoaded(["a.png", "b.png", "c.png"], { width: 8, height: 8 });

        mt.removeLayerAsync(0);

        expect(mt.urls).toEqual(["b.png", "c.png"]);
        expect((mt as any)._layerCount).toBe(2);
        expect((mt as any)._layers[0].url).toBe("b.png");
        expect((mt as any)._layers[1].url).toBe("c.png");

        mt.dispose();
    });
});

describe("MultiTexture clone", () => {
    it("returns a fresh MultiTexture with a fresh internal composite (not a plain ProceduralTexture)", async () => {
        const { mt, scene } = await createLoaded(["a.png", "b.png"], { width: 8, height: 8 });

        const clone = mt.clone() as MockMultiTexture;

        expect(clone).toBeInstanceOf(MultiTexture);
        expect(clone).not.toBe(mt);
        expect(clone.name).toBe("myMultiTexture");
        // Neither the original nor the clone registers in the scene's procedural list
        // (skipSceneRegistration); the composite is scene-independent.
        expect(scene.proceduralTextures).toHaveLength(0);
        // A fresh internal composite is created under the original name, like the base-class clone contract.
        expect(mockState.ptInstances).toHaveLength(2);
        expect(mockState.ptInstances[1].name).toBe("myMultiTexture");
    });

    it("keeps an independent copy of urls and the same layer count", async () => {
        const { mt } = await createLoaded(["a.png", "b.png"], { width: 8, height: 8 });

        const clone = mt.clone();

        expect(clone.urls).toEqual(["a.png", "b.png"]);
        expect(clone.urls).not.toBe(mt.urls);
        expect(clone.layerCount).toBe(2);
    });

    it("allocates its own 2D array texture and canvas (no shared GPU/CPU resources)", async () => {
        const { mt } = await createLoaded(["a.png", "b.png"], { width: 8, height: 8 });

        const rawsBefore = mockState.rawInstances.length;
        const clone = mt.clone();

        expect(mockState.rawInstances).toHaveLength(rawsBefore + 1);
        expect(clone.arrayTexture).not.toBe(mt.arrayTexture);
        expect((clone as any)._canvas).not.toBeNull();
        expect((clone as any)._canvas).not.toBe((mt as any)._canvas);
    });

    it("preserves resolved options: dimensions, capacity, blend mode, sampling mode, mipmaps and rttScale", async () => {
        const { mt } = await createLoaded(["a.png", "b.png"], {
            width: 16,
            height: 8,
            maxLayers: 5,
            blendMode: MultiBlendMode.ADD,
            samplingMode: 1,
            generateMipMaps: true,
            rttScale: 2,
        });

        const clone = mt.clone() as MockMultiTexture;
        // The init pipeline toggles the mipmap flag off while loading and restores it once settled,
        // so assert after the clone's initial load completes.
        vi.spyOn(clone.onLoadObservable, "notifyObservers").mockImplementation(() => true);
        await vi.waitFor(() => expect(clone.onLoadObservable.notifyObservers).toHaveBeenCalled());
        const newRaw = mockState.rawInstances[mockState.rawInstances.length - 1];
        const newPt = mockState.ptInstances[mockState.ptInstances.length - 1];

        // Layer resolution, array capacity and sampling mode re-allocated, not copied by reference.
        expect(newRaw.width).toBe(16);
        expect(newRaw.height).toBe(8);
        expect(newRaw.depth).toBe(5);
        expect(newRaw.samplingMode).toBe(1);
        expect(newRaw.getInternalTexture().generateMipMaps).toBe(true);
        // RTT resolution = width*rttScale x height*rttScale must be re-derived for the clone.
        expect(newPt.size).toEqual({ width: 32, height: 16 });
        expect(clone.blendMode).toBe(MultiBlendMode.ADD);
        expect(newPt.setFragmentCalls[0]).toBe("multiTextureCompositeAdd");
        expect(newPt.defines).toContain("#define MULTITEXTURE_MAXLAYERS 128");
        expect(newPt.defines).toContain("#define MULTITEXTURE_BLEND_ADD");
    });

    it("re-fetches and re-decodes its layers from the urls and repopulates the pixel cache", async () => {
        const { mt } = await createLoaded(["a.png", "b.png"], { width: 8, height: 8 });

        const fetchesBefore = mockState.fetchCalls.length;
        const decodesBefore = mockState.decodeCalls.length;
        const clone = mt.clone() as MockMultiTexture;
        vi.spyOn(clone.onLoadObservable, "notifyObservers").mockImplementation(() => true);

        // The clone starts its own initial load for every url (in layer order).
        expect(mockState.fetchCalls.slice(fetchesBefore).map((c: any) => c.url)).toEqual(["a.png", "b.png"]);

        await vi.waitFor(() => expect(clone.onLoadObservable.notifyObservers).toHaveBeenCalled());
        expect(mockState.decodeCalls.length).toBe(decodesBefore + 2);
        expect(clone.pixels[0]).toBeInstanceOf(Uint8ClampedArray);
        expect(clone.pixels[1]).toBeInstanceOf(Uint8ClampedArray);
    });

    it("preserves premultiplyAlpha and fit through the load pipeline", async () => {
        const { mt } = await createLoaded(["a.png"], { width: 8, height: 8, premultiplyAlpha: true, fit: "strict" });

        const decodesBefore = mockState.decodeCalls.length;
        const uploadsBefore = mockState.upload.mock.calls.length;
        const clone = mt.clone() as MockMultiTexture;
        vi.spyOn(clone.onLoadObservable, "notifyObservers").mockImplementation(() => true);

        await vi.waitFor(() => expect(clone.onLoadObservable.notifyObservers).toHaveBeenCalled());

        // fit: "strict" -> decode without resize options but matching the requested alpha mode
        // (premultiplyAlpha: true -> premultiplied decode); the upload flag stays true.
        const cloneDecodes = mockState.decodeCalls.slice(decodesBefore);
        expect(cloneDecodes).toHaveLength(1);
        expect(cloneDecodes[0].opts).toEqual({ premultiplyAlpha: "premultiply" });
        const cloneUploads = mockState.upload.mock.calls.slice(uploadsBefore);
        expect(cloneUploads).toHaveLength(1);
        expect(cloneUploads[0][4]).toBe(true);
    });

    it("preserves the current blend mode and grown capacity after construction", async () => {
        const { mt } = await createLoaded(["a.png", "b.png"], { width: 8, height: 8, maxLayers: 2 });

        await mt.addLayerAsync("c.png");
        expect(mt.arrayTexture.depth).toBe(4);
        mt.blendMode = MultiBlendMode.SCREEN;

        const clone = mt.clone() as MockMultiTexture;
        const newRaw = mockState.rawInstances[mockState.rawInstances.length - 1];

        expect(clone.urls).toEqual(["a.png", "b.png", "c.png"]);
        expect(clone.layerCount).toBe(3);
        // Capacity follows the current (grown) depth, not the construction-time one.
        expect(newRaw.depth).toBe(4);
        expect(clone.blendMode).toBe(MultiBlendMode.SCREEN);
        expect((clone as MockMultiTexture).composite.defines).toContain("#define MULTITEXTURE_MAXLAYERS 128");
        expect((clone as MockMultiTexture).composite.defines).toContain("#define MULTITEXTURE_BLEND_SCREEN");
    });

    it("does not inherit onLoad/onError callbacks from the original", async () => {
        const onError = vi.fn();
        mockState.urlBehaviors["bad.png"] = "notok";

        const { mt } = await createLoaded(["bad.png"], { width: 8, height: 8, onError });
        expect(onError).toHaveBeenCalledTimes(1);

        const clone = mt.clone() as MockMultiTexture;
        vi.spyOn(clone.onLoadObservable, "notifyObservers").mockImplementation(() => true);
        await vi.waitFor(() => expect(clone.onLoadObservable.notifyObservers).toHaveBeenCalled());

        // The clone re-ran the failing load, but its error must not reach the original's callbacks.
        expect(onError).toHaveBeenCalledTimes(1);
    });

    it("inherits watch mode and poll interval from the original", async () => {
        vi.useFakeTimers();
        mockState.headers = { etag: "v1" };

        const { mt } = await createLoaded(["a.png"], { width: 8, height: 8, watch: true, pollInterval: 500 });

        const clone = mt.clone() as MockMultiTexture;
        // Flush the clone's init so its poller starts before the poll window below.
        await vi.advanceTimersByTimeAsync(10);
        expect((clone as any)._pollTimer).not.toBeNull();

        mockState.fetchCalls.length = 0;
        await vi.advanceTimersByTimeAsync(1100); // two 500 ms poll ticks

        // Original and clone both poll at the inherited 500 ms interval: one HEAD per texture per tick.
        const headCalls = mockState.fetchCalls.filter((c: any) => c.init?.method === "HEAD");
        expect(headCalls).toHaveLength(4);
        expect(headCalls.every((c: any) => c.url === "a.png")).toBe(true);
    });

    it("copies base-texture properties (hasAlpha, level, coordinatesMode)", async () => {
        const { mt } = await createLoaded(["a.png"], { width: 8, height: 8 });
        mt.hasAlpha = true;
        mt.level = 5;
        mt.coordinatesMode = 2;

        const clone = mt.clone();

        expect(clone.hasAlpha).toBe(true);
        expect(clone.level).toBe(5);
        expect(clone.coordinatesMode).toBe(2);
    });
});

describe("MultiTexture serialize", () => {
    it("throws an explicit unsupported error instead of inheriting the misleading base serialization", async () => {
        const { mt } = await createLoaded(["a.png"], { width: 8, height: 8 });

        expect(() => mt.serialize()).toThrow(/MultiTexture/);
        expect(() => mt.serialize()).toThrow(/not supported/);
        expect(() => mt.serialize(true)).toThrow(/not supported/);
    });
});
