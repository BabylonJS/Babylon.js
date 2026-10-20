import { beforeEach, describe, expect, it, vi } from "vitest";

import { ThinWebGPUEngine } from "core/Engines/thinWebGPUEngine";
import { WebGPUEngine } from "core/Engines/webgpuEngine.pure";
import { WebGPUHardwareTexture } from "core/Engines/WebGPU/webgpuHardwareTexture";
import { WebGPUTextureManager } from "core/Engines/WebGPU/webgpuTextureManager";
import { InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture";

describe("ThinWebGPUEngine._generateMipmaps", () => {
    let engine: WebGPUEngine;
    let texture: InternalTexture;
    let uploadEncoder: GPUCommandEncoder;

    beforeEach(() => {
        engine = Object.create(WebGPUEngine.prototype);
        engine._textureHelper = Object.create(WebGPUTextureManager.prototype);
        engine._textureHelper.generateMipmaps = vi.fn();
        engine._textureHelper.generateCubeMipmaps = vi.fn();
        engine._textureHelper.generate3DMipmaps = vi.fn();
        engine._endCurrentRenderPass = vi.fn(() => 0);
        engine._renderEncoder = { label: "render" } as GPUCommandEncoder;
        uploadEncoder = { label: "upload" } as GPUCommandEncoder;

        texture = new InternalTexture(engine, InternalTextureSource.Raw2DArray, true);
        texture.width = 256;
        texture.height = 128;
        texture.depth = 3;
        texture.is2DArray = true;
        texture.mipLevelCount = 9;
        texture._hardwareTexture = new WebGPUHardwareTexture(engine);
    });

    it.each([1, 3, 12])("generates the mip chain for all %i array layers using the upload encoder", (depth) => {
        texture.depth = depth;

        engine._generateMipmaps(texture, uploadEncoder);

        expect(engine._textureHelper.generateMipmaps).toHaveBeenCalledTimes(depth);
        for (let layer = 0; layer < depth; ++layer) {
            expect(engine._textureHelper.generateMipmaps).toHaveBeenNthCalledWith(layer + 1, texture._hardwareTexture, 9, layer, uploadEncoder);
        }
        expect(engine._endCurrentRenderPass).not.toHaveBeenCalled();
        expect(engine._textureHelper.generateCubeMipmaps).not.toHaveBeenCalled();
        expect(engine._textureHelper.generate3DMipmaps).not.toHaveBeenCalled();
    });

    it("honors a limited mip count for every layer", () => {
        texture.mipLevelCount = 4;

        engine._generateMipmaps(texture, uploadEncoder);

        expect(engine._textureHelper.generateMipmaps).toHaveBeenCalledTimes(3);
        for (let layer = 0; layer < texture.depth; ++layer) {
            expect(engine._textureHelper.generateMipmaps).toHaveBeenNthCalledWith(layer + 1, texture._hardwareTexture, 4, layer, uploadEncoder);
        }
    });

    it("ends the active render pass once before generating all layers with the default encoder", () => {
        engine._generateMipmaps(texture);

        expect(engine._endCurrentRenderPass).toHaveBeenCalledOnce();
        expect(engine._textureHelper.generateMipmaps).toHaveBeenCalledTimes(3);
        expect(engine._endCurrentRenderPass).toHaveBeenCalledBefore(vi.mocked(engine._textureHelper.generateMipmaps));
        for (let layer = 0; layer < texture.depth; ++layer) {
            expect(engine._textureHelper.generateMipmaps).toHaveBeenNthCalledWith(layer + 1, texture._hardwareTexture, 9, layer, engine._renderEncoder);
        }
    });

    it("keeps raw 2D textures on layer zero with their configured mip count", () => {
        texture = new InternalTexture(engine, InternalTextureSource.Raw, true);
        texture.width = 256;
        texture.height = 128;
        texture.mipLevelCount = 4;
        texture._hardwareTexture = new WebGPUHardwareTexture(engine);

        engine._generateMipmaps(texture, uploadEncoder);

        expect(engine._textureHelper.generateMipmaps).toHaveBeenCalledExactlyOnceWith(texture._hardwareTexture, 4, 0, uploadEncoder);
    });

    it("keeps ordinary 2D textures on the computed mip count", () => {
        texture = new InternalTexture(engine, InternalTextureSource.Url, true);
        texture.width = 256;
        texture.height = 128;
        texture._hardwareTexture = new WebGPUHardwareTexture(engine);

        engine._generateMipmaps(texture, uploadEncoder);

        expect(engine._textureHelper.generateMipmaps).toHaveBeenCalledExactlyOnceWith(texture._hardwareTexture, 9, 0, uploadEncoder);
    });

    it("keeps cube textures on the cube generation path", () => {
        texture.isCube = true;

        engine._generateMipmaps(texture, uploadEncoder);

        expect(engine._textureHelper.generateCubeMipmaps).toHaveBeenCalledExactlyOnceWith(texture._hardwareTexture, 9, uploadEncoder);
        expect(engine._textureHelper.generateMipmaps).not.toHaveBeenCalled();
    });

    it("keeps 3D textures on the depth-aware generation path", () => {
        texture.is3D = true;
        texture.depth = 512;

        engine._generateMipmaps(texture, uploadEncoder);

        expect(engine._textureHelper.generate3DMipmaps).toHaveBeenCalledExactlyOnceWith(texture._hardwareTexture, 10, uploadEncoder);
        expect(engine._textureHelper.generateMipmaps).not.toHaveBeenCalled();
    });

    it("does not generate mipmaps without a hardware texture", () => {
        texture._hardwareTexture = null;

        ThinWebGPUEngine.prototype._generateMipmaps.call(engine, texture);

        expect(engine._endCurrentRenderPass).not.toHaveBeenCalled();
        expect(engine._textureHelper.generateMipmaps).not.toHaveBeenCalled();
    });
});
