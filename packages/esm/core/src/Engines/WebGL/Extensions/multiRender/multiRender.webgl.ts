import type { WebGLRenderTargetWrapper } from "@babylonjs/core/Engines/WebGL/webGLRenderTargetWrapper.js";
import {
    _bindTextureDirectly,
    _bindUnboundFramebuffer,
    _createRenderBuffer,
    _getInternalFormat,
    _getRGBABufferInternalSizedFormat,
    _getRGBAMultiSampleBufferFormat,
    _getSamplingParameters,
    _getWebGLTextureType,
    _setupFramebufferDepthAttachments,
    type IWebGLEnginePublic,
    type WebGLEngineState,
} from "../../engine.webgl.js";
import type { WebGLHardwareTexture } from "@babylonjs/core/Engines/WebGL/webGLHardwareTexture.js";
import type { RenderTargetWrapper } from "@babylonjs/core/Engines/renderTargetWrapper.js";
import { InternalTexture, InternalTextureSource } from "@babylonjs/core/Materials/Textures/internalTexture.js";
import type { IMultiRenderTargetOptions } from "@babylonjs/core/Materials/Textures/multiRenderTarget.js";
import type { TextureSize } from "@babylonjs/core/Materials/Textures/textureCreationOptions.js";
import type { Nullable } from "@babylonjs/core/types.js";
import { _createHardwareRenderTargetWrapper } from "../renderTarget/renderTarget.webgl.js";
import { Logger } from "@babylonjs/core/Misc/logger.js";
import type { IMultiRenderEngineExtension } from "../../../Extensions/multiRender/multiRender.base.js";
import { augmentEngineState } from "../../../engine.adapters.js";
import { resetTextureCache } from "../../../engine.base.js";
import { Constants } from "../../../engine.constants.js";

export const restoreSingleAttachment: IMultiRenderEngineExtension["restoreSingleAttachment"] = function (engineState: IWebGLEnginePublic): void {
    const fes = engineState as WebGLEngineState;
    const gl = fes._gl;

    bindAttachments(fes, [gl.BACK]);
};

export const restoreSingleAttachmentForRenderTarget: IMultiRenderEngineExtension["restoreSingleAttachmentForRenderTarget"] = function (engineState: IWebGLEnginePublic): void {
    const fes = engineState as WebGLEngineState;
    const gl = fes._gl;

    bindAttachments(fes, [gl.COLOR_ATTACHMENT0]);
};

export const buildTextureLayout: IMultiRenderEngineExtension["buildTextureLayout"] = function (engineState: IWebGLEnginePublic, textureStatus: boolean[]): number[] {
    const fes = engineState as WebGLEngineState;
    const gl = fes._gl;

    const result = [];

    for (let i = 0; i < textureStatus.length; i++) {
        if (textureStatus[i]) {
            result.push((<any>gl)["COLOR_ATTACHMENT" + i]);
        } else {
            result.push(gl.NONE);
        }
    }

    return result;
};

export const bindAttachments: IMultiRenderEngineExtension["bindAttachments"] = function (engineState: IWebGLEnginePublic, attachments: number[]): void {
    const gl = (engineState as WebGLEngineState)._gl;

    gl.drawBuffers(attachments);
};

