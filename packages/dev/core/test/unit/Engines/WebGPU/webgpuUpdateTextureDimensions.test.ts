/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines/nullEngine";
import { WebGPUEngine } from "core/Engines/webgpuEngine.pure";
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
