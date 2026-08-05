/**
 * @vitest-environment jsdom
 */

import { ThinWebGPUEngine } from "core/Engines/thinWebGPUEngine";
import { Constants } from "core/Engines/constants";
import { RegisterEnginesWebGPUExtensionsEngineRawTexture } from "core/Engines/WebGPU/Extensions/engine.rawTexture.pure";
import type {} from "core/Engines/WebGPU/Extensions/engine.rawTexture.types";
import { InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture";
import { describe, expect, it, vi } from "vitest";

describe("WebGPU updateRawCubeTexture invertY", () => {
    it("passes InternalTexture (not GPUTexture) into updateCubeTextures when invertY is true", () => {
        RegisterEnginesWebGPUExtensionsEngineRawTexture();

        const updateCubeTextures = vi.fn();
        const engine = Object.create(ThinWebGPUEngine.prototype) as ThinWebGPUEngine & {
            _textureHelper: { updateCubeTextures: typeof updateCubeTextures };
            _generateMipmaps: ReturnType<typeof vi.fn>;
            _uploadEncoder: unknown;
        };
        engine._textureHelper = { updateCubeTextures };
        engine._generateMipmaps = vi.fn();
        engine._uploadEncoder = {};

        // Minimal InternalTexture + hardware texture stub — enough for updateRawCubeTexture.
        const texture = Object.create(InternalTexture.prototype) as InternalTexture;
        texture.width = 2;
        texture.height = 2;
        texture.generateMipMaps = false;
        (texture as any)._source = InternalTextureSource.CubeRaw;
        texture._hardwareTexture = {
            format: "rgba8unorm",
            _originalFormatIsRGB: false,
            underlyingResource: { label: "fake-gpu-texture" },
        } as any;

        const face = new Uint8Array(2 * 2 * 4);
        const faces = [face, face, face, face, face, face];

        engine.updateRawCubeTexture(texture, faces, Constants.TEXTUREFORMAT_RGBA, Constants.TEXTURETYPE_UNSIGNED_BYTE, true);

        expect(updateCubeTextures).toHaveBeenCalledTimes(1);
        const [, textureArg, , , , invertYArg] = updateCubeTextures.mock.calls[0];
        expect(textureArg).toBe(texture);
        expect(textureArg).not.toBe(texture._hardwareTexture!.underlyingResource);
        expect(invertYArg).toBe(true);
    });
});
