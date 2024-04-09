import { InternalTexture, InternalTextureSource } from "../../../Materials/Textures/internalTexture";
import type { RenderTargetCreationOptions, DepthTextureCreationOptions, TextureSize } from "../../../Materials/Textures/textureCreationOptions";
import type { Nullable } from "../../../types";
import { Constants } from "../../constants";
import type { RenderTargetWrapper } from "../../renderTargetWrapper";
import { WebGPUEngine } from "../../webgpuEngine";
import type { WebGPUHardwareTexture } from "../webgpuHardwareTexture";
import { WebGPURenderTargetWrapper } from "../webgpuRenderTargetWrapper";
import { WebGPUTextureHelper } from "../webgpuTextureHelper";

WebGPUEngine.prototype._createHardwareRenderTargetWrapper = function (isMulti: boolean, isCube: boolean, size: TextureSize): WebGPURenderTargetWrapper {
    const rtWrapper = new WebGPURenderTargetWrapper(isMulti, isCube, size, this);
    this._renderTargetWrapperCache.push(rtWrapper);
    return rtWrapper;
};

WebGPUEngine.prototype.createRenderTargetTexture = function (size: TextureSize, options: boolean | RenderTargetCreationOptions): WebGPURenderTargetWrapper {
    const rtWrapper = this._createHardwareRenderTargetWrapper(false, false, size) as WebGPURenderTargetWrapper;

    const fullOptions: RenderTargetCreationOptions = {};

    if (options !== undefined && typeof options === "object") {
        fullOptions.generateMipMaps = options.generateMipMaps;
        fullOptions.generateDepthBuffer = options.generateDepthBuffer === undefined ? true : options.generateDepthBuffer;
        fullOptions.generateStencilBuffer = fullOptions.generateDepthBuffer && options.generateStencilBuffer;
        fullOptions.samplingMode = options.samplingMode === undefined ? Constants.TEXTURE_TRILINEAR_SAMPLINGMODE : options.samplingMode;
        fullOptions.creationFlags = options.creationFlags ?? 0;
        fullOptions.noColorAttachment = !!options.noColorAttachment;
        fullOptions.samples = options.samples;
        fullOptions.label = options.label;
    } else {
        fullOptions.generateMipMaps = <boolean>options;
        fullOptions.generateDepthBuffer = true;
        fullOptions.generateStencilBuffer = false;
        fullOptions.samplingMode = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;
        fullOptions.creationFlags = 0;
        fullOptions.noColorAttachment = false;
    }

    const texture = fullOptions.noColorAttachment ? null : this._createInternalTexture(size, options, true, InternalTextureSource.RenderTarget);

    rtWrapper.label = fullOptions.label ?? "RenderTargetWrapper";
    rtWrapper._samples = fullOptions.samples ?? 1;
    rtWrapper._generateDepthBuffer = fullOptions.generateDepthBuffer;
    rtWrapper._generateStencilBuffer = fullOptions.generateStencilBuffer ? true : false;

    rtWrapper.setTextures(texture);

    if (rtWrapper._generateDepthBuffer || rtWrapper._generateStencilBuffer) {
        rtWrapper.createDepthStencilTexture(
            0,
            false, // force false as filtering is not supported for depth textures
            rtWrapper._generateStencilBuffer,
            rtWrapper.samples,
            fullOptions.generateStencilBuffer ? Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 : Constants.TEXTUREFORMAT_DEPTH32_FLOAT,
            fullOptions.label ? fullOptions.label + "-DepthStencil" : undefined
        );
    }

    if (texture) {
        if (options !== undefined && typeof options === "object" && options.createMipMaps && !fullOptions.generateMipMaps) {
            texture.generateMipMaps = true;
        }

        this._textureHelper.createGPUTextureForInternalTexture(texture, undefined, undefined, undefined, fullOptions.creationFlags);

        if (options !== undefined && typeof options === "object" && options.createMipMaps && !fullOptions.generateMipMaps) {
            texture.generateMipMaps = false;
        }
    }

    return rtWrapper;
};

WebGPUEngine.prototype._createDepthStencilTexture = function (size: TextureSize, options: DepthTextureCreationOptions): InternalTexture {
    const internalTexture = new InternalTexture(this, options.generateStencil ? InternalTextureSource.DepthStencil : InternalTextureSource.Depth);

    internalTexture.label = options.label;

    const internalOptions = {
        bilinearFiltering: false,
        comparisonFunction: 0,
        generateStencil: false,
        samples: 1,
        depthTextureFormat: options.generateStencil ? Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 : Constants.TEXTUREFORMAT_DEPTH32_FLOAT,
        ...options,
    };

    internalTexture.format = internalOptions.depthTextureFormat;

    this._setupDepthStencilTexture(
        internalTexture,
        size,
        internalOptions.generateStencil,
        internalOptions.bilinearFiltering,
        internalOptions.comparisonFunction,
        internalOptions.samples
    );

    this._textureHelper.createGPUTextureForInternalTexture(internalTexture);

    // Now that the hardware texture is created, we can retrieve the GPU format and set the right type to the internal texture
    const gpuTextureWrapper = internalTexture._hardwareTexture as WebGPUHardwareTexture;

    internalTexture.type = WebGPUTextureHelper.GetTextureTypeFromFormat(gpuTextureWrapper.format);

    this._internalTexturesCache.push(internalTexture);

    return internalTexture;
};

WebGPUEngine.prototype._setupDepthStencilTexture = function (
    internalTexture: InternalTexture,
    size: TextureSize,
    generateStencil: boolean,
    bilinearFiltering: boolean,
    comparisonFunction: number,
    samples = 1
): void {
    const width = (<{ width: number; height: number; layers?: number }>size).width || <number>size;
    const height = (<{ width: number; height: number; layers?: number }>size).height || <number>size;
    const layers = (<{ width: number; height: number; depth?: number; layers?: number }>size).layers || 0;
    const depth = (<{ width: number; height: number; depth?: number; layers?: number }>size).depth || 0;

    internalTexture.baseWidth = width;
    internalTexture.baseHeight = height;
    internalTexture.width = width;
    internalTexture.height = height;
    internalTexture.is2DArray = layers > 0;
    internalTexture.is3D = depth > 0;
    internalTexture.depth = layers || depth;
    internalTexture.isReady = true;
    internalTexture.samples = samples;
    internalTexture.generateMipMaps = false;
    internalTexture.samplingMode = bilinearFiltering ? Constants.TEXTURE_BILINEAR_SAMPLINGMODE : Constants.TEXTURE_NEAREST_SAMPLINGMODE;
    internalTexture.type = Constants.TEXTURETYPE_FLOAT;
    internalTexture._comparisonFunction = comparisonFunction;
    internalTexture._cachedWrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
    internalTexture._cachedWrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
};

WebGPUEngine.prototype.updateRenderTargetTextureSampleCount = function (rtWrapper: Nullable<RenderTargetWrapper>, samples: number): number {
    if (!rtWrapper || !rtWrapper.texture || rtWrapper.samples === samples) {
        return samples;
    }

    samples = Math.min(samples, this.getCaps().maxMSAASamples);

    this._textureHelper.createMSAATexture(rtWrapper.texture, samples);

    if (rtWrapper._depthStencilTexture) {
        this._textureHelper.createMSAATexture(rtWrapper._depthStencilTexture, samples);
        rtWrapper._depthStencilTexture.samples = samples;
    }

    rtWrapper._samples = samples;
    rtWrapper.texture.samples = samples;

    return samples;
};
