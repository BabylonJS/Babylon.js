import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CreateTexture2DArrayFromImageUrls, LoadImageToTexture2DArrayLayer, UploadImageToTexture2DArrayLayer } from "core/Materials/Textures/rawTexture2DArray.functions";
import { type RawTexture2DArray } from "core/Materials/Textures/rawTexture2DArray";

type UpdateSpy = ReturnType<typeof vi.fn>;

function createFakeTexture(options?: { depth?: number; hasInternal?: boolean; hasScene?: boolean }): { texture: RawTexture2DArray; update: UpdateSpy } {
    const depth = options?.depth ?? 4;
    const hasInternal = options?.hasInternal ?? true;
    const hasScene = options?.hasScene ?? true;
    const update: UpdateSpy = vi.fn();

    const internal = hasInternal ? { uniqueId: 1 } : null;
    const scene = hasScene ? { getEngine: () => ({ updateTextureArrayLayerFromImageSource: update }) } : null;

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
            expect(() => UploadImageToTexture2DArrayLayer(texture, createFakeBitmap(), 0)).toThrow(/not registered on the engine/);
        });
    });

    describe("LoadImageToTexture2DArrayLayer", () => {
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

            await LoadImageToTexture2DArrayLayer(texture, "https://example.com/a.png", 3, { invertY: true });

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

            await expect(LoadImageToTexture2DArrayLayer(texture, "https://example.com/missing.png", 0)).rejects.toThrow(/Failed to fetch/);
            expect(update).not.toHaveBeenCalled();
        });
    });

    describe("CreateTexture2DArrayFromImageUrls", () => {
        afterEach(() => {
            vi.unstubAllGlobals();
        });

        it("requires at least one url at compile time", () => {
            // The tuple parameter type enforces a non-empty url list, so an empty array is a type error.
            // @ts-expect-error - at least one url is required
            const call = () => CreateTexture2DArrayFromImageUrls({} as any, []);
            expect(call).toBeTypeOf("function");
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

            await expect(CreateTexture2DArrayFromImageUrls({} as any, ["a.png", "b.png"])).rejects.toThrow(/same dimensions/);
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

            await expect(CreateTexture2DArrayFromImageUrls({} as any, ["a.png", "b.png"])).rejects.toThrow(/decode failed/);
            // The layer that decoded before the failure must not leak.
            expect(good.close).toHaveBeenCalledTimes(1);
        });
    });
});
