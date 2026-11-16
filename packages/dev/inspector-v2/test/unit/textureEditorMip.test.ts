/**
 * @vitest-environment jsdom
 */

import { describe, expect, it, vi } from "vitest";
import { Constants } from "core/Engines/constants";
import { NullEngine } from "core/Engines/nullEngine";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TextureCanvasManager as InspectorCanvasManager } from "../../src/components/textureEditor/canvasManager";
import { StatusBar } from "../../src/components/textureEditor/status";
import { TextureCanvasManager as LegacyCanvasManager } from "../../../inspector/src/components/actionTabs/tabs/propertyGrids/materials/textures/textureCanvasManager";
import { BottomBar } from "../../../inspector/src/components/actionTabs/tabs/propertyGrids/materials/textures/bottomBar";

describe.each([
    ["Inspector", InspectorCanvasManager],
    ["legacy Inspector", LegacyCanvasManager],
])("%s texture editor", (_name, Manager) => {
    it.each([
        [4, 4, false],
        [3, 5, true],
    ])("reads an inverted mip and scales it to the base canvas (%sx%s, array: %s)", async (width, height, isArray) => {
        const engine = new NullEngine();
        const texture = new RawTexture(new Uint8Array(width * height * 4), width, height, Constants.TEXTUREFORMAT_RGBA, engine, false, true);
        texture.getInternalTexture()!.isReady = true;
        texture.getInternalTexture()!.is2DArray = isArray;
        const mipWidth = Math.max(1, Math.floor(width / 2));
        const mipHeight = Math.max(1, Math.floor(height / 2));
        const pixels = new Uint8Array(mipWidth * mipHeight * 4);
        for (let i = 0; i < pixels.length; i++) {
            pixels[i] = i + 1;
        }
        const original = [...pixels];
        const readPixels = vi.spyOn(texture, "readPixels").mockResolvedValue(pixels);
        const putImageData = vi.fn();
        const mipCanvas = document.createElement("canvas");
        Object.defineProperty(mipCanvas, "getContext", {
            value: () => ({
                createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }),
                putImageData,
            }),
        });

        const imageData = new Uint8ClampedArray(width * height * 4);
        const context = {
            imageSmoothingEnabled: true,
            drawImage: vi.fn(),
            getImageData: vi.fn(() => ({ data: imageData })),
        };
        const canvas = document.createElement("canvas");
        Object.defineProperty(canvas, "getContext", { value: () => context });
        const manager = Object.create(Manager.prototype) as InstanceType<typeof Manager>;
        const setSize = vi.fn();
        const updateDisplay = vi.fn();
        const update = vi.fn();
        Reflect.set(manager, "_originalTexture", texture);
        Reflect.set(manager, "_mipLevel", 1);
        Reflect.set(manager, "_face", 0);
        Reflect.set(manager, "_window", { document: { createElement: () => mipCanvas } });
        Reflect.set(manager, "_2DCanvas", canvas);
        Reflect.set(manager, "_3DCanvasTexture", { update });
        Reflect.set(manager, "setSize", setSize);
        Reflect.set(manager, "updateDisplay", updateDisplay);

        try {
            await manager.grabOriginalTexture();
            expect(readPixels).toHaveBeenCalledWith(0, 1, null, true, false, 0, 0, mipWidth, mipHeight);
            expect(setSize).toHaveBeenCalledWith({ width, height });
            expect([mipCanvas.width, mipCanvas.height]).toEqual([mipWidth, mipHeight]);
            const flipped = [...original.slice(mipWidth * 4), ...original.slice(0, mipWidth * 4)];
            expect([...putImageData.mock.calls[0][0].data]).toEqual(flipped);
            expect(context.imageSmoothingEnabled).toBe(false);
            expect(context.drawImage).toHaveBeenCalledWith(mipCanvas, 0, 0, width, height);
            expect(context.getImageData).toHaveBeenCalledWith(0, 0, width, height);
            expect(Reflect.get(manager, "_imageData")).toBe(imageData);
            expect(update).toHaveBeenCalledOnce();
            expect(updateDisplay).toHaveBeenCalledOnce();
        } finally {
            texture.dispose();
            engine.dispose();
            vi.restoreAllMocks();
        }
    });
});

it.each([
    ["Inspector", StatusBar, "1×2"],
    ["legacy Inspector", BottomBar, "1x2"],
])("%s reports the actual odd-sized mip dimensions", (_name, Component, dimensions) => {
    const engine = new NullEngine();
    const texture = new RawTexture(new Uint8Array(3 * 5 * 4), 3, 5, Constants.TEXTUREFORMAT_RGBA, engine, true);
    try {
        expect(renderToStaticMarkup(createElement(Component, { texture, mipLevel: 1 }))).toContain(dimensions);
    } finally {
        texture.dispose();
        engine.dispose();
    }
});