export const unBindMultiColorAttachmentFramebuffer: IMultiRenderEngineExtension["unBindMultiColorAttachmentFramebuffer"] = function (
    engineState: IWebGLEnginePublic,
    rtWrapper: WebGLRenderTargetWrapper,
    disableGenerateMipMaps: boolean = false,
    onBeforeUnbind?: () => void
): void {
    const fes = engineState as WebGLEngineState;
    fes._currentRenderTarget = null;

    // If MSAA, we need to bitblt back to main texture
    const gl = fes._gl;

    const attachments = rtWrapper._attachments!;
    const count = attachments.length;

    if (rtWrapper._MSAAFramebuffer) {
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, rtWrapper._MSAAFramebuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, rtWrapper._framebuffer);

        for (let i = 0; i < count; i++) {
            const texture = rtWrapper.textures![i];

            for (let j = 0; j < count; j++) {
                attachments[j] = gl.NONE;
            }

            attachments[i] = (<any>gl)[fes.webGLVersion > 1 ? "COLOR_ATTACHMENT" + i : "COLOR_ATTACHMENT" + i + "_WEBGL"];
            gl.readBuffer(attachments[i]);
            gl.drawBuffers(attachments);
            gl.blitFramebuffer(0, 0, texture.width, texture.height, 0, 0, texture.width, texture.height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
        }

        for (let i = 0; i < count; i++) {
            attachments[i] = (<any>gl)[fes.webGLVersion > 1 ? "COLOR_ATTACHMENT" + i : "COLOR_ATTACHMENT" + i + "_WEBGL"];
        }

        gl.drawBuffers(attachments);
    }

    for (let i = 0; i < count; i++) {
        const texture = rtWrapper.textures![i];
        if (texture?.generateMipMaps && !disableGenerateMipMaps && !texture.isCube) {
            _bindTextureDirectly(fes, gl.TEXTURE_2D, texture, true);
            gl.generateMipmap(gl.TEXTURE_2D);
            _bindTextureDirectly(fes, gl.TEXTURE_2D, null);
        }
    }

    if (onBeforeUnbind) {
        if (rtWrapper._MSAAFramebuffer) {
            // Bind the correct framebuffer
            _bindUnboundFramebuffer(fes, rtWrapper._framebuffer);
        }
        onBeforeUnbind();
    }

    _bindUnboundFramebuffer(fes, null);
};

