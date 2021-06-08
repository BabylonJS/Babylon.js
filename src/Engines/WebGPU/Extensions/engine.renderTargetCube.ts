import { InternalTexture, InternalTextureSource } from "../../../Materials/Textures/internalTexture";
import { RenderTargetCreationOptions } from "../../../Materials/Textures/renderTargetCreationOptions";
import { Constants } from "../../constants";
import { WebGPUEngine } from "../../webgpuEngine";

WebGPUEngine.prototype.createRenderTargetCubeTexture = function(size: number, options?: Partial<RenderTargetCreationOptions>): InternalTexture {
    let fullOptions = {
        generateMipMaps: true,
        generateDepthBuffer: true,
        generateStencilBuffer: false,
        type: Constants.TEXTURETYPE_UNSIGNED_INT,
        samplingMode: Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
        format: Constants.TEXTUREFORMAT_RGBA,
        samples: 1,
        ...options
    };
    fullOptions.generateStencilBuffer = fullOptions.generateDepthBuffer && fullOptions.generateStencilBuffer;

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
    texture._generateDepthBuffer = fullOptions.generateDepthBuffer;
    texture._generateStencilBuffer = fullOptions.generateStencilBuffer;

    this._internalTexturesCache.push(texture);

    if (texture._generateDepthBuffer || texture._generateStencilBuffer) {
        texture._depthStencilTexture = this.createDepthStencilTexture({ width: texture.width, height: texture.height, layers: texture.depth }, {
            bilinearFiltering:
                fullOptions.samplingMode === undefined ||
                fullOptions.samplingMode === Constants.TEXTURE_BILINEAR_SAMPLINGMODE || fullOptions.samplingMode === Constants.TEXTURE_LINEAR_LINEAR ||
                fullOptions.samplingMode === Constants.TEXTURE_TRILINEAR_SAMPLINGMODE || fullOptions.samplingMode === Constants.TEXTURE_LINEAR_LINEAR_MIPLINEAR ||
                fullOptions.samplingMode === Constants.TEXTURE_NEAREST_LINEAR_MIPNEAREST || fullOptions.samplingMode === Constants.TEXTURE_NEAREST_LINEAR_MIPLINEAR ||
                fullOptions.samplingMode === Constants.TEXTURE_NEAREST_LINEAR || fullOptions.samplingMode === Constants.TEXTURE_LINEAR_LINEAR_MIPNEAREST,
            comparisonFunction: 0,
            generateStencil: texture._generateStencilBuffer,
            isCube: texture.isCube,
            samples: texture.samples,
        });
    }

    if (options && options.createMipMaps && !fullOptions.generateMipMaps) {
        texture.generateMipMaps = true;
    }

    this._textureHelper.createGPUTextureForInternalTexture(texture);

    if (options && options.createMipMaps && !fullOptions.generateMipMaps) {
        texture.generateMipMaps = false;
    }

    return texture;
};
