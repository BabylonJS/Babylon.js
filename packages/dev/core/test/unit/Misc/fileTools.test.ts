import { NullEngine } from "core/Engines/nullEngine";
import { LoadImage } from "core/Misc/fileTools";
import { afterEach, describe, expect, it, vi } from "vitest";

class BitmapNullEngine extends NullEngine {
    public constructor() {
        super();
        this._features.forceBitmapOverHTMLImageElement = true;
    }
}

describe("LoadImage", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("decodes an ArrayBufferView directly without creating an object URL", async () => {
        const engine = new BitmapNullEngine();
        const imageBitmap = { width: 1, height: 1, close: vi.fn() } as unknown as ImageBitmap;
        const createImageBitmapSpy = vi.spyOn(engine, "createImageBitmap").mockResolvedValue(imageBitmap);
        const createObjectURLSpy = vi.spyOn(URL, "createObjectURL");
        const source = new Uint8Array([0, 1, 2, 3]).subarray(1, 3);

        const loadedImage = await new Promise<HTMLImageElement | ImageBitmap>((resolve, reject) => {
            LoadImage(source, resolve, (_message, exception) => reject(exception), null, "image/png", undefined, engine);
        });

        expect(loadedImage).toBe(imageBitmap);
        expect(createObjectURLSpy).not.toHaveBeenCalled();

        const blob = createImageBitmapSpy.mock.calls[0][0] as Blob;
        expect(blob.type).toBe("image/png");
        expect(Array.from(new Uint8Array(await blob.arrayBuffer()))).toEqual([1, 2]);
        expect(createImageBitmapSpy).toHaveBeenCalledExactlyOnceWith(blob, {
            premultiplyAlpha: "none",
            colorSpaceConversion: "none",
        });

        engine.dispose();
    });

    it("decodes a Blob directly without creating an object URL", async () => {
        const engine = new BitmapNullEngine();
        const imageBitmap = { width: 1, height: 1, close: vi.fn() } as unknown as ImageBitmap;
        const createImageBitmapSpy = vi.spyOn(engine, "createImageBitmap").mockResolvedValue(imageBitmap);
        const createObjectURLSpy = vi.spyOn(URL, "createObjectURL");
        const source = new Blob([new Uint8Array([1, 2])], { type: "image/png" });

        await new Promise<HTMLImageElement | ImageBitmap>((resolve, reject) => {
            LoadImage(source, resolve, (_message, exception) => reject(exception), null, "", undefined, engine);
        });

        expect(createObjectURLSpy).not.toHaveBeenCalled();
        expect(createImageBitmapSpy).toHaveBeenCalledExactlyOnceWith(source, {
            premultiplyAlpha: "none",
            colorSpaceConversion: "none",
        });

        engine.dispose();
    });
});
