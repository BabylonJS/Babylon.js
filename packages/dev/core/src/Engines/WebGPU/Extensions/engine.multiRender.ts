import { InternalTexture, InternalTextureSource } from "../../../Materials/Textures/internalTexture";
import type { IMultiRenderTargetOptions } from "../../../Materials/Textures/multiRenderTarget";
import { Logger } from "../../../Misc/logger";
import type { Nullable } from "../../../types";
import { Constants } from "../../constants";
import type { TextureSize } from "../../../Materials/Textures/textureCreationOptions";
import type { RenderTargetWrapper } from "../../renderTargetWrapper";
import { WebGPUEngine } from "../../webgpuEngine";
import type { WebGPURenderTargetWrapper } from "../webgpuRenderTargetWrapper";
import type { WebGPUHardwareTexture } from "../webgpuHardwareTexture";

WebGPUEngine.prototype.unBindMultiColorAttachmentFramebuffer = function (
    rtWrapper: RenderTargetWrapper,
    disableGenerateMipMaps: boolean = false,
    onBeforeUnbind?: () => void
): void {
    if (onBeforeUnbind) {
        onBeforeUnbind();
    }

    const attachments = rtWrapper._attachments!;
    const count = attachments.length;

    this._endCurrentRenderPass();

    for (let i = 0; i < count; i++) {
        const texture = rtWrapper.textures![i];
        if (texture.generateMipMaps && !disableGenerateMipMaps && !texture.isCube) {
            this._generateMipmaps(texture);
        }
    }

    this._currentRenderTarget = null;

    this._mrtAttachments = [];
    this._cacheRenderPipeline.setMRT([]);
    this._cacheRenderPipeline.setMRTAttachments(this._mrtAttachments);
};

WebGPUEngine.prototype.createMultipleRenderTarget = function (size: TextureSize, options: IMultiRenderTargetOptions, initializeBuffers?: boolean): RenderTargetWrapper {
    let generateMipMaps = false;
    let generateDepthBuffer = true;
    let generateStencilBuffer = false;
    let generateDepthTexture = false;
    let depthTextureFormat = Constants.TEXTUREFORMAT_DEPTH16;
    let textureCount = 1;

    const defaultType = Constants.TEXTURETYPE_UNSIGNED_INT;
    const defaultSamplingMode = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;
    const defaultUseSRGBBuffer = false;
    const defaultFormat = Constants.TEXTUREFORMAT_RGBA;
    const defaultTarget = Constants.TEXTURE_2D;

    let types: number[] = [];
    let samplingModes: number[] = [];
    let useSRGBBuffers: boolean[] = [];
    let formats: number[] = [];
    let targets: number[] = [];
    let faceIndex: number[] = [];
    let layerIndex: number[] = [];
    let layers: number[] = [];
    let labels: string[] = [];

    const rtWrapper = this._createHardwareRenderTargetWrapper(true, false, size) as WebGPURenderTargetWrapper;

    if (options !== undefined) {
        generateMipMaps = options.generateMipMaps === undefined ? false : options.generateMipMaps;
        generateDepthBuffer = options.generateDepthBuffer === undefined ? true : options.generateDepthBuffer;
        generateStencilBuffer = options.generateStencilBuffer === undefined ? false : options.generateStencilBuffer;
        generateDepthTexture = options.generateDepthTexture === undefined ? false : options.generateDepthTexture;
        textureCount = options.textureCount || 1;
        depthTextureFormat = options.depthTextureFormat ?? Constants.TEXTUREFORMAT_DEPTH16;

        if (options.types) {
            types = options.types;
        }
        if (options.samplingModes) {
            samplingModes = options.samplingModes;
        }
        if (options.useSRGBBuffers) {
            useSRGBBuffers = options.useSRGBBuffers;
        }
        if (options.formats) {
            formats = options.formats;
        }
        if (options.targetTypes) {
            targets = options.targetTypes;
        }
        if (options.faceIndex) {
            faceIndex = options.faceIndex;
        }
        if (options.layerIndex) {
            layerIndex = options.layerIndex;
        }
        if (options.layerCounts) {
            layers = options.layerCounts;
        }

        labels = options.labels ?? labels;
    }

    rtWrapper.label = options?.label ?? "MultiRenderTargetWrapper";

    const width = (<{ width: number; height: number }>size).width || <number>size;
    const height = (<{ width: number; height: number }>size).height || <number>size;

    let depthStencilTexture = null;
    if (generateDepthBuffer || generateStencilBuffer || generateDepthTexture) {
        if (!generateDepthTexture) {
            // The caller doesn't want a depth texture, so we are free to use the depth texture format we want.
            // So, we will align with what the WebGL engine does
            if (generateDepthBuffer && generateStencilBuffer) {
                depthTextureFormat = Constants.TEXTUREFORMAT_DEPTH24_STENCIL8;
            } else if (generateDepthBuffer) {
                depthTextureFormat = Constants.TEXTUREFORMAT_DEPTH32_FLOAT;
            } else {
                depthTextureFormat = Constants.TEXTUREFORMAT_STENCIL8;
            }
        }
        depthStencilTexture = rtWrapper.createDepthStencilTexture(0, false, generateStencilBuffer, 1, depthTextureFormat, "MultipleRenderTargetDepthStencil");
    }

    const textures: InternalTexture[] = [];
    const attachments: number[] = [];
    const defaultAttachments: number[] = [];

    rtWrapper._generateDepthBuffer = generateDepthBuffer;
    rtWrapper._generateStencilBuffer = generateStencilBuffer;
    rtWrapper._attachments = attachments;
    rtWrapper._defaultAttachments = defaultAttachments;

    for (let i = 0; i < textureCount; i++) {
        let samplingMode = samplingModes[i] || defaultSamplingMode;
        let type = types[i] || defaultType;

        const format = formats[i] || defaultFormat;
        const useSRGBBuffer = (useSRGBBuffers[i] || defaultUseSRGBBuffer) && this._caps.supportSRGBBuffers;

        const target = targets[i] || defaultTarget;
        const layerCount = layers[i] ?? 1;

        if (type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloatLinearFiltering) {
            // if floating point linear (FLOAT) then force to NEAREST_SAMPLINGMODE
            samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        } else if (type === Constants.TEXTURETYPE_HALF_FLOAT && !this._caps.textureHalfFloatLinearFiltering) {
            // if floating point linear (HALF_FLOAT) then force to NEAREST_SAMPLINGMODE
            samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        }

        if (type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloat) {
            type = Constants.TEXTURETYPE_UNSIGNED_INT;
            Logger.Warn("Float textures are not supported. Render target forced to TEXTURETYPE_UNSIGNED_BYTE type");
        }

        attachments.push(i + 1);
        defaultAttachments.push(initializeBuffers ? i + 1 : i === 0 ? 1 : 0);

        if (target === -1) {
            continue;
        }

        const texture = new InternalTexture(this, InternalTextureSource.MultiRenderTarget);
        textures[i] = texture;

        switch (target) {
            case Constants.TEXTURE_CUBE_MAP:
                texture.isCube = true;
                break;
            case Constants.TEXTURE_3D:
                texture.is3D = true;
                texture.baseDepth = texture.depth = layerCount;
                break;
            case Constants.TEXTURE_2D_ARRAY:
                texture.is2DArray = true;
                texture.baseDepth = texture.depth = layerCount;
                break;
        }

        texture.baseWidth = width;
        texture.baseHeight = height;
        texture.width = width;
        texture.height = height;
        texture.isReady = true;
        texture.samples = 1;
        texture.generateMipMaps = generateMipMaps;
        texture.samplingMode = samplingMode;
        texture.type = type;
        texture._cachedWrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        texture._cachedWrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        texture._useSRGBBuffer = useSRGBBuffer;
        texture.format = format;
        texture.label = labels[i];

        this._internalTexturesCache.push(texture);

        this._textureHelper.createGPUTextureForInternalTexture(texture);
    }

    if (depthStencilTexture) {
        depthStencilTexture.incrementReferences();
        textures[textureCount] = depthStencilTexture;
        this._internalTexturesCache.push(depthStencilTexture);
    }

    rtWrapper.setTextures(textures);
    rtWrapper.setLayerAndFaceIndices(layerIndex, faceIndex);

    return rtWrapper;
};

