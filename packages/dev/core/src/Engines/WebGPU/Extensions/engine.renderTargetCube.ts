import { ThinWebGPUEngine } from "core/Engines/thinWebGPUEngine";
import { InternalTexture, InternalTextureSource } from "../../../Materials/Textures/internalTexture";
import type { RenderTargetCreationOptions } from "../../../Materials/Textures/textureCreationOptions";
import { Constants } from "../../constants";
import type { RenderTargetWrapper } from "../../renderTargetWrapper";

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

ThinWebGPUEngine.prototype.createRenderTargetCubeTexture = function (size: number, options?: RenderTargetCreationOptions): RenderTargetWrapper {
    const rtWrapper = this._createHardwareRenderTargetWrapper(false, true, size);

    const fullOptions = {
        generateMipMaps: true,
        generateDepthBuffer: true,
        generateStencilBuffer: false,
        type: Constants.TEXTURETYPE_UNSIGNED_INT,
        samplingMode: Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
        format: Constants.TEXTUREFORMAT_RGBA,
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
                fullOptions.samplingMode === Constants.TEXTURE_BILINEAR_SAMPLINGMODE ||
                fullOptions.samplingMode === Constants.TEXTURE_LINEAR_LINEAR ||
                fullOptions.samplingMode === Constants.TEXTURE_TRILINEAR_SAMPLINGMODE ||
                fullOptions.samplingMode === Constants.TEXTURE_LINEAR_LINEAR_MIPLINEAR ||
                fullOptions.samplingMode === Constants.TEXTURE_NEAREST_LINEAR_MIPNEAREST ||
                fullOptions.samplingMode === Constants.TEXTURE_NEAREST_LINEAR_MIPLINEAR ||
                fullOptions.samplingMode === Constants.TEXTURE_NEAREST_LINEAR ||
                fullOptions.samplingMode === Constants.TEXTURE_LINEAR_LINEAR_MIPNEAREST,
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
