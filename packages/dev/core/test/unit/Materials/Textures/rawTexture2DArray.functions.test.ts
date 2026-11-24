import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
    CreateTexture2DArrayFromImageUrlsAsync,
    CreateTexture2DArrayFromKTX2Async,
    LoadImageToTexture2DArrayLayerAsync,
    UploadImageToTexture2DArrayLayer,
} from "core/Materials/Textures/rawTexture2DArray.functions";
import { type RawTexture2DArray } from "core/Materials/Textures/rawTexture2DArray";
import { ThinNativeEngine } from "core/Engines/thinNativeEngine.pure";

// Registry of RawTexture2DArray instances constructed during a test, so a test can assert dispose()
// was called. The mocked class's engine upload always throws, which lets us exercise the
// dispose-on-error path in CreateTexture2DArrayFromImageUrlsAsync without a real engine.
const mockState = vi.hoisted(() => {
    return {
        instances: [] as { dispose: ReturnType<typeof vi.fn>; args: unknown[] }[],
        // Result returned by the mocked KhronosTextureContainer2._decodeAsync, set per test.
        decoded: null as any,
        isValid: true,
        decodeOptions: null as any,
    };
});

vi.mock("core/Misc/khronosTextureContainer2", () => {
    return {
        KhronosTextureContainer2: class {
            public static IsValid() {
                return mockState.isValid;
            }
            public async _decodeAsync(_data: unknown, options: unknown) {
                mockState.decodeOptions = options;
                return mockState.decoded;
            }
        },
    };
});

vi.mock("core/Materials/Textures/rawTexture2DArray", () => {
    return {
        RawTexture2DArray: class {
            public dispose = vi.fn();
            public depth: number;
            public args: unknown[];
            private _internal = { generateMipMaps: false };
            constructor(_data: unknown, _width: number, _height: number, depth: number, ...rest: unknown[]) {
                this.depth = depth;
                this.args = [_data, _width, _height, depth, ...rest];
                mockState.instances.push(this);
            }
            public getInternalTexture() {
                return this._internal;
            }
            public getScene() {
                return {
                    getEngine: () => ({
                        updateTextureArrayLayerFromImageSource: () => {
                            throw new Error("upload boom");
                        },
                    }),
                };
            }
        },
    };
});

type UpdateSpy = ReturnType<typeof vi.fn>;

// Mirrors AbstractEngine.createImageBitmap, which forwards to the (stubbed) global.
const GlobalCreateImageBitmap = async (...args: Parameters<typeof createImageBitmap>) => await createImageBitmap(...args);
const FakeScene = { getEngine: () => ({ createImageBitmap: GlobalCreateImageBitmap }) } as any;

function createFakeTexture(options?: { depth?: number; hasInternal?: boolean; hasScene?: boolean }): { texture: RawTexture2DArray; update: UpdateSpy } {
    const depth = options?.depth ?? 4;
    const hasInternal = options?.hasInternal ?? true;
    const hasScene = options?.hasScene ?? true;
    const update: UpdateSpy = vi.fn();

    const internal = hasInternal ? { uniqueId: 1 } : null;
    const scene = hasScene ? { getEngine: () => ({ updateTextureArrayLayerFromImageSource: update, createImageBitmap: GlobalCreateImageBitmap }) } : null;

    const texture = {
        depth,
        getInternalTexture: () => internal,
        getScene: () => scene,
    } as unknown as RawTexture2DArray;

    return { texture, update };
}

function createFakeBitmap(width = 8, height = 8): ImageBitmap {
    return { width, height, close: vi.fn() } as unknown as ImageBitmap;
}

