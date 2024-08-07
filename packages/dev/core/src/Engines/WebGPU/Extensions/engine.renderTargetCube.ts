import { InternalTexture, InternalTextureSource } from "../../../Materials/Textures/internalTexture";
import type { RenderTargetCreationOptions } from "../../../Materials/Textures/textureCreationOptions";
import {
    TEXTURETYPE_UNSIGNED_INT,
    TEXTURE_TRILINEAR_SAMPLINGMODE,
    TEXTUREFORMAT_RGBA,
    TEXTURE_BILINEAR_SAMPLINGMODE,
    TEXTURE_LINEAR_LINEAR,
    TEXTURE_LINEAR_LINEAR_MIPLINEAR,
    TEXTURE_NEAREST_LINEAR_MIPNEAREST,
    TEXTURE_NEAREST_LINEAR_MIPLINEAR,
    TEXTURE_NEAREST_LINEAR,
    TEXTURE_LINEAR_LINEAR_MIPNEAREST,
} from "../../constants";
import type { RenderTargetWrapper } from "../../renderTargetWrapper";
import { WebGPUEngine } from "../../webgpuEngine";

declare module "../../abstractEngine" {
    export interface AbstractEngine {
        /**
         * Creates a new render target cube wrapper
         * @param size defines the size of the texture
         * @param options defines the options used to create the texture
         * @returns a new render target cube wrapper
         */
        createRenderTargetCubeTexture(size: number, options?: RenderTargetCreationOptions): RenderTargetWrapper;
    }
}

WebGPUEngine.prototype.createRenderTargetCubeTexture = function (size: number, options?: RenderTargetCreationOptions): RenderTargetWrapper {
    const rtWrapper = this._createHardwareRenderTargetWrapper(false, true, size);

    const fullOptions = {
        generateMipMaps: true,
        generateDepthBuffer: true,
        generateStencilBuffer: false,
        type: TEXTURETYPE_UNSIGNED_INT,
        samplingMode: TEXTURE_TRILINEAR_SAMPLINGMODE,
        format: TEXTUREFORMAT_RGBA,
        samples: 1,
        ...options,
    };
    fullOptions.generateStencilBuffer = fullOptions.generateDepthBuffer && fullOptions.generateStencilBuffer;

    rtWrapper.label = fullOptions.label ?? "RenderTargetWrapper";
    rtWrapper._generateDepthBuffer = fullOptions.generateDepthBuffer;
    rtWrapper._generateStencilBuffer = fullOptions.generateStencilBuffer;

    const texture = new InternalTexture(this, InternalTextureSource.RenderTarget);

    texture.width = size;
    texture.height = size;
    texture.depth = 0;
    texture.isReady = true;
    texture.isCube = true;
    texture.samples = fullOptions.samples;
    texture.generateMipMaps = fullOptions.generateMipMaps;
    texture.samplingMode = fullOptions.samplingMode;
    texture.type = fullOptions.type;
    texture.format = fullOptions.format;

    this._internalTexturesCache.push(texture);
    rtWrapper.setTextures(texture);

    if (rtWrapper._generateDepthBuffer || rtWrapper._generateStencilBuffer) {
        rtWrapper.createDepthStencilTexture(
            0,
            fullOptions.samplingMode === undefined ||
                fullOptions.samplingMode === TEXTURE_BILINEAR_SAMPLINGMODE ||
                fullOptions.samplingMode === TEXTURE_LINEAR_LINEAR ||
                fullOptions.samplingMode === TEXTURE_TRILINEAR_SAMPLINGMODE ||
                fullOptions.samplingMode === TEXTURE_LINEAR_LINEAR_MIPLINEAR ||
                fullOptions.samplingMode === TEXTURE_NEAREST_LINEAR_MIPNEAREST ||
                fullOptions.samplingMode === TEXTURE_NEAREST_LINEAR_MIPLINEAR ||
                fullOptions.samplingMode === TEXTURE_NEAREST_LINEAR ||
                fullOptions.samplingMode === TEXTURE_LINEAR_LINEAR_MIPNEAREST,
            rtWrapper._generateStencilBuffer,
            rtWrapper.samples
        );
    }

    if (options && options.createMipMaps && !fullOptions.generateMipMaps) {
        texture.generateMipMaps = true;
    }

    this._textureHelper.createGPUTextureForInternalTexture(texture);

    if (options && options.createMipMaps && !fullOptions.generateMipMaps) {
        texture.generateMipMaps = false;
    }

    return rtWrapper;
};
