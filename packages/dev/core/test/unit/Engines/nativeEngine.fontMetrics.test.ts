import { afterEach, describe, expect, it, vi } from "vitest";
import { ThinNativeEngine } from "core/Engines/thinNativeEngine.pure";

describe("Native font layout metrics", () => {
    it.each([
        {
            name: "uses the font line box rather than the measured glyph ink",
            metrics: { fontBoundingBoxAscent: 16, fontBoundingBoxDescent: 5, actualBoundingBoxAscent: 13, actualBoundingBoxDescent: 4 },
            expected: { ascent: 16, height: 21, descent: 5 },
        },
        {
            name: "supports runtimes exposing only font bounds",
            metrics: { fontBoundingBoxAscent: 16, fontBoundingBoxDescent: 5 },
            expected: { ascent: 16, height: 21, descent: 5 },
        },
        {
            name: "falls back to ink bounds on older runtimes without font bounds",
            metrics: { actualBoundingBoxAscent: 13, actualBoundingBoxDescent: 4 },
            expected: { ascent: 13, height: 17, descent: 4 },
        },
        {
            name: "preserves a zero font ascent instead of replacing it with ink bounds",
            metrics: { fontBoundingBoxAscent: 0, fontBoundingBoxDescent: 5, actualBoundingBoxAscent: 3, actualBoundingBoxDescent: 1 },
            expected: { ascent: 0, height: 5, descent: 5 },
        },
    ])("$name", ({ metrics, expected }) => {
        const context = { font: "", measureText: vi.fn(() => metrics) };
        const createCanvas = vi.fn(() => ({ getContext: () => context }));
        const engine: ThinNativeEngine = Object.create(ThinNativeEngine.prototype);
        Object.assign(engine, { createCanvas });

        expect(engine.getFontOffset("18px Arimo")).toEqual(expected);
        expect(createCanvas).toHaveBeenCalledExactlyOnceWith(64, 64);
        expect(context.font).toBe("18px Arimo");
        expect(context.measureText).toHaveBeenCalledExactlyOnceWith("Hg");
    });
    it("reuses one measuring canvas across calls", () => {
        const context = { font: "", measureText: vi.fn(() => ({ fontBoundingBoxAscent: 8, fontBoundingBoxDescent: 2 })) };
        const createCanvas = vi.fn(() => ({ getContext: () => context }));
        const engine: ThinNativeEngine = Object.create(ThinNativeEngine.prototype);
        Object.assign(engine, { createCanvas });

        engine.getFontOffset("10px Arimo");
        engine.getFontOffset("20px Arimo");

        expect(createCanvas).toHaveBeenCalledOnce();
        expect(context.font).toBe("20px Arimo");
    });
});

describe("Native dynamic textures", () => {
    afterEach(() => {
        delete (globalThis as any)._native;
    });

    it.each([
        { supportsDynamicTextureMipMaps: undefined, requested: true, expected: false },
        { supportsDynamicTextureMipMaps: false, requested: true, expected: false },
        { supportsDynamicTextureMipMaps: true, requested: true, expected: true },
        { supportsDynamicTextureMipMaps: true, requested: false, expected: false },
    ])("creates mips only when the runtime supports them ($supportsDynamicTextureMipMaps, $requested)", ({ supportsDynamicTextureMipMaps, requested, expected }) => {
        const engine: ThinNativeEngine = Object.create(ThinNativeEngine.prototype);
        const createRawTexture = vi.fn();
        Object.assign(engine, { _engine: { supportsDynamicTextureMipMaps }, createRawTexture });

        engine.createDynamicTexture(10.5, 0, requested, 3);

        expect(createRawTexture).toHaveBeenCalledExactlyOnceWith(expect.any(Uint8Array), 10, 1, expect.any(Number), expected, false, 3);
    });

    it("copies the canvas with the premultiplied-alpha and mip options", () => {
        (globalThis as any)._native = { Engine: { COMMAND_COPYTEXTURE: 7 } };
        const engine: ThinNativeEngine = Object.create(ThinNativeEngine.prototype);
        const encoder = { startEncodingCommand: vi.fn(), encodeCommandArgAsNativeData: vi.fn(), finishEncodingCommand: vi.fn() };
        Object.assign(engine, { _commandBufferEncoder: encoder });
        const source = {};
        const canvas = { getContext: () => ({ flush: vi.fn() }), getCanvasTexture: vi.fn(() => source) };
        const texture = { _hardwareTexture: { underlyingResource: {} }, generateMipMaps: true, _premulAlpha: false, isReady: false } as any;

        engine.updateDynamicTexture(texture, canvas, false, true);

        expect(canvas.getCanvasTexture).toHaveBeenCalledExactlyOnceWith(true, true);
        expect(encoder.startEncodingCommand).toHaveBeenCalledExactlyOnceWith(7);
        expect(encoder.encodeCommandArgAsNativeData).toHaveBeenNthCalledWith(1, source);
        expect(encoder.encodeCommandArgAsNativeData).toHaveBeenNthCalledWith(2, texture._hardwareTexture.underlyingResource);
        expect(texture._premulAlpha).toBe(true);
        expect(texture.isReady).toBe(true);
    });
});