export const createMultipleRenderTarget: IMultiRenderEngineExtension["createMultipleRenderTarget"] = function (
    engineState: IWebGLEnginePublic,
    size: TextureSize,
    options: IMultiRenderTargetOptions,
    initializeBuffers: boolean = true
): RenderTargetWrapper {
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

    let types = new Array<number>();
    let samplingModes = new Array<number>();
    let useSRGBBuffers = new Array<boolean>();
    let formats = new Array<number>();
    let targets = new Array<number>();
    let faceIndex = new Array<number>();
    let layerIndex = new Array<number>();
    let layers = new Array<number>();

    // TODO - this is from another extension!
    const rtWrapper = _createHardwareRenderTargetWrapper(engineState, true, false, size) as WebGLRenderTargetWrapper;

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
        if (
            engineState.webGLVersion > 1 &&
            (options.depthTextureFormat === Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 ||
                options.depthTextureFormat === Constants.TEXTUREFORMAT_DEPTH24UNORM_STENCIL8 ||
                options.depthTextureFormat === Constants.TEXTUREFORMAT_DEPTH24 ||
                options.depthTextureFormat === Constants.TEXTUREFORMAT_DEPTH32_FLOAT ||
                options.depthTextureFormat === Constants.TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8)
        ) {
            depthTextureFormat = options.depthTextureFormat;
        }
    }
    const fes = engineState as WebGLEngineState;
    const gl = fes._gl;
    // Create the framebuffer
    const framebuffer = gl.createFramebuffer();
    _bindUnboundFramebuffer(fes, framebuffer);

    const width = (<{ width: number; height: number }>size).width || <number>size;
    const height = (<{ width: number; height: number }>size).height || <number>size;

    const textures: InternalTexture[] = [];
    const attachments: number[] = [];

    const useStencilTexture =
        engineState.webGLVersion > 1 &&
        generateDepthTexture &&
        (options.depthTextureFormat === Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 ||
            options.depthTextureFormat === Constants.TEXTUREFORMAT_DEPTH24UNORM_STENCIL8 ||
            options.depthTextureFormat === Constants.TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8);
    const depthStencilBuffer = _setupFramebufferDepthAttachments(fes, !useStencilTexture && generateStencilBuffer, !generateDepthTexture && generateDepthBuffer, width, height);

    rtWrapper._framebuffer = framebuffer;
    rtWrapper._depthStencilBuffer = depthStencilBuffer;
    rtWrapper._generateDepthBuffer = !generateDepthTexture && generateDepthBuffer;
    rtWrapper._generateStencilBuffer = !useStencilTexture && generateStencilBuffer;
    rtWrapper._attachments = attachments;

    for (let i = 0; i < textureCount; i++) {
        let samplingMode = samplingModes[i] || defaultSamplingMode;
        let type = types[i] || defaultType;
        let useSRGBBuffer = useSRGBBuffers[i] || defaultUseSRGBBuffer;
        const format = formats[i] || defaultFormat;

        const target = targets[i] || defaultTarget;
        const layerCount = layers[i] ?? 1;

        if (type === Constants.TEXTURETYPE_FLOAT && !fes._caps.textureFloatLinearFiltering) {
            // if floating point linear (gl.FLOAT) then force to NEAREST_SAMPLINGMODE
            samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        } else if (type === Constants.TEXTURETYPE_HALF_FLOAT && !fes._caps.textureHalfFloatLinearFiltering) {
            // if floating point linear (HALF_FLOAT) then force to NEAREST_SAMPLINGMODE
            samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        }

        const filters = _getSamplingParameters(fes, samplingMode, generateMipMaps);
        if (type === Constants.TEXTURETYPE_FLOAT && !fes._caps.textureFloat) {
            type = Constants.TEXTURETYPE_UNSIGNED_INT;
            Logger.Warn("Float textures are not supported. Render target forced to TEXTURETYPE_UNSIGNED_BYTE type");
        }

        useSRGBBuffer = useSRGBBuffer && fes._caps.supportSRGBBuffers && fes.webGLVersion > 1;

        const isWebGL2 = fes.webGLVersion > 1;
        const attachment = (<any>gl)[isWebGL2 ? "COLOR_ATTACHMENT" + i : "COLOR_ATTACHMENT" + i + "_WEBGL"];

        attachments.push(attachment);

        if (target === -1) {
            continue;
        }

        const texture = new InternalTexture(augmentEngineState(fes), InternalTextureSource.MultiRenderTarget);
        textures[i] = texture;

        gl.activeTexture((<any>gl)["TEXTURE" + i]);
        gl.bindTexture(target, texture._hardwareTexture!.underlyingResource);

        gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, filters.mag);
        gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, filters.min);
        gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        const internalSizedFormat = _getRGBABufferInternalSizedFormat(fes, type, format, useSRGBBuffer);
        const internalFormat = _getInternalFormat(fes, format);
        const webGLTextureType = _getWebGLTextureType(fes, type);

        if (isWebGL2 && (target === Constants.TEXTURE_2D_ARRAY || target === Constants.TEXTURE_3D)) {
            if (target === Constants.TEXTURE_2D_ARRAY) {
                texture.is2DArray = true;
            } else {
                texture.is3D = true;
            }

            texture.baseDepth = texture.depth = layerCount;

            gl.texImage3D(target, 0, internalSizedFormat, width, height, layerCount, 0, internalFormat, webGLTextureType, null);
        } else if (target === Constants.TEXTURE_CUBE_MAP) {
            // We have to generate all faces to complete the framebuffer
            for (let i = 0; i < 6; i++) {
                gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, internalSizedFormat, width, height, 0, internalFormat, webGLTextureType, null);
            }
            texture.isCube = true;
        } else {
            gl.texImage2D(gl.TEXTURE_2D, 0, internalSizedFormat, width, height, 0, internalFormat, webGLTextureType, null);
        }

        if (generateMipMaps) {
            gl.generateMipmap(target);
        }

        // Unbind
        _bindTextureDirectly(fes, target, null);

        texture.baseWidth = width;
        texture.baseHeight = height;
        texture.width = width;
        texture.height = height;
        texture.isReady = true;
        texture.samples = 1;
        texture.generateMipMaps = generateMipMaps;
        texture.samplingMode = samplingMode;
        texture.type = type;
        texture._useSRGBBuffer = useSRGBBuffer;
        texture.format = format;

        fes._internalTexturesCache.push(texture);
    }

    if (generateDepthTexture && fes._caps.depthTextureExtension) {
        // Depth texture
        const depthTexture = new InternalTexture(augmentEngineState(fes), InternalTextureSource.Depth);

        let depthTextureType = Constants.TEXTURETYPE_UNSIGNED_SHORT;
        let glDepthTextureInternalFormat: GLenum = gl.DEPTH_COMPONENT16;
        let glDepthTextureFormat: GLenum = gl.DEPTH_COMPONENT;
        let glDepthTextureType: GLenum = gl.UNSIGNED_SHORT;
        let glDepthTextureAttachment: GLenum = gl.DEPTH_ATTACHMENT;
        if (fes.webGLVersion < 2) {
            glDepthTextureInternalFormat = gl.DEPTH_COMPONENT;
        } else {
            if (depthTextureFormat === Constants.TEXTUREFORMAT_DEPTH32_FLOAT) {
                depthTextureType = Constants.TEXTURETYPE_FLOAT;
                glDepthTextureType = gl.FLOAT;
                glDepthTextureInternalFormat = gl.DEPTH_COMPONENT32F;
            } else if (depthTextureFormat === Constants.TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8) {
                depthTextureType = Constants.TEXTURETYPE_UNSIGNED_INT;
                glDepthTextureType = gl.FLOAT_32_UNSIGNED_INT_24_8_REV;
                glDepthTextureInternalFormat = gl.DEPTH32F_STENCIL8;
                glDepthTextureFormat = gl.DEPTH_STENCIL;
                glDepthTextureAttachment = gl.DEPTH_STENCIL_ATTACHMENT;
            } else if (depthTextureFormat === Constants.TEXTUREFORMAT_DEPTH24) {
                depthTextureType = Constants.TEXTURETYPE_UNSIGNED_INT;
                glDepthTextureType = gl.UNSIGNED_INT;
                glDepthTextureInternalFormat = gl.DEPTH_COMPONENT24;
                glDepthTextureAttachment = gl.DEPTH_ATTACHMENT;
            } else if (depthTextureFormat === Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 || depthTextureFormat === Constants.TEXTUREFORMAT_DEPTH24UNORM_STENCIL8) {
                depthTextureType = Constants.TEXTURETYPE_UNSIGNED_INT_24_8;
                glDepthTextureType = gl.UNSIGNED_INT_24_8;
                glDepthTextureInternalFormat = gl.DEPTH24_STENCIL8;
                glDepthTextureFormat = gl.DEPTH_STENCIL;
                glDepthTextureAttachment = gl.DEPTH_STENCIL_ATTACHMENT;
            }
        }

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, depthTexture._hardwareTexture!.underlyingResource);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, glDepthTextureInternalFormat, width, height, 0, glDepthTextureFormat, glDepthTextureType, null);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, glDepthTextureAttachment, gl.TEXTURE_2D, depthTexture._hardwareTexture!.underlyingResource, 0);

        depthTexture.baseWidth = width;
        depthTexture.baseHeight = height;
        depthTexture.width = width;
        depthTexture.height = height;
        depthTexture.isReady = true;
        depthTexture.samples = 1;
        depthTexture.generateMipMaps = generateMipMaps;
        depthTexture.samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        depthTexture.format = depthTextureFormat;
        depthTexture.type = depthTextureType;

        textures[textureCount] = depthTexture;
        fes._internalTexturesCache.push(depthTexture);
    }
    rtWrapper.setTextures(textures);
    if (initializeBuffers) {
        gl.drawBuffers(attachments);
    }

    _bindUnboundFramebuffer(fes, null);

    rtWrapper.setLayerAndFaceIndices(layerIndex, faceIndex);

    resetTextureCache(fes);

    return rtWrapper;
};

