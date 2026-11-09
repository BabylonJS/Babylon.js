/**
 * @vitest-environment jsdom
 */

import { Constants } from "core/Engines/constants";
import { NullEngine } from "core/Engines/nullEngine";
import { ThinWebGPUEngine } from "core/Engines/thinWebGPUEngine";
import { WebGPUEngine } from "core/Engines/webgpuEngine.pure";
import { RegisterEnginesWebGPUExtensionsEngineRawTexture } from "core/Engines/WebGPU/Extensions/engine.rawTexture.pure";
import type {} from "core/Engines/WebGPU/Extensions/engine.rawTexture.types";
import { WebGPUHardwareTexture } from "core/Engines/WebGPU/webgpuHardwareTexture";
import { WebGPUMaterialContext } from "core/Engines/WebGPU/webgpuMaterialContext";
import { WebGPUTextureManager } from "core/Engines/WebGPU/webgpuTextureManager";
import { InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// WebGPUEngine.updateTextureDimensions and WebGPUTextureManager deferred release only handle wrappers and bookkeeping here,
// so they are run on stubs through prototype.call, without a GPU device.
function CreateFakeHardwareTexture() {
    return { textureAdditionalUsages: 0, release: vi.fn() };
}

describe("WebGPUEngine.updateTextureDimensions", () => {
    let engine: NullEngine;

    beforeEach(() => {
        engine = new NullEngine();
    });

    afterEach(() => {
        engine.dispose();
    });

    // The texture helper stub uses the real deferred release of WebGPUTextureManager
    function CreateTextureHelperStub() {
        const helper = {
            _deferredReleaseTextures: [] as unknown[],
            releaseHardwareTexture: (hardwareTexture: unknown) => (WebGPUTextureManager.prototype as any).releaseHardwareTexture.call(helper, hardwareTexture),
            destroyDeferredTextures: () => (WebGPUTextureManager.prototype as any).destroyDeferredTextures.call(helper),
            // Like the real createGPUTextureForInternalTexture: a texture without wrapper gets a new one
            createGPUTextureForInternalTexture: vi.fn((texture: InternalTexture, width: number, height: number, depth: number) => {
                texture._hardwareTexture ??= CreateFakeHardwareTexture() as any;
                texture.width = texture.baseWidth = width;
                texture.height = texture.baseHeight = height;
                texture.depth = texture.baseDepth = depth;
                return texture._hardwareTexture;
            }),
        };
        return helper;
    }

    function UpdateTextureDimensions(helper: object, texture: InternalTexture, width: number, height: number) {
        (WebGPUEngine.prototype as any).updateTextureDimensions.call({ _textureHelper: helper }, texture, width, height, 1);
    }

    it("keeps the previous gpu texture alive until the end of the frame, and releases the replacement wrapper only with its texture", () => {
        const helper = CreateTextureHelperStub();
        const texture = new InternalTexture(engine, InternalTextureSource.Raw, true);
        const previous = CreateFakeHardwareTexture();
        texture._hardwareTexture = previous as any;
        texture.width = texture.height = 64;
        texture.depth = 1;

        UpdateTextureDimensions(helper, texture, 128, 128);

        // The texture got its own new wrapper for the new gpu texture
        expect(texture._hardwareTexture).not.toBe(previous);
        expect(texture.width).toBe(128);
        // The previous gpu texture may still be used by this frame's commands
        expect(previous.release).not.toHaveBeenCalled();

        helper.destroyDeferredTextures();

        expect(previous.release).toHaveBeenCalledOnce();
        expect((texture._hardwareTexture as any).release).not.toHaveBeenCalled();
    });

    it("refreshes the unique id, because the texture is backed by a new gpu resource", () => {
        const helper = CreateTextureHelperStub();
        const texture = new InternalTexture(engine, InternalTextureSource.Raw, true);
        texture._hardwareTexture = CreateFakeHardwareTexture() as any;
        texture.width = texture.height = 64;
        texture.depth = 1;
        const uniqueId = texture.uniqueId;

        UpdateTextureDimensions(helper, texture, 128, 128);

        expect(texture.uniqueId).not.toBe(uniqueId);
    });

    it("does nothing when the dimensions do not change", () => {
        const helper = CreateTextureHelperStub();
        const texture = new InternalTexture(engine, InternalTextureSource.Raw, true);
        const previous = CreateFakeHardwareTexture();
        texture._hardwareTexture = previous as any;
        texture.width = texture.height = 64;
        texture.depth = 1;
        const uniqueId = texture.uniqueId;

        UpdateTextureDimensions(helper, texture, 64, 64);

        expect(texture._hardwareTexture).toBe(previous);
        expect(texture.uniqueId).toBe(uniqueId);
        expect(helper.createGPUTextureForInternalTexture).not.toHaveBeenCalled();
    });
});

describe("WebGPUMaterialContext.setTexture", () => {
    it("is marked dirty when the unique id of the texture that is bound again changed", () => {
        const engine = new NullEngine();
        const texture = new InternalTexture(engine, InternalTextureSource.Raw, true);
        const context = new WebGPUMaterialContext();

        context.setTexture("diffuseSampler", texture);
        context.isDirty = false;
        const updateId = context.updateId;

        // Same object, same id: nothing changed
        context.setTexture("diffuseSampler", texture);
        expect(context.isDirty).toBe(false);
        expect(context.updateId).toBe(updateId);

        // Same object, new id (the texture is now backed by another gpu resource)
        texture._setUniqueId(InternalTexture._Counter++);
        context.setTexture("diffuseSampler", texture);
        expect(context.isDirty).toBe(true);
        expect(context.updateId).toBe(updateId + 1);

        engine.dispose();
    });
});

describe("WebGPUEngine.updateTextureDimensions with an RGB raw cube texture", () => {
    it("still converts the RGB faces to RGBA when they are uploaded after the resize", () => {
        RegisterEnginesWebGPUExtensionsEngineRawTexture();
        const nullEngine = new NullEngine();

        // Like createRawCubeTexture: RGB data is stored in an RGBA gpu texture, and the wrapper remembers it
        const texture = new InternalTexture(nullEngine, InternalTextureSource.CubeRaw, true);
        texture.isCube = true;
        texture.width = texture.height = 64;
        texture.depth = 1;
        texture.generateMipMaps = false;
        const previous = new WebGPUHardwareTexture({} as any);
        previous._originalFormatIsRGB = true;
        previous.release = vi.fn();
        texture._hardwareTexture = previous;

        const uploads: Uint8Array[][] = [];
        const helper = {
            _deferredReleaseTextures: [] as unknown[],
            releaseHardwareTexture: (hardwareTexture: unknown) => (WebGPUTextureManager.prototype as any).releaseHardwareTexture.call(helper, hardwareTexture),
            // Like the real createGPUTextureForInternalTexture: the replacement wrapper starts from the defaults (_originalFormatIsRGB is false)
            createGPUTextureForInternalTexture: (internalTexture: InternalTexture, width: number, height: number, depth: number) => {
                internalTexture._hardwareTexture ??= new WebGPUHardwareTexture({} as any);
                internalTexture.width = internalTexture.baseWidth = width;
                internalTexture.height = internalTexture.baseHeight = height;
                internalTexture.depth = internalTexture.baseDepth = depth;
                return internalTexture._hardwareTexture;
            },
            updateCubeTextures: (data: Uint8Array[]) => uploads.push(data),
        };

        (WebGPUEngine.prototype as any).updateTextureDimensions.call({ _textureHelper: helper }, texture, 128, 128, 1);

        expect(texture._hardwareTexture).not.toBe(previous);
        expect((texture._hardwareTexture as WebGPUHardwareTexture)._originalFormatIsRGB).toBe(true);

        // The real updateRawCubeTexture, with a recording texture helper
        const engine = Object.create(ThinWebGPUEngine.prototype) as any;
        engine._textureHelper = helper;
        engine._generateMipmaps = vi.fn();
        engine._uploadEncoder = {};

        const rgbFace = new Uint8Array(128 * 128 * 3);
        rgbFace.set([10, 20, 30, 40, 50, 60]);
        engine.updateRawCubeTexture(texture, [rgbFace, rgbFace, rgbFace, rgbFace, rgbFace, rgbFace], Constants.TEXTUREFORMAT_RGB, Constants.TEXTURETYPE_UNSIGNED_BYTE, false);

        expect(uploads).toHaveLength(1);
        expect(uploads[0]).toHaveLength(6);
        for (const face of uploads[0]) {
            // 128 * 128 * 4 bytes: an RGBA copy of an unconverted RGB face (49,152 bytes) would be undersized
            expect(face.byteLength).toBe(65536);
            // The RGB values of consecutive pixels are 4 bytes apart after the conversion
            expect(Array.from(face.subarray(0, 3))).toEqual([10, 20, 30]);
            expect(Array.from(face.subarray(4, 7))).toEqual([40, 50, 60]);
        }

        nullEngine.dispose();
    });
});
