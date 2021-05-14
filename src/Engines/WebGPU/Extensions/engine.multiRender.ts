import { InternalTexture, InternalTextureSource } from "../../../Materials/Textures/internalTexture";
import { IMultiRenderTargetOptions } from "../../../Materials/Textures/multiRenderTarget";
import { Logger } from "../../../Misc/logger";
import { Nullable } from "../../../types";
import { Constants } from "../../constants";
import { WebGPUEngine } from "../../webgpuEngine";

WebGPUEngine.prototype.unBindMultiColorAttachmentFramebuffer = function(textures: InternalTexture[], disableGenerateMipMaps: boolean = false, onBeforeUnbind?: () => void): void {
    if (onBeforeUnbind) {
        onBeforeUnbind();
    }

    const attachments = textures[0]._attachments!;
    const count = attachments.length;

    if (this._currentRenderPass && this._currentRenderPass !== this._mainRenderPassWrapper.renderPass) {
        this._endRenderTargetRenderPass();
    }

    for (let i = 0; i < count; i++) {
        const texture = textures[i];
        if (texture.generateMipMaps && !disableGenerateMipMaps && !texture.isCube) {
            this._generateMipmaps(texture);
        }
    }

    this._currentRenderTarget = null;

    this._mrtAttachments = [];
    this._cacheRenderPipeline.setMRTAttachments(this._mrtAttachments, []);
    this._currentRenderPass = this._mainRenderPassWrapper.renderPass;
    this._setDepthTextureFormat(this._mainRenderPassWrapper);
    this._setColorFormat(this._mainRenderPassWrapper);
};

WebGPUEngine.prototype.createMultipleRenderTarget = function(size: any, options: IMultiRenderTargetOptions): InternalTexture[] {
    let generateMipMaps = false;
    let generateDepthBuffer = true;
    let generateStencilBuffer = false;
    let generateDepthTexture = false;
    let textureCount = 1;

    let defaultType = Constants.TEXTURETYPE_UNSIGNED_INT;
    let defaultSamplingMode = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;

    let types = new Array<number>();
    let samplingModes = new Array<number>();

    if (options !== undefined) {
        generateMipMaps = options.generateMipMaps === undefined ? false : options.generateMipMaps;
        generateDepthBuffer = options.generateDepthBuffer === undefined ? true : options.generateDepthBuffer;
        generateStencilBuffer = options.generateStencilBuffer === undefined ? false : options.generateStencilBuffer;
        generateDepthTexture = options.generateDepthTexture === undefined ? false : options.generateDepthTexture;
        textureCount = options.textureCount || 1;

        if (options.types) {
            types = options.types;
        }
        if (options.samplingModes) {
            samplingModes = options.samplingModes;
        }

    }

    const width = size.width || size;
    const height = size.height || size;

    let depthStencilTexture = null;
    if (generateDepthBuffer || generateStencilBuffer || generateDepthTexture) {
        depthStencilTexture = this.createDepthStencilTexture({ width, height }, {
            bilinearFiltering: false,
            comparisonFunction: 0,
            generateStencil: generateStencilBuffer,
            isCube: false,
            samples: 1,
        });
    }

    const textures = [];
    const attachments = [];

    for (let i = 0; i < textureCount; i++) {
        let samplingMode = samplingModes[i] || defaultSamplingMode;
        let type = types[i] || defaultType;

        if (type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloatLinearFiltering) {
            // if floating point linear (gl.FLOAT) then force to NEAREST_SAMPLINGMODE
            samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        }
        else if (type === Constants.TEXTURETYPE_HALF_FLOAT && !this._caps.textureHalfFloatLinearFiltering) {
            // if floating point linear (HALF_FLOAT) then force to NEAREST_SAMPLINGMODE
            samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        }

        if (type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloat) {
            type = Constants.TEXTURETYPE_UNSIGNED_INT;
            Logger.Warn("Float textures are not supported. Render target forced to TEXTURETYPE_UNSIGNED_BYTE type");
        }

        const texture = new InternalTexture(this, InternalTextureSource.MultiRenderTarget);

        textures.push(texture);
        attachments.push(i + 1);

        texture._depthStencilTexture = i === 0 ? depthStencilTexture : null;
        texture._framebuffer = {};
        texture._depthStencilBuffer = {};
        texture.baseWidth = width;
        texture.baseHeight = height;
        texture.width = width;
        texture.height = height;
        texture.isReady = true;
        texture.samples = 1;
        texture.generateMipMaps = generateMipMaps;
        texture.samplingMode = samplingMode;
        texture.type = type;
        texture._generateDepthBuffer = generateDepthBuffer;
        texture._generateStencilBuffer = generateStencilBuffer ? true : false;
        texture._attachments = attachments;
        texture._textureArray = textures;
        texture._cachedWrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
        texture._cachedWrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;

        this._internalTexturesCache.push(texture);

        this._textureHelper.createGPUTextureForInternalTexture(texture);
    }

    if (depthStencilTexture) {
        textures.push(depthStencilTexture);
        this._internalTexturesCache.push(depthStencilTexture);
    }

    return textures;
};

WebGPUEngine.prototype.updateMultipleRenderTargetTextureSampleCount = function(textures: Nullable<InternalTexture[]>, samples: number): number {
    if (!textures || textures[0].samples === samples) {
        return samples;
    }

    samples = Math.min(samples, this.getCaps().maxMSAASamples);

    if (samples > 1) {
        // TODO WEBGPU for the time being, Chrome only accepts values of 1 or 4
        samples = 4;
    }

    // Note that the last texture of textures is the depth texture (if the depth texture has been generated by the MRT class) and so the MSAA texture
    // will be recreated for this texture too. As a consequence, there's no need to explicitly recreate the MSAA texture for textures[0]._depthStencilTexture
    for (let i = 0; i < textures.length; ++i) {
        const texture = textures[i];
        this._textureHelper.createMSAATexture(texture, samples);
        texture.samples = samples;
    }

    return samples;
};

WebGPUEngine.prototype.bindAttachments = function(attachments: number[]): void {
    if (attachments.length === 0 || !this._currentRenderTarget) {
        return;
    }

    this._mrtAttachments = attachments;
};

WebGPUEngine.prototype.buildTextureLayout = function(textureStatus: boolean[]): number[] {
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

WebGPUEngine.prototype.restoreSingleAttachment = function(): void {
    // nothing to do, this is done automatically in the unBindFramebuffer function
};