export const updateMultipleRenderTargetTextureSampleCount: IMultiRenderEngineExtension["updateMultipleRenderTargetTextureSampleCount"] = function (
    engineState: IWebGLEnginePublic,
    rtWrapper: Nullable<WebGLRenderTargetWrapper>,
    samples: number,
    initializeBuffers: boolean = true
): number {
    const fes = engineState as WebGLEngineState;
    if (fes.webGLVersion < 2 || !rtWrapper || !rtWrapper.texture) {
        return 1;
    }

    if (rtWrapper.samples === samples) {
        return samples;
    }

    const count = rtWrapper._attachments!.length;

    if (count === 0) {
        return 1;
    }

    const gl = fes._gl;

    samples = Math.min(samples, fes._caps.maxMSAASamples);

    // Dispose previous render buffers
    const useDepthStencil = !!rtWrapper._depthStencilBuffer;
    if (useDepthStencil) {
        gl.deleteRenderbuffer(rtWrapper._depthStencilBuffer);
        rtWrapper._depthStencilBuffer = null;
    }

    if (rtWrapper._MSAAFramebuffer) {
        gl.deleteFramebuffer(rtWrapper._MSAAFramebuffer);
        rtWrapper._MSAAFramebuffer = null;
    }

    if (samples > 1 && typeof gl.renderbufferStorageMultisample === "function") {
        const framebuffer = gl.createFramebuffer();

        if (!framebuffer) {
            throw new Error("Unable to create multi sampled framebuffer");
        }

        rtWrapper._MSAAFramebuffer = framebuffer;
        _bindUnboundFramebuffer(fes, framebuffer);

        const attachments = [];

        for (let i = 0; i < count; i++) {
            const texture = rtWrapper.textures![i];
            const hardwareTexture = texture._hardwareTexture as WebGLHardwareTexture;

            hardwareTexture.releaseMSAARenderBuffers();
        }

        for (let i = 0; i < count; i++) {
            const texture = rtWrapper.textures![i];
            const hardwareTexture = texture._hardwareTexture as WebGLHardwareTexture;
            const attachment = (<any>gl)[fes.webGLVersion > 1 ? "COLOR_ATTACHMENT" + i : "COLOR_ATTACHMENT" + i + "_WEBGL"];

            const colorRenderbuffer = _createRenderBuffer(
                fes,
                texture.width,
                texture.height,
                samples,
                -1 /* not used */,
                _getRGBAMultiSampleBufferFormat(fes, texture.type, texture.format),
                attachment
            );

            if (!colorRenderbuffer) {
                throw new Error("Unable to create multi sampled framebuffer");
            }

            hardwareTexture.addMSAARenderBuffer(colorRenderbuffer);
            texture.samples = samples;

            attachments.push(attachment);
        }
        if (initializeBuffers) {
            gl.drawBuffers(attachments);
        }
    } else {
        _bindUnboundFramebuffer(fes, rtWrapper._framebuffer);
    }

    if (useDepthStencil) {
        rtWrapper._depthStencilBuffer = _setupFramebufferDepthAttachments(
            fes,
            rtWrapper._generateStencilBuffer,
            rtWrapper._generateDepthBuffer,
            rtWrapper.texture.width,
            rtWrapper.texture.height,
            samples
        );
    }

    _bindUnboundFramebuffer(fes, null);

    return samples;
};

export const multiRenderTargetExtension: IMultiRenderEngineExtension = {
    bindAttachments,
    buildTextureLayout,
    createMultipleRenderTarget,
    restoreSingleAttachment,
    restoreSingleAttachmentForRenderTarget,
    unBindMultiColorAttachmentFramebuffer,
    updateMultipleRenderTargetTextureSampleCount,
};

export default multiRenderTargetExtension;
