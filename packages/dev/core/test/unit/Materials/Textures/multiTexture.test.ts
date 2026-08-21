import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Logger } from "core/Misc/logger";
import { MultiTexture } from "core/Materials/Textures/multiTexture.pure";
import { MultiBlendMode } from "core/Materials/Textures/multiTexture.types";
import { type Scene } from "core/scene";

/** MultiTexture whose (mocked) ProceduralTexture base exposes call-recording props. */
type MockMultiTexture = MultiTexture & {
    setTextureCalls: [string, unknown][];
    setIntCalls: [string, number][];
    setFragmentCalls: string[];
    resetCount: number;
    creationOptions: any;
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
        public onLoadObservable = { notifyObservers: vi.fn() };
        private _currentRefreshId = -1;
        private _frameId = -1;
        private _scene: any;
        constructor(name: string, size: unknown, fragment: string, scene: any, options: any, _generateMipMaps?: boolean, _isCube?: boolean, _textureType?: number) {
            this._scene = scene;
            this.creationOptions = options;
            this.shaderLanguage = options?.shaderLanguage;
            this.setFragmentCalls.push(fragment);
            if (scene && Array.isArray(scene.proceduralTextures)) {
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
            private _internal: { generateMipMaps: boolean };
            constructor(_data: unknown, _width: number, _height: number, depth: number, _format: number, _scene: unknown, generateMipMaps = true) {
                this.depth = depth;
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

function makeScene(opts?: { webglVersion?: number; isWebGPU?: boolean }): Scene {
    const engine: any = {
        isWebGPU: opts?.isWebGPU ?? false,
        webGLVersion: opts?.webglVersion ?? 2,
        generateMipmaps: mockState.generateMipmaps,
        createEffect: mockState.createEffect,
    };
    return { getEngine: () => engine, proceduralTextures: [] as any[] } as Scene;
}

function createLoaded(urls: string[], options: any, sceneOpts?: { webglVersion?: number; isWebGPU?: boolean }): Promise<{ mt: MockMultiTexture; scene: any }> {
    const scene = makeScene(sceneOpts);
    let resolveLoad!: () => void;
    const loaded = new Promise<void>((resolve) => (resolveLoad = resolve));
    const mt = new MultiTexture(urls, scene, { ...options, onLoad: () => resolveLoad() }) as MockMultiTexture;
    return loaded.then(() => ({ mt, scene }));
}

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

    vi.stubGlobal(
        "fetch",
        (url: string, init?: any) => {
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
        }
    );

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

        expect(scene.proceduralTextures).toContain(mt);
        expect(mt.arrayTexture.depth).toBe(2);
        expect(mt.refreshRate).toBe(0);

        expect(mt.setTextureCalls).toContainEqual(["uLayers", expect.anything()]);
        expect(mt.setIntCalls).toContainEqual(["uLayerCount", 2]);
        expect(mt.urls).toEqual(["a.png", "b.png"]);
        expect(mt.layerCount).toBe(2);
    });

    it("throws on a WebGL1 engine and allocates nothing", () => {
        const scene = makeScene({ webglVersion: 1 });

        expect(() => new MultiTexture(["a.png"], scene, { width: 8, height: 8 })).toThrow(/requires WebGL2/);
        expect(scene.proceduralTextures).toHaveLength(0);
        expect(mockState.rawInstances).toHaveLength(0);
    });

    it("throws on non-positive dimensions", () => {
        const scene = makeScene();

        expect(() => new MultiTexture(["a.png"], scene, { width: 0, height: 8 })).toThrow("MultiTexture: width and height must be positive integers.");
    });

    it("throws when maxLayers < urls.length", () => {
        const scene = makeScene();

        expect(() => new MultiTexture(["a.png", "b.png"], scene, { width: 8, height: 8, maxLayers: 1 })).toThrow("MultiTexture: maxLayers (1) must be >= urls.length (2).");
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

    it("skips the CPU pixel cache when keepPixels is false", async () => {
        const { mt } = await createLoaded(["a.png"], { width: 8, height: 8, keepPixels: false });

        expect(mt.pixels[0]).toBeNull();
        expect(mockState.ctx.getImageData).not.toHaveBeenCalled();
    });

    it("rejects mismatched dimensions in strict mode and closes the bitmap", async () => {
        const onError = vi.fn();
        const badBitmap = { width: 16, height: 8, close: vi.fn() };
        mockState.decodeImpl = () => badBitmap;

        const { mt } = await createLoaded(["a.png"], { width: 8, height: 8, fit: "strict", onError });

        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError.mock.calls[0][0]).toBe("MultiTexture: layer 0 (a.png) is 16x8, expected 8x8. Use fit: \"resize\" to auto-scale.");
        expect(badBitmap.close).toHaveBeenCalled();
        expect((mt as any)._layers[0].loaded).toBe(false);
    });

    it("rescales during decode by default", async () => {
        await createLoaded(["a.png"], { width: 32, height: 16 });

        expect(mockState.decodeCalls[0].opts).toEqual({ resizeWidth: 32, resizeHeight: 16, resizeQuality: "high" });
    });

    it("updateLayerAsync(url) re-uploads only that layer without touching uLayerCount", async () => {
        const { mt } = await createLoaded(["a.png", "b.png"], { width: 8, height: 8 });

        const uploadsBefore = mockState.upload.mock.calls.length;
        const resetsBefore = mt.resetCount;
        const setIntsBefore = mt.setIntCalls.length;
        mockState.fetchCalls.length = 0;

        await mt.updateLayerAsync(0, "new.png");

        expect(mockState.fetchCalls.map((c: any) => c.url)).toEqual(["new.png"]);
        const newCalls = mockState.upload.mock.calls.slice(uploadsBefore);
        expect(newCalls).toHaveLength(1);
        expect(newCalls[0][2]).toBe(0);
        expect(mt.setIntCalls.length).toBe(setIntsBefore);
        expect(mt.resetCount).toBe(resetsBefore + 1);
    });

    it("updateLayer with an out-of-range index throws RangeError", async () => {
        const { mt } = await createLoaded(["a.png", "b.png"], { width: 8, height: 8 });

        await expect(mt.updateLayerAsync(5, "x.png")).rejects.toThrow(RangeError);
        await expect(mt.updateLayerAsync(5, "x.png")).rejects.toThrow("MultiTexture: layer index 5 out of range [0, 2).");
    });

    it("addLayer beyond maxLayers grows the array and re-uploads existing layers", async () => {
        const { mt } = await createLoaded(["a.png", "b.png"], { width: 8, height: 8, maxLayers: 2 });

        const oldRaw = mockState.rawInstances[0];
        const initUploads = mockState.upload.mock.calls.slice();
        const bitmapA = initUploads.find((call: any[]) => call[2] === 0)[1];
        const bitmapB = initUploads.find((call: any[]) => call[2] === 1)[1];
        const uploadsBefore = mockState.upload.mock.calls.length;
        const setTextureBefore = mt.setTextureCalls.length;
        const setIntBefore = mt.setIntCalls.length;

        const newIndex = await mt.addLayer("c.png");

        expect(newIndex).toBe(2);
        expect(mt.layerCount).toBe(3);
        expect(mt.urls).toEqual(["a.png", "b.png", "c.png"]);
        expect(mt.pixels).toHaveLength(3);

        // The uLayerCount uniform must advance to 3 or the new layer is never sampled by the shader.
        expect(mt.setIntCalls.slice(setIntBefore)).toContainEqual(["uLayerCount", 3]);

        // New array at doubled depth; old one disposed and rebound.
        const newRaw = mockState.rawInstances[1];
        expect(newRaw.depth).toBe(4);
        expect(oldRaw.dispose).toHaveBeenCalledTimes(1);
        expect(mt.arrayTexture).toBe(newRaw);
        const newSetTextures = mt.setTextureCalls.slice(setTextureBefore);
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

        // Defines rewritten for the wider loop bound.
        expect(mt.defines).toContain("#define MULTITEXTURE_MAXLAYERS 4");
    });

    it("removeLayer shifts layers down, re-uploads them and decrements uLayerCount", async () => {
        const { mt } = await createLoaded(["a.png", "b.png", "c.png"], { width: 8, height: 8, maxLayers: 3 });

        const initUploads = mockState.upload.mock.calls.slice();
        const bitmapA = initUploads.find((call: any[]) => call[2] === 0)[1];
        const bitmapB = initUploads.find((call: any[]) => call[2] === 1)[1];
        const uploadsBefore = mockState.upload.mock.calls.length;
        const setIntsBefore = mt.setIntCalls.length;
        const resetsBefore = mt.resetCount;

        await mt.removeLayer(0);

        expect(mt.layerCount).toBe(2);
        expect(mt.urls).toEqual(["b.png", "c.png"]);
        expect(mt.pixels).toHaveLength(2);
        expect(bitmapA.close).toHaveBeenCalledTimes(1);

        // Only slot 0 needs re-uploading (old layer 1); slot 1 still holds old layer 2's pixels.
        const newUploads = mockState.upload.mock.calls.slice(uploadsBefore);
        expect(newUploads).toHaveLength(1);
        expect(newUploads[0][1]).toBe(bitmapB);
        expect(newUploads[0][2]).toBe(0);

        expect(mt.setIntCalls.slice(setIntsBefore)).toEqual([["uLayerCount", 2]]);

        // A re-composite must be scheduled even when the shift re-uploads layers, so the result
        // is not left stale.
        expect(mt.resetCount).toBe(resetsBefore + 1);
    });

    it("removeLayer with an out-of-range index throws RangeError", async () => {
        const { mt } = await createLoaded(["a.png", "b.png", "c.png"], { width: 8, height: 8, maxLayers: 3 });

        await expect(mt.removeLayer(9)).rejects.toThrow(RangeError);
        await expect(mt.removeLayer(9)).rejects.toThrow("MultiTexture: layer index 9 out of range [0, 3).");
    });

    it("blendMode swap swaps the fragment, rewrites defines and triggers one re-composite", async () => {
        const { mt } = await createLoaded(["a.png"], { width: 8, height: 8 });

        const fragmentsBefore = mt.setFragmentCalls.length;
        const resetsBefore = mt.resetCount;

        mt.blendMode = MultiBlendMode.ADD;

        expect(mt.setFragmentCalls.slice(fragmentsBefore)).toEqual(["multiTextureCompositeAdd"]);
        expect(mt.defines).toContain("#define MULTITEXTURE_BLEND_ADD");
        expect(mt.resetCount).toBe(resetsBefore + 1);

        // Setting the same value again is a no-op.
        mt.blendMode = MultiBlendMode.ADD;
        expect(mt.setFragmentCalls.length).toBe(fragmentsBefore + 1);
        expect(mt.resetCount).toBe(resetsBefore + 1);
    });

    it("defaults to ALPHA_BLEND (running mix) when no blendMode is given", async () => {
        const { mt } = await createLoaded(["a.png", "b.png"], { width: 8, height: 8 });

        expect(mt.blendMode).toBe(MultiBlendMode.ALPHA_BLEND);
        // The composite effect is built with the alpha-blend fragment and its defines flag.
        expect(mt.setFragmentCalls[0]).toBe("multiTextureCompositeAlphaBlend");
        expect(mt.defines).toContain("#define MULTITEXTURE_BLEND_ALPHA_BLEND");
    });

    it("swapping between ALPHA_BLEND and ALPHA_MAX selects the right fragment and defines", async () => {
        const { mt } = await createLoaded(["a.png"], { width: 8, height: 8 });

        // Default is ALPHA_BLEND.
        expect(mt.setFragmentCalls[0]).toBe("multiTextureCompositeAlphaBlend");

        // Swap to ALPHA_MAX: highest-alpha fragment + flag.
        mt.blendMode = MultiBlendMode.ALPHA_MAX;
        expect(mt.blendMode).toBe(MultiBlendMode.ALPHA_MAX);
        expect(mt.setFragmentCalls[1]).toBe("multiTextureCompositeAlphaMax");
        expect(mt.defines).toContain("#define MULTITEXTURE_BLEND_ALPHA_MAX");

        // Swap back to ALPHA_BLEND.
        mt.blendMode = MultiBlendMode.ALPHA_BLEND;
        expect(mt.setFragmentCalls[2]).toBe("multiTextureCompositeAlphaBlend");
        expect(mt.defines).toContain("#define MULTITEXTURE_BLEND_ALPHA_BLEND");
    });

    it("explicit blendMode option is honored at construction", async () => {
        const { mt } = await createLoaded(["a.png"], { width: 8, height: 8, blendMode: MultiBlendMode.ALPHA_MAX });

        expect(mt.blendMode).toBe(MultiBlendMode.ALPHA_MAX);
        expect(mt.setFragmentCalls[0]).toBe("multiTextureCompositeAlphaMax");
        expect(mt.defines).toContain("#define MULTITEXTURE_BLEND_ALPHA_MAX");
    });

    it("renders once per resetRefreshCounter when refreshRate is 0", async () => {
        const { mt } = await createLoaded(["a.png"], { width: 8, height: 8 });

        expect(mt.refreshRate).toBe(0);
        mockState.ptReady = true;

        mt.resetRefreshCounter();
        expect(mt._shouldRender()).toBe(true);
        expect(mt._shouldRender()).toBe(false);
        expect(mt._shouldRender()).toBe(false);

        mockState.ptReady = false;
        mt.resetRefreshCounter();
        expect(mt._shouldRender()).toBe(false);
    });

    it("dispose removes the RTT, disposes the array, closes bitmaps; second dispose is a no-op", async () => {
        const { mt, scene } = await createLoaded(["a.png", "b.png"], { width: 8, height: 8 });

        const initUploads = mockState.upload.mock.calls.slice();
        const bitmapA = initUploads.find((call: any[]) => call[2] === 0)[1];
        const bitmapB = initUploads.find((call: any[]) => call[2] === 1)[1];
        const raw = mt.arrayTexture;

        mt.dispose();

        expect(scene.proceduralTextures).not.toContain(mt);
        expect(raw.dispose).toHaveBeenCalledTimes(1);
        expect(bitmapA.close).toHaveBeenCalledTimes(1);
        expect(bitmapB.close).toHaveBeenCalledTimes(1);
        expect(mt.pixels.every((p) => p === null)).toBe(true);

        mt.dispose();
        expect(raw.dispose).toHaveBeenCalledTimes(1);
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

        expect(mt.creationOptions.shaderLanguage).toBe(ShaderLanguage.WGSL);
    });

    it("does not attempt upload or log errors when a layer load lands after dispose", async () => {
        const { mt } = await createLoaded(["a.png"], { width: 8, height: 8 });

        const errorSpy = vi.spyOn(Logger, "Error").mockImplementation(() => undefined);

        mt.dispose();

        // Simulate the tail of an in-flight refresh whose decode completes after dispose.
        await expect(mt["_loadLayer"](0, "a.png", true)).resolves.toBeUndefined();
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

        const mt = new MultiTexture(["late.png"], seed.getScene()!, { updateIntervalMs: 120_000, width: 8, height: 8 });
        mt.dispose();
        releaseImage?.(({ close: vi.fn(), width: 8, height: 8 } as unknown as ImageBitmap));

        // Decode lands after dispose: init must settle quietly, retain no pixel data, and report nothing.
        await new Promise((resolve) => setTimeout(resolve, 100));
        expect(errorSpy).not.toHaveBeenCalled();
        expect(mt.pixels[0]).toBeNull();
        expect((mt as any)._layers.length).toBe(0);
        errorSpy.mockRestore();
    });

    it("clears material texture slots on dispose so materials fall back to shader defaults", async () => {
        const { mt } = await createLoaded(["a.png"], { width: 8, height: 8 });
        const scene = mt.getScene() as any;
        // Duck-typed material: the fake engine cannot construct real materials, and dispose
        // only ever reads the scene's material list and nulls slots referencing this texture.
        const mat = { name: "mat", diffuseTexture: mt, specularTexture: mt };
        if (Array.isArray(scene.materials)) {
            scene.materials.push(mat);
        } else {
            scene.materials = [mat];
        }

        mt.dispose();

        expect(mat.diffuseTexture).toBeNull();
        expect(mat.specularTexture).toBeNull();
    });
});
