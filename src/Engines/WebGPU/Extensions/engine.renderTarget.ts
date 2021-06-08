import { InternalTexture, InternalTextureSource } from "../../../Materials/Textures/internalTexture";
import { RenderTargetCreationOptions } from "../../../Materials/Textures/renderTargetCreationOptions";
import { Nullable } from "../../../types";
import { Constants } from "../../constants";
import { DepthTextureCreationOptions } from "../../depthTextureCreationOptions";
import { WebGPUEngine } from "../../webgpuEngine";

WebGPUEngine.prototype.createRenderTargetTexture = function(size: any, options: boolean | RenderTargetCreationOptions): InternalTexture {
    let fullOptions = new RenderTargetCreationOptions();

    if (options !== undefined && typeof options === "object") {
        fullOptions.generateMipMaps = options.generateMipMaps;
        fullOptions.generateDepthBuffer = options.generateDepthBuffer === undefined ? true : options.generateDepthBuffer;
        fullOptions.generateStencilBuffer = fullOptions.generateDepthBuffer && options.generateStencilBuffer;
        fullOptions.type = options.type === undefined ? Constants.TEXTURETYPE_UNSIGNED_INT : options.type;
        fullOptions.samplingMode = options.samplingMode === undefined ? Constants.TEXTURE_TRILINEAR_SAMPLINGMODE : options.samplingMode;
        fullOptions.format = options.format === undefined ? Constants.TEXTUREFORMAT_RGBA : options.format;
        fullOptions.samples = options.samples ?? 1;
        fullOptions.creationFlags = options.creationFlags ?? 0;
    } else {
        fullOptions.generateMipMaps = <boolean>options;
        fullOptions.generateDepthBuffer = true;
        fullOptions.generateStencilBuffer = false;
        fullOptions.type = Constants.TEXTURETYPE_UNSIGNED_INT;
        fullOptions.samplingMode = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;
        fullOptions.format = Constants.TEXTUREFORMAT_RGBA;
        fullOptions.samples = 1;
        fullOptions.creationFlags = 0;
    }

    const texture = new InternalTexture(this, InternalTextureSource.RenderTarget);

    const width = size.width || size;
    const height = size.height || size;
    const layers = size.layers || 0;

    texture._depthStencilBuffer = {};
    texture._framebuffer = {};
    texture.baseWidth = width;
    texture.baseHeight = height;
    texture.width = width;
    texture.height = height;
    texture.depth = layers;
    texture.isReady = true;
    texture.samples = fullOptions.samples;
    texture.generateMipMaps = fullOptions.generateMipMaps ? true : false;
    texture.samplingMode = fullOptions.samplingMode;
    texture.type = fullOptions.type;
    texture.format = fullOptions.format;
    texture._generateDepthBuffer = fullOptions.generateDepthBuffer;
    texture._generateStencilBuffer = fullOptions.generateStencilBuffer ? true : false;
    texture.is2DArray = layers > 0;
    texture._cachedWrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
    texture._cachedWrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;

    this._internalTexturesCache.push(texture);

    if (texture._generateDepthBuffer || texture._generateStencilBuffer) {
        texture._depthStencilTexture = this.createDepthStencilTexture({ width, height, layers }, {
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

    if (options !== undefined && typeof options === "object" && options.createMipMaps && !fullOptions.generateMipMaps) {
        texture.generateMipMaps = true;
    }

    this._textureHelper.createGPUTextureForInternalTexture(texture, undefined, undefined, undefined, fullOptions.creationFlags);

    if (options !== undefined && typeof options === "object" && options.createMipMaps && !fullOptions.generateMipMaps) {
        texture.generateMipMaps = false;
    }

    return texture;
};

WebGPUEngine.prototype._createDepthStencilTexture = function(size: number | { width: number, height: number, layers?: number }, options: DepthTextureCreationOptions): InternalTexture {
    const internalTexture = new InternalTexture(this, InternalTextureSource.Depth);

    const internalOptions = {
        bilinearFiltering: false,
        comparisonFunction: 0,
        generateStencil: false,
        samples: 1,
        ...options
    };

    // TODO WEBGPU allow to choose the format?
    internalTexture.format = internalOptions.generateStencil ? Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 : Constants.TEXTUREFORMAT_DEPTH32_FLOAT;

    this._setupDepthStencilTexture(internalTexture, size, internalOptions.generateStencil, internalOptions.bilinearFiltering, internalOptions.comparisonFunction, internalOptions.samples);

    this._textureHelper.createGPUTextureForInternalTexture(internalTexture);

    this._internalTexturesCache.push(internalTexture);

    return internalTexture;
};

WebGPUEngine.prototype._setupDepthStencilTexture = function(internalTexture: InternalTexture, size: number | { width: number, height: number, layers?: number }, generateStencil: boolean, bilinearFiltering: boolean, comparisonFunction: number, samples = 1): void {
    const width = (<{ width: number, height: number, layers?: number }>size).width || <number>size;
    const height = (<{ width: number, height: number, layers?: number }>size).height || <number>size;
    const layers = (<{ width: number, height: number, layers?: number }>size).layers || 0;

    internalTexture.baseWidth = width;
    internalTexture.baseHeight = height;
    internalTexture.width = width;
    internalTexture.height = height;
    internalTexture.is2DArray = layers > 0;
    internalTexture.depth = layers;
    internalTexture.isReady = true;
    internalTexture.samples = samples;
    internalTexture.generateMipMaps = false;
    internalTexture._generateDepthBuffer = true;
    internalTexture._generateStencilBuffer = generateStencil;
    internalTexture.samplingMode = bilinearFiltering ? Constants.TEXTURE_BILINEAR_SAMPLINGMODE : Constants.TEXTURE_NEAREST_SAMPLINGMODE;
    internalTexture.type = Constants.TEXTURETYPE_UNSIGNED_INT;
    internalTexture._comparisonFunction = comparisonFunction;
    internalTexture._cachedWrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
    internalTexture._cachedWrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
};

WebGPUEngine.prototype.updateRenderTargetTextureSampleCount = function(texture: Nullable<InternalTexture>, samples: number): number {
    if (!texture || texture.samples === samples) {
        return samples;
    }

    samples = Math.min(samples, this.getCaps().maxMSAASamples);

    if (samples > 1) {
        // TODO WEBGPU for the time being, Chrome only accepts values of 1 or 4
        samples = 4;
    }

    this._textureHelper.createMSAATexture(texture, samples);

    if (texture._depthStencilTexture) {
        this._textureHelper.createMSAATexture(texture._depthStencilTexture, samples);
        texture._depthStencilTexture.samples = samples;
    }

    texture.samples = samples;

    return samples;
};
