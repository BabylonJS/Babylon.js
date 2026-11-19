import { NullEngine } from "core/Engines/nullEngine";
import { DecodeBase64UrlToString, GetMimeType, IsBase64DataUrl, LoadFile, LoadImage, TestBase64DataUrl } from "core/Misc/fileTools";
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

    it("decodes an ArrayBuffer directly without creating an object URL", async () => {
        const engine = new BitmapNullEngine();
        const imageBitmap = { width: 1, height: 1, close: vi.fn() } as unknown as ImageBitmap;
        const createImageBitmapSpy = vi.spyOn(engine, "createImageBitmap").mockResolvedValue(imageBitmap);
        const createObjectURLSpy = vi.spyOn(URL, "createObjectURL");
        const source = new Uint8Array([1, 2]).buffer;

        await new Promise<HTMLImageElement | ImageBitmap>((resolve, reject) => {
            LoadImage(source, resolve, (_message, exception) => reject(exception), null, "image/png", undefined, engine);
        });

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

describe("LoadFile", () => {
    const text = '{"name":"Würfel 立方体 🎲"}';
    const dataUrl = "data:application/json;base64," + Buffer.from(text, "utf-8").toString("base64");

    it("decodes a base64 data URL as UTF-8 text", () => {
        expect(DecodeBase64UrlToString(dataUrl)).toBe(text);
    });

    it("returns the UTF-8 text of a base64 data URL when not loading an ArrayBuffer", async () => {
        const data = await new Promise<string | ArrayBuffer>((resolve, reject) => {
            LoadFile(dataUrl, resolve, undefined, undefined, false, (_request, exception) => reject(exception));
        });

        expect(data).toBe(text);
    });
});

describe("base64 data URLs", () => {
    it.each([
        ["data:;base64,AA==", ""],
        ["data:application/octet-stream;base64,AA==", "application/octet-stream"],
        ["data:image/svg+xml;charset=utf-8;base64,AA==", "image/svg+xml;charset=utf-8"],
    ])("recognizes %s", (url, expectedType) => {
        expect(IsBase64DataUrl(url)).toBe(true);
        expect(TestBase64DataUrl(url)).toEqual({ match: true, type: expectedType });
    });

    it.each(["data:application;base64,AA==", "data:/json;base64,AA==", "data:application/;base64,AA==", "https://example.com/data:image/png;base64,AA=="])("rejects %s", (url) => {
        expect(IsBase64DataUrl(url)).toBe(false);
        expect(TestBase64DataUrl(url)).toEqual({ match: false, type: "" });
    });
});

describe("GetMimeType", () => {
    it("reads the mime type from the file extension", () => {
        expect(GetMimeType("textures/brick.JPG")).toBe("image/jpeg");
        expect(GetMimeType("https://example.com/models/scene.glb")).toBe("model/gltf-binary");
    });

    it("ignores the query string and fragment", () => {
        expect(GetMimeType("textures/brick.jpg?v=2")).toBe("image/jpeg");
        expect(GetMimeType("https://cdn.example.com/textures/grass.png?token=a.b.c")).toBe("image/png");
        expect(GetMimeType("textures/brick.png#preview")).toBe("image/png");
    });

    it("returns the correct type for a URL-encoded filename with a literal # in its name", () => {
        // Callers such as FBXFileLoader._getMimeType pass encodeURIComponent(filename) so that
        // a '#' in an embedded texture name (e.g. "albedo#1.jpg") is not treated as a fragment.
        expect(GetMimeType(encodeURIComponent("albedo#1.jpg"))).toBe("image/jpeg");
        expect(GetMimeType(encodeURIComponent("diffuse?map.png"))).toBe("image/png");
    });

    it("returns undefined for an unknown extension", () => {
        expect(GetMimeType("textures/brick.xyz")).toBeUndefined();
    });
});
