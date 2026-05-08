/** This file must only contain pure code and pure imports */

import { InternalTexture, InternalTextureSource } from "../../../Materials/Textures/internalTexture";
import { type IMultiRenderTargetOptions } from "../../../Materials/Textures/multiRenderTarget.pure";
import { Logger } from "../../../Misc/logger";
import { type Nullable } from "../../../types";
import { Constants } from "../../constants";
import { type TextureSize } from "../../../Materials/Textures/textureCreationOptions";
import { type RenderTargetWrapper } from "../../renderTargetWrapper";
import { WebGPUEngine } from "../../webgpuEngine.pure";
import { type WebGPURenderTargetWrapper } from "../webgpuRenderTargetWrapper";
import { type WebGPUHardwareTexture } from "../webgpuHardwareTexture";

let _Registered = false;
/**
 * Register side effects for enginesWebGPUExtensionsEngineMultiRender.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterEnginesWebGPUExtensionsEngineMultiRender(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    WebGPUEngine.prototype.unBindMultiColorAttachmentFramebuffer = function (
        rtWrapper: RenderTargetWrapper,
        disableGenerateMipMaps: boolean = false,
        onBeforeUnbind?: () => void
    ): void {
        if (onBeforeUnbind) {
            onBeforeUnbind();
        }

        this._endCurrentRenderPass();

        if (!rtWrapper.disableAutomaticMSAAResolve) {
            this.resolveMultiFramebuffer(rtWrapper, false);
        }

        if (!disableGenerateMipMaps) {
            this.generateMipMapsMultiFramebuffer(rtWrapper);
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
        let samples = 1;

        const defaultType = Constants.TEXTURETYPE_UNSIGNED_BYTE;
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
        let creationFlags: number[] = [];
        let dontCreateTextures = false;

        const rtWrapper = this._createHardwareRenderTargetWrapper(true, false, size) as WebGPURenderTargetWrapper;

        if (options !== undefined) {
            generateMipMaps = options.generateMipMaps ?? false;
            generateDepthBuffer = options.generateDepthBuffer ?? true;
            generateStencilBuffer = options.generateStencilBuffer ?? false;
            generateDepthTexture = options.generateDepthTexture ?? false;
            textureCount = options.textureCount ?? 1;
            depthTextureFormat = options.depthTextureFormat ?? Constants.TEXTUREFORMAT_DEPTH16;
            types = options.types || types;
            samplingModes = options.samplingModes || samplingModes;
            useSRGBBuffers = options.useSRGBBuffers || useSRGBBuffers;
            formats = options.formats || formats;
            targets = options.targetTypes || targets;
            faceIndex = options.faceIndex || faceIndex;
            layerIndex = options.layerIndex || layerIndex;
            layers = options.layerCounts || layers;
            labels = options.labels || labels;
            creationFlags = options.creationFlags || creationFlags;
            samples = options.samples ?? samples;
            dontCreateTextures = options.dontCreateTextures ?? false;
        }

        const width = (<{ width: number; height: number }>size).width ?? <number>size;
        const height = (<{ width: number; height: number }>size).height ?? <number>size;

        const textures: InternalTexture[] = [];
        const attachments: number[] = [];
        const defaultAttachments: number[] = [];

        rtWrapper.label = options?.label ?? "MultiRenderTargetWrapper";
        rtWrapper._generateDepthBuffer = generateDepthBuffer;
        rtWrapper._generateStencilBuffer = generateStencilBuffer;
        rtWrapper._attachments = attachments;
        rtWrapper._defaultAttachments = defaultAttachments;

        let depthStencilTexture: Nullable<InternalTexture> = null;
        if ((generateDepthBuffer || generateStencilBuffer || generateDepthTexture) && !dontCreateTextures) {
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
            depthStencilTexture = rtWrapper.createDepthStencilTexture(0, false, generateStencilBuffer, 1, depthTextureFormat, rtWrapper.label + "-DepthStencil");
        }

        const mipmapsCreationOnly = options !== undefined && typeof options === "object" && options.createMipMaps && !generateMipMaps;

        for (let i = 0; i < textureCount; i++) {
            let samplingMode = samplingModes[i] || defaultSamplingMode;
            let type = types[i] || defaultType;

            const format = formats[i] || defaultFormat;
            const useSRGBBuffer = (useSRGBBuffers[i] || defaultUseSRGBBuffer) && this._caps.supportSRGBBuffers;

            const target = targets[i] || defaultTarget;
            const layerCount = layers[i] ?? 1;
            const creationFlag = creationFlags[i];

            if (type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloatLinearFiltering) {
                // if floating point linear (FLOAT) then force to NEAREST_SAMPLINGMODE
                samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
            } else if (type === Constants.TEXTURETYPE_HALF_FLOAT && !this._caps.textureHalfFloatLinearFiltering) {
                // if floating point linear (HALF_FLOAT) then force to NEAREST_SAMPLINGMODE
                samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
            }

            if (type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloat) {
                type = Constants.TEXTURETYPE_UNSIGNED_BYTE;
                Logger.Warn("Float textures are not supported. Render target forced to TEXTURETYPE_UNSIGNED_BYTE type");
            }

            attachments.push(i + 1);
            defaultAttachments.push(initializeBuffers ? i + 1 : i === 0 ? 1 : 0);

            if (target === -1 || dontCreateTextures) {
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
            texture.label = labels[i] ?? rtWrapper.label + "-Texture" + i;

            this._internalTexturesCache.push(texture);

            if (mipmapsCreationOnly) {
                // createGPUTextureForInternalTexture will only create a texture with mipmaps if generateMipMaps is true, as InternalTexture has no createMipMaps property, separate from generateMipMaps.
                texture.generateMipMaps = true;
            }

            this._textureHelper.createGPUTextureForInternalTexture(texture, undefined, undefined, undefined, creationFlag);

            if (mipmapsCreationOnly) {
                texture.generateMipMaps = false;
            }
        }

        if (depthStencilTexture) {
            depthStencilTexture.incrementReferences();
            textures[textureCount] = depthStencilTexture;
            this._internalTexturesCache.push(depthStencilTexture);
        }

        rtWrapper.setTextures(textures);
        rtWrapper.setLayerAndFaceIndices(layerIndex, faceIndex);

        if (!dontCreateTextures) {
            this.updateMultipleRenderTargetTextureSampleCount(rtWrapper, samples);
        } else {
            rtWrapper._samples = samples;
        }

        return rtWrapper;
    };

    WebGPUEngine.prototype.updateMultipleRenderTargetTextureSampleCount = function (rtWrapper: Nullable<RenderTargetWrapper>, samples: number): number {
        if (!rtWrapper || !rtWrapper.textures || rtWrapper.textures.length === 0 || rtWrapper.textures[0].samples === samples) {
            return samples;
        }

        const count = rtWrapper.textures.length;

        if (count === 0) {
            return 1;
        }

        samples = Math.min(samples, this.getCaps().maxMSAASamples);

        // Release existing MSAA textures
        for (let i = 0; i < count; ++i) {
            const texture = rtWrapper.textures[i];
            const gpuTextureWrapper = texture._hardwareTexture as Nullable<WebGPUHardwareTexture>;

            gpuTextureWrapper?.releaseMSAATextures();
        }

        // Sets new sample count. The MSAA textures will be created on demand.
        for (let i = 0; i < count; ++i) {
            const texture = rtWrapper.textures[i];
            texture.samples = samples;
        }

        if (rtWrapper._depthStencilTexture) {
            rtWrapper._depthStencilTexture.samples = samples;
        }

        rtWrapper._samples = samples;

        return samples;
    };

    WebGPUEngine.prototype.generateMipMapsMultiFramebuffer = function (texture: RenderTargetWrapper): void {
        const rtWrapper = texture as WebGPURenderTargetWrapper;

        if (!rtWrapper.isMulti) {
            return;
        }

        const attachments = rtWrapper._attachments!;
        const count = attachments.length;

        for (let i = 0; i < count; i++) {
            const texture = rtWrapper.textures![i];
            if (texture.generateMipMaps && !texture.isCube && !texture.is3D) {
                this._generateMipmaps(texture);
            }
        }
    };

    WebGPUEngine.prototype.resolveMultiFramebuffer = function (texture: RenderTargetWrapper, resolveColors: boolean = true): void {
        this.resolveFramebuffer(texture, resolveColors);
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

    WebGPUEngine.prototype.buildTextureLayout = function (textureStatus: boolean[], backBufferLayout = false): number[] {
        const result = [];

        if (backBufferLayout) {
            result.push(1);
        } else {
            for (let i = 0; i < textureStatus.length; i++) {
                if (textureStatus[i]) {
                    result.push(i + 1);
                } else {
                    result.push(0);
                }
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
}