WebGPUEngine.prototype.updateMultipleRenderTargetTextureSampleCount = function (rtWrapper: Nullable<RenderTargetWrapper>, samples: number): number {
    if (!rtWrapper || !rtWrapper.textures || rtWrapper.textures[0].samples === samples) {
        return samples;
    }

    const count = rtWrapper.textures.length;

    if (count === 0) {
        return 1;
    }

    samples = Math.min(samples, this.getCaps().maxMSAASamples);

    for (let i = 0; i < count; ++i) {
        const texture = rtWrapper.textures[i];
        const gpuTextureWrapper = texture._hardwareTexture as Nullable<WebGPUHardwareTexture>;

        gpuTextureWrapper?.releaseMSAATexture();
    }

    // Note that rtWrapper.textures can't have null textures, lastTextureIsDepthTexture can't be true if rtWrapper._depthStencilTexture is null
    const lastTextureIsDepthTexture = rtWrapper._depthStencilTexture === rtWrapper.textures[count - 1];

    for (let i = 0; i < count; ++i) {
        const texture = rtWrapper.textures[i];
        this._textureHelper.createMSAATexture(texture, samples, false, i === count - 1 && lastTextureIsDepthTexture ? 0 : i);
        texture.samples = samples;
    }

    // Note that the last texture of textures is the depth texture if the depth texture has been generated by the MRT class and so the MSAA texture
    // will be recreated for this texture by the loop above: in that case, there's no need to create the MSAA texture for rtWrapper._depthStencilTexture
    // because rtWrapper._depthStencilTexture is the same texture than the depth texture
    if (rtWrapper._depthStencilTexture && !lastTextureIsDepthTexture) {
        this._textureHelper.createMSAATexture(rtWrapper._depthStencilTexture, samples);
        rtWrapper._depthStencilTexture.samples = samples;
    }

    return samples;
};

WebGPUEngine.prototype.bindAttachments = function (attachments: number[]): void {
    if (attachments.length === 0 || !this._currentRenderTarget) {
        return;
    }

    this._mrtAttachments = attachments;
    if (this._currentRenderPass) {
        // the render pass has already been created, we need to call setMRTAttachments to update the state of the attachments
        this._cacheRenderPipeline.setMRTAttachments(attachments);
    } else {
        // the render pass is not created yet so we don't need to call setMRTAttachments: it will be called as part of the render pass creation (see WebGPUEngine._startRenderTargetRenderPass)
    }
};

WebGPUEngine.prototype.buildTextureLayout = function (textureStatus: boolean[]): number[] {
    const result = [];

    for (let i = 0; i < textureStatus.length; i++) {
        if (textureStatus[i]) {
            result.push(i + 1);
        } else {
            result.push(0);
        }
    }

    return result;
};

WebGPUEngine.prototype.restoreSingleAttachment = function (): void {
    // not sure what to do, probably nothing... This function and restoreSingleAttachmentForRenderTarget are not called in Babylon.js so it's hard to know the use case
};

WebGPUEngine.prototype.restoreSingleAttachmentForRenderTarget = function (): void {
    // not sure what to do, probably nothing... This function and restoreSingleAttachment are not called in Babylon.js so it's hard to know the use case
};
