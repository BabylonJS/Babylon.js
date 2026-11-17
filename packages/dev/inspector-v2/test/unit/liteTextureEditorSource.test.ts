import { beforeEach, describe, expect, it, vi } from "vitest";

const liteApi = vi.hoisted(() => ({
    getTextureMetadata: vi.fn(),
    getTextureReadbackInfo: vi.fn(),
    readTexturePixelsRGBA8: vi.fn(),
    updateTexture2DFromPixels: vi.fn(),
    updateTextureRegion: vi.fn(),
}));

vi.mock("@babylonjs/lite", () => liteApi);

import { type Texture2D } from "@babylonjs/lite";
import { GetLiteTextureEditability, LiteTextureEditorSource } from "../../src/lite/services/panes/properties/liteTextureEditorSource";

const gpuTexture = { usage: 2 };
const texture = { width: 2, height: 2, texture: gpuTexture } as Texture2D;
const engine = {} as ConstructorParameters<typeof LiteTextureEditorSource>[0];
const canvas = {
    ownerDocument: {
        createElement: () => ({
            width: 0,
            height: 0,
            getContext: () => ({
                imageSmoothingEnabled: false,
                drawImage: vi.fn(),
                getImageData: (_x: number, _y: number, width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4) }),
            }),
        }),
    },
} as unknown as HTMLCanvasElement;

describe("LiteTextureEditorSource", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        gpuTexture.usage = 2;
        liteApi.getTextureMetadata.mockReturnValue({
            kind: "2d",
            format: "rgba8unorm",
            capabilities: { dynamicUpdate: true },
        });
        liteApi.getTextureReadbackInfo.mockReturnValue({ kind: "2d", width: 2, height: 2, depthOrArrayLayers: 1, mipLevelCount: 2 });
        liteApi.readTexturePixelsRGBA8.mockImplementation(async (_engine, _texture, { mipLevel = 0 } = {}) => ({
            pixels: mipLevel === 0 ? new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]) : new Uint8Array([17, 18, 19, 20]),
            width: mipLevel === 0 ? 2 : 1,
            height: mipLevel === 0 ? 2 : 1,
        }));
    });

    it("allows only writable 2D RGBA8 textures", () => {
        expect(GetLiteTextureEditability(texture)).toEqual({ canEdit: true, texture });

        liteApi.getTextureMetadata.mockReturnValueOnce({ kind: "cube", capabilities: { dynamicUpdate: true } });
        expect(GetLiteTextureEditability(texture)).toEqual({ canEdit: false, reason: "Only 2D textures can be edited." });

        liteApi.getTextureMetadata.mockReturnValueOnce({ kind: "2d", format: "rgba16float", capabilities: { dynamicUpdate: true } });
        expect(GetLiteTextureEditability(texture)).toEqual({ canEdit: false, reason: "Editing is supported only for RGBA8 textures." });

        gpuTexture.usage = 0;
        expect(GetLiteTextureEditability(texture)).toEqual({ canEdit: false, reason: "This texture was not created with writable GPU usage." });
        gpuTexture.usage = 2;
    });

    it("snapshots the opening pixels for reset and restores through the public update API", async () => {
        const source = new LiteTextureEditorSource(engine, texture, () => true);
        const openingPixels = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
        const openingMipPixels = new Uint8Array([17, 18, 19, 20]);
        const editedPixels = new Uint8Array(16).fill(42);
        liteApi.readTexturePixelsRGBA8.mockImplementation(async (_engine, _texture, { mipLevel = 0 } = {}) => ({
            pixels: mipLevel === 0 ? openingPixels : openingMipPixels,
            width: mipLevel === 0 ? 2 : 1,
            height: mipLevel === 0 ? 2 : 1,
        }));

        await source.readPixelsAsync(0);
        await source.writePixelsAsync(editedPixels, canvas, { width: 2, height: 2 });
        await source.resetAsync();

        expect(liteApi.updateTexture2DFromPixels).toHaveBeenNthCalledWith(1, engine, texture, editedPixels);
        expect(liteApi.updateTexture2DFromPixels).toHaveBeenNthCalledWith(2, engine, texture, openingPixels);
        expect(liteApi.updateTextureRegion).toHaveBeenNthCalledWith(1, engine, texture, expect.any(Uint8ClampedArray), {
            width: 1,
            height: 1,
            mipLevel: 1,
            bytesPerRow: 4,
        });
        expect(liteApi.updateTextureRegion).toHaveBeenNthCalledWith(2, engine, texture, openingMipPixels, {
            width: 1,
            height: 1,
            mipLevel: 1,
            bytesPerRow: 4,
        });
    });

    it("captures the reset snapshot when the editor first reads, not on the first write", async () => {
        const source = new LiteTextureEditorSource(engine, texture, () => true);
        const openingPixels = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

        await source.readPixelsAsync(0);
        liteApi.readTexturePixelsRGBA8.mockResolvedValue({ pixels: new Uint8Array(16).fill(99), width: 2, height: 2 });
        await source.writePixelsAsync(new Uint8Array(16).fill(42), canvas, { width: 2, height: 2 });
        await source.resetAsync();

        expect(liteApi.updateTexture2DFromPixels).toHaveBeenLastCalledWith(engine, texture, openingPixels);
    });

    it("rejects dimension changes and operations after the texture becomes unavailable", async () => {
        let available = true;
        const source = new LiteTextureEditorSource(engine, texture, () => available);

        await expect(source.writePixelsAsync(new Uint8Array(16), canvas, { width: 1, height: 1 })).rejects.toThrow("The uploaded image must match the texture dimensions.");
        expect(liteApi.updateTexture2DFromPixels).not.toHaveBeenCalled();

        available = false;
        await expect(source.readPixelsAsync(0)).rejects.toThrow("The texture is no longer available for editing.");
    });
});