describe("rawTexture2DArray.functions", () => {
    describe("UploadImageToTexture2DArrayLayer", () => {
        it("delegates to the engine with defaulted options", () => {
            const { texture, update } = createFakeTexture({ depth: 3 });
            const source = createFakeBitmap();

            UploadImageToTexture2DArrayLayer(texture, source, 2);

            expect(update).toHaveBeenCalledTimes(1);
            expect(update).toHaveBeenCalledWith(expect.anything(), source, 2, false, false);
        });

        it("forwards invertY and premultiplyAlpha options", () => {
            const { texture, update } = createFakeTexture();
            const source = createFakeBitmap();

            UploadImageToTexture2DArrayLayer(texture, source, 0, { invertY: true, premultiplyAlpha: true });

            expect(update).toHaveBeenCalledWith(expect.anything(), source, 0, true, true);
        });

        it("throws when the layer is out of range", () => {
            const { texture } = createFakeTexture({ depth: 2 });
            expect(() => UploadImageToTexture2DArrayLayer(texture, createFakeBitmap(), 2)).toThrow(/out of range/);
            expect(() => UploadImageToTexture2DArrayLayer(texture, createFakeBitmap(), -1)).toThrow(/out of range/);
        });

        it("throws when the layer is not an integer", () => {
            const { texture } = createFakeTexture();
            expect(() => UploadImageToTexture2DArrayLayer(texture, createFakeBitmap(), 1.5)).toThrow(/out of range/);
        });

        it("throws when the texture has no internal texture", () => {
            const { texture } = createFakeTexture({ hasInternal: false });
            expect(() => UploadImageToTexture2DArrayLayer(texture, createFakeBitmap(), 0)).toThrow(/no internal texture/);
        });

        it("throws when the texture is not attached to a scene", () => {
            const { texture } = createFakeTexture({ hasScene: false });
            expect(() => UploadImageToTexture2DArrayLayer(texture, createFakeBitmap(), 0)).toThrow(/not attached to a scene/);
        });

        it("throws a helpful error when the engine extension is not registered", () => {
            // Engine without the opt-in updateTextureArrayLayerFromImageSource method.
            const texture = {
                depth: 4,
                getInternalTexture: () => ({ uniqueId: 1 }),
                getScene: () => ({ getEngine: () => ({}) }),
            } as unknown as RawTexture2DArray;
            expect(() => UploadImageToTexture2DArrayLayer(texture, createFakeBitmap(), 0)).toThrow(/needs to be imported/);
        });
    });

    describe("LoadImageToTexture2DArrayLayerAsync", () => {
        let bitmap: ImageBitmap;

        beforeEach(() => {
            bitmap = createFakeBitmap();
            vi.stubGlobal(
                "fetch",
                vi.fn(async () => ({ ok: true, status: 200, statusText: "OK", blob: async () => ({}) }))
            );
            vi.stubGlobal(
                "createImageBitmap",
                vi.fn(async () => bitmap)
            );
        });

        afterEach(() => {
            vi.unstubAllGlobals();
        });

        it("fetches, uploads and closes the bitmap", async () => {
            const { texture, update } = createFakeTexture({ depth: 5 });

            await LoadImageToTexture2DArrayLayerAsync(texture, "https://example.com/a.png", 3, { invertY: true });

            expect(fetch).toHaveBeenCalledWith("https://example.com/a.png");
            expect(update).toHaveBeenCalledWith(expect.anything(), bitmap, 3, true, false);
            expect(bitmap.close).toHaveBeenCalledTimes(1);
        });

        it("throws and does not upload when the fetch fails", async () => {
            vi.stubGlobal(
                "fetch",
                vi.fn(async () => ({ ok: false, status: 404, statusText: "Not Found" }))
            );
            const { texture, update } = createFakeTexture();

            await expect(LoadImageToTexture2DArrayLayerAsync(texture, "https://example.com/missing.png", 0)).rejects.toThrow(/Failed to fetch/);
            expect(update).not.toHaveBeenCalled();
        });
    });

    describe("CreateTexture2DArrayFromImageUrlsAsync", () => {
        afterEach(() => {
            vi.unstubAllGlobals();
        });

        it("requires at least one url at compile time", () => {
            // The tuple parameter type enforces a non-empty url list, so an empty array is a type error.
            // @ts-expect-error - at least one url is required
            const call = () => CreateTexture2DArrayFromImageUrlsAsync({} as any, []);
            expect(call).toBeTypeOf("function");
        });

        it("decodes through the engine instead of the global createImageBitmap", async () => {
            const bitmaps = [createFakeBitmap(8, 8), createFakeBitmap(16, 8)];
            let call = 0;
            const engineCreateImageBitmap = vi.fn(async () => bitmaps[call++]);
            vi.stubGlobal(
                "fetch",
                vi.fn(async () => ({ ok: true, status: 200, statusText: "OK", blob: async () => ({}) }))
            );
            vi.stubGlobal("createImageBitmap", undefined);
            const scene = { getEngine: () => ({ createImageBitmap: engineCreateImageBitmap }) } as any;

            // Mismatched sizes stop before the texture is created, after both layers were decoded.
            await expect(CreateTexture2DArrayFromImageUrlsAsync(scene, ["a.png", "b.png"], { imageBitmapOptions: { imageOrientation: "flipY" } })).rejects.toThrow(
                /same dimensions/
            );
            expect(engineCreateImageBitmap).toHaveBeenCalledTimes(2);
            expect(engineCreateImageBitmap).toHaveBeenCalledWith(expect.anything(), { imageOrientation: "flipY" });
        });

        it("throws when the images do not share dimensions", async () => {
            const bitmaps = [createFakeBitmap(8, 8), createFakeBitmap(16, 8)];
            let call = 0;
            vi.stubGlobal(
                "fetch",
                vi.fn(async () => ({ ok: true, status: 200, statusText: "OK", blob: async () => ({}) }))
            );
            vi.stubGlobal(
                "createImageBitmap",
                vi.fn(async () => bitmaps[call++])
            );

            await expect(CreateTexture2DArrayFromImageUrlsAsync(FakeScene, ["a.png", "b.png"])).rejects.toThrow(/same dimensions/);
            // Both fetched bitmaps must be released even on validation failure.
            expect(bitmaps[0].close).toHaveBeenCalledTimes(1);
            expect(bitmaps[1].close).toHaveBeenCalledTimes(1);
        });

        it("closes already-decoded layers when another layer fails to load", async () => {
            const good = createFakeBitmap(8, 8);
            let call = 0;
            vi.stubGlobal(
                "fetch",
                vi.fn(async () => ({ ok: true, status: 200, statusText: "OK", blob: async () => ({}) }))
            );
            vi.stubGlobal(
                "createImageBitmap",
                vi.fn(async () => {
                    const index = call++;
                    if (index === 0) {
                        return good;
                    }
                    throw new Error("decode failed");
                })
            );

            await expect(CreateTexture2DArrayFromImageUrlsAsync(FakeScene, ["a.png", "b.png"])).rejects.toThrow(/decode failed/);
            // The layer that decoded before the failure must not leak.
            expect(good.close).toHaveBeenCalledTimes(1);
        });

        it("disposes the created texture and closes bitmaps when a layer upload fails", async () => {
            mockState.instances.length = 0;
            const bitmaps = [createFakeBitmap(8, 8), createFakeBitmap(8, 8)];
            let call = 0;
            vi.stubGlobal(
                "fetch",
                vi.fn(async () => ({ ok: true, status: 200, statusText: "OK", blob: async () => ({}) }))
            );
            vi.stubGlobal(
                "createImageBitmap",
                vi.fn(async () => bitmaps[call++])
            );

            // The mocked RawTexture2DArray's engine upload always throws, so this exercises the
            // dispose-on-error path after the texture has already been allocated.
            await expect(CreateTexture2DArrayFromImageUrlsAsync(FakeScene, ["a.png", "b.png"])).rejects.toThrow(/upload boom/);
            expect(mockState.instances).toHaveLength(1);
            expect(mockState.instances[0].dispose).toHaveBeenCalledTimes(1);
            // Bitmaps are still released on the error path.
            expect(bitmaps[0].close).toHaveBeenCalledTimes(1);
            expect(bitmaps[1].close).toHaveBeenCalledTimes(1);
        });

        it("keeps the original upload error for Native bitmaps without close()", async () => {
            mockState.instances.length = 0;
            // Older Babylon Native runtimes decode to plain objects without close().
            const bitmaps = [
                { width: 8, height: 8, data: new Uint8Array(256) },
                { width: 8, height: 8, data: new Uint8Array(256) },
            ];
            let call = 0;
            vi.stubGlobal(
                "fetch",
                vi.fn(async () => ({ ok: true, status: 200, statusText: "OK", blob: async () => ({}) }))
            );
            vi.stubGlobal(
                "createImageBitmap",
                vi.fn(async () => bitmaps[call++])
            );

            await expect(CreateTexture2DArrayFromImageUrlsAsync(FakeScene, ["a.png", "b.png"])).rejects.toThrow(/upload boom/);
            expect(mockState.instances[0].dispose).toHaveBeenCalledTimes(1);

            call = 0;
            const { texture, update } = createFakeTexture({ depth: 2 });
            await expect(LoadImageToTexture2DArrayLayerAsync(texture, "a.png", 1)).resolves.toBeUndefined();
            expect(update).toHaveBeenCalledWith(expect.anything(), bitmaps[0], 1, false, false);
        });

        it("rejects decode options that Babylon Native would ignore, regardless of the engine name", async () => {
            const engineCreateImageBitmap = vi.fn();
            vi.stubGlobal("fetch", vi.fn());
            const nativeEngine = Object.create(ThinNativeEngine.prototype);
            nativeEngine.name = "Renamed";
            nativeEngine.createImageBitmap = engineCreateImageBitmap;
            const scene = { getEngine: () => nativeEngine } as any;

            await expect(CreateTexture2DArrayFromImageUrlsAsync(scene, ["a.png"], { imageBitmapOptions: { imageOrientation: "flipY" } })).rejects.toThrow(/does not support/);
            await expect(CreateTexture2DArrayFromImageUrlsAsync(scene, ["a.png"], { imageBitmapOptions: { resizeWidth: 4 } })).rejects.toThrow(/does not support/);
            await expect(CreateTexture2DArrayFromImageUrlsAsync(scene, ["a.png"], { imageBitmapOptions: { premultiplyAlpha: "premultiply" } })).rejects.toThrow(/does not support/);
            expect(fetch).not.toHaveBeenCalled();
            expect(engineCreateImageBitmap).not.toHaveBeenCalled();
        });

        it("forwards decode options on web engines named Native", async () => {
            const bitmap = createFakeBitmap(8, 8);
            const engineCreateImageBitmap = vi.fn(async () => bitmap);
            vi.stubGlobal(
                "fetch",
                vi.fn(async () => ({ ok: true, status: 200, statusText: "OK", blob: async () => ({}) }))
            );
            const scene = { getEngine: () => ({ name: "Native", createImageBitmap: engineCreateImageBitmap }) } as any;

            // The mocked texture upload throws after decoding, which is enough to observe the forwarded options.
            await expect(CreateTexture2DArrayFromImageUrlsAsync(scene, ["a.png"], { imageBitmapOptions: { premultiplyAlpha: "premultiply" } })).rejects.toThrow(/upload boom/);
            expect(engineCreateImageBitmap).toHaveBeenCalledWith(expect.anything(), { premultiplyAlpha: "premultiply" });
        });
    });

    describe("CreateTexture2DArrayFromKTX2Async", () => {
        function makeMipmap(layerIndex: number, byte: number, width = 2, height = 2) {
            return { data: new Uint8Array(width * height * 4).fill(byte), width, height, layerIndex };
        }

        function stubFetch(ok = true) {
            vi.stubGlobal(
                "fetch",
                vi.fn(async () => ({ ok, status: ok ? 200 : 404, statusText: ok ? "OK" : "Not Found", arrayBuffer: async () => new ArrayBuffer(16) }))
            );
        }

        beforeEach(() => {
            mockState.instances.length = 0;
            mockState.isValid = true;
            mockState.decodeOptions = null;
            mockState.decoded = null;
        });

        afterEach(() => {
            vi.unstubAllGlobals();
        });

        it("concatenates the base mip level layers in order and forces RGBA", async () => {
            stubFetch();
            mockState.decoded = {
                layerCount: 3,
                // Two mip levels, each contributing layerCount consecutive entries.
                mipmaps: [makeMipmap(0, 1), makeMipmap(1, 2), makeMipmap(2, 3), makeMipmap(0, 9, 1, 1), makeMipmap(1, 9, 1, 1), makeMipmap(2, 9, 1, 1)],
            };

            const texture = (await CreateTexture2DArrayFromKTX2Async({ getEngine: () => ({}) } as any, "a.ktx2")) as any;

            expect(mockState.decodeOptions).toEqual({ forceRGBA: true });
            expect(texture.depth).toBe(3);
            const [data, width, height] = texture.args;
            expect(width).toBe(2);
            expect(height).toBe(2);
            // Only the base level is uploaded, with its layers back to back.
            expect((data as Uint8Array).byteLength).toBe(2 * 2 * 4 * 3);
            expect((data as Uint8Array)[0]).toBe(1);
            expect((data as Uint8Array)[16]).toBe(2);
            expect((data as Uint8Array)[32]).toBe(3);
        });

        it("accepts already fetched data and skips the network", async () => {
            const fetchSpy = vi.fn();
            vi.stubGlobal("fetch", fetchSpy);
            mockState.decoded = { layerCount: 1, mipmaps: [makeMipmap(0, 7)] };

            const texture = (await CreateTexture2DArrayFromKTX2Async({ getEngine: () => ({}) } as any, new Uint8Array(16))) as any;

            expect(fetchSpy).not.toHaveBeenCalled();
            expect(texture.depth).toBe(1);
        });

        it("defaults layerCount to 1 for a non-array file", async () => {
            stubFetch();
            mockState.decoded = { mipmaps: [makeMipmap(0, 5), makeMipmap(0, 6, 1, 1)] };

            const texture = (await CreateTexture2DArrayFromKTX2Async({ getEngine: () => ({}) } as any, "a.ktx2")) as any;

            expect(texture.depth).toBe(1);
            expect((texture.args[0] as Uint8Array).byteLength).toBe(2 * 2 * 4);
        });

        it("rejects when the fetch fails", async () => {
            stubFetch(false);
            await expect(CreateTexture2DArrayFromKTX2Async({ getEngine: () => ({}) } as any, "a.ktx2")).rejects.toThrow(/Failed to fetch KTX2 file/);
        });

        it("rejects when the data is not a KTX2 file", async () => {
            stubFetch();
            mockState.isValid = false;
            await expect(CreateTexture2DArrayFromKTX2Async({ getEngine: () => ({}) } as any, "a.ktx2")).rejects.toThrow(/not a valid KTX2 file/);
        });

        it("rejects when the decoder reports errors", async () => {
            stubFetch();
            mockState.decoded = { layerCount: 1, mipmaps: [], errors: "boom" };
            await expect(CreateTexture2DArrayFromKTX2Async({ getEngine: () => ({}) } as any, "a.ktx2")).rejects.toThrow(/boom/);
        });

        it("rejects when the base mip level is missing layers", async () => {
            stubFetch();
            mockState.decoded = { layerCount: 3, mipmaps: [makeMipmap(0, 1), makeMipmap(1, 2)] };
            await expect(CreateTexture2DArrayFromKTX2Async({ getEngine: () => ({}) } as any, "a.ktx2")).rejects.toThrow(/expected 3 layers/);
        });

        it("rejects when a layer has no data", async () => {
            stubFetch();
            mockState.decoded = { layerCount: 2, mipmaps: [makeMipmap(0, 1), { data: null, width: 2, height: 2, layerIndex: 1 }] };
            await expect(CreateTexture2DArrayFromKTX2Async({ getEngine: () => ({}) } as any, "a.ktx2")).rejects.toThrow(/layer 1 of the base mip level is empty/);
        });

        it("rejects when the layers do not share dimensions", async () => {
            stubFetch();
            mockState.decoded = { layerCount: 2, mipmaps: [makeMipmap(0, 1), makeMipmap(1, 2, 4, 4)] };
            await expect(CreateTexture2DArrayFromKTX2Async({ getEngine: () => ({}) } as any, "a.ktx2")).rejects.toThrow(/layer 1 of the base mip level is 4x4 but layer 0 is 2x2/);
        });

        it("rejects when a layer does not hold the expected number of RGBA bytes", async () => {
            stubFetch();
            mockState.decoded = { layerCount: 2, mipmaps: [makeMipmap(0, 1), { data: new Uint8Array(8), width: 2, height: 2, layerIndex: 1 }] };
            await expect(CreateTexture2DArrayFromKTX2Async({ getEngine: () => ({}) } as any, "a.ktx2")).rejects.toThrow(/holds 8 bytes but 16 were expected/);
        });

        it("rejects rather than crashing when the decoder reports no layers", async () => {
            stubFetch();
            mockState.decoded = { layerCount: 0, mipmaps: [] };
            await expect(CreateTexture2DArrayFromKTX2Async({ getEngine: () => ({}) } as any, "a.ktx2")).rejects.toThrow(/expected 1 layers/);
        });
    });
});
