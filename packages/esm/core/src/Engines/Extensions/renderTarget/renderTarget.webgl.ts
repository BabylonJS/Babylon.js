import type { WebGLHardwareTexture } from "@babylonjs/core/Engines/WebGL/webGLHardwareTexture.js";
import { WebGLRenderTargetWrapper } from "@babylonjs/core/Engines/WebGL/webGLRenderTargetWrapper.js";
import type { RenderTargetWrapper } from "@babylonjs/core/Engines/renderTargetWrapper.js";
import { InternalTexture, InternalTextureSource } from "@babylonjs/core/Materials/Textures/internalTexture.js";
import type { TextureSize, RenderTargetCreationOptions, DepthTextureCreationOptions } from "@babylonjs/core/Materials/Textures/textureCreationOptions.js";
import type { Nullable } from "@babylonjs/core/types.js";
import { augmentEngineState } from "../../engine.adapters.js";
import type {
    IWebGLEnginePublic,
    WebGLEngineStateFull} from "../../engine.webgl.js";
import {
    _bindTextureDirectly,
    _bindUnboundFramebuffer,
    _createInternalTexture,
    _createRenderBuffer,
    _getRGBAMultiSampleBufferFormat,
    _setupDepthStencilTexture,
    _setupFramebufferDepthAttachments
} from "../../engine.webgl.js";
import { Logger } from "@babylonjs/core/Misc/logger.js";
import type { IRenderTargetEngineExtension } from "./renderTarget.base.js";
import { _createDepthStencilCubeTexture } from "../cubeTexture/cubeTexture.webgl.js";
import { Constants } from "../../engine.constants.js";

export const _createHardwareRenderTargetWrapper: IRenderTargetEngineExtension["_createHardwareRenderTargetWrapper"] = function (
    engineState: IWebGLEnginePublic,
    isMulti: boolean,
    isCube: boolean,
    size: TextureSize
): RenderTargetWrapper {
    const fes = engineState as WebGLEngineStateFull;
    const rtWrapper = new WebGLRenderTargetWrapper(isMulti, isCube, size, augmentEngineState(fes), fes._gl);
    fes._renderTargetWrapperCache.push(rtWrapper);
    return rtWrapper;
};

export const createRenderTargetTexture: IRenderTargetEngineExtension["createRenderTargetTexture"] = function (
    engineState: IWebGLEnginePublic,
    size: TextureSize,
    options: boolean | RenderTargetCreationOptions
): RenderTargetWrapper {
    const fes = engineState as WebGLEngineStateFull;
    const rtWrapper = _createHardwareRenderTargetWrapper(engineState, false, false, size) as WebGLRenderTargetWrapper;

    let generateDepthBuffer = true;
    let generateStencilBuffer = false;
    let noColorAttachment = false;
    let colorAttachment: InternalTexture | undefined = undefined;
    let samples = 1;
    if (options !== undefined && typeof options === "object") {
        generateDepthBuffer = options.generateDepthBuffer ?? true;
        generateStencilBuffer = !!options.generateStencilBuffer;
        noColorAttachment = !!options.noColorAttachment;
        colorAttachment = options.colorAttachment;
        samples = options.samples ?? 1;
    }

    const texture = colorAttachment || (noColorAttachment ? null : _createInternalTexture(fes, size, options, true, InternalTextureSource.RenderTarget));
    const width = (<
            {
                /**
                 *
                 */
                width: number;
                /**
                 *
                 */
                height: number;
                /**
                 *
                 */
                layers?: number;
            }
        >size).width || <number>size;
    const height = (<
            {
                /**
                 *
                 */
                width: number;
                /**
                 *
                 */
                height: number;
                /**
                 *
                 */
                layers?: number;
            }
        >size).height || <number>size;

    const currentFrameBuffer = fes._currentFramebuffer;
    const gl = fes._gl;

    // Create the framebuffer
    const framebuffer = gl.createFramebuffer();
    _bindUnboundFramebuffer(fes, framebuffer);
    rtWrapper._depthStencilBuffer = _setupFramebufferDepthAttachments(fes, generateStencilBuffer, generateDepthBuffer, width, height);

    // No need to rebind on every frame
    if (texture && !texture.is2DArray) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture._hardwareTexture!.underlyingResource, 0);
    }

    _bindUnboundFramebuffer(fes, currentFrameBuffer);

    rtWrapper._framebuffer = framebuffer;
    rtWrapper._generateDepthBuffer = generateDepthBuffer;
    rtWrapper._generateStencilBuffer = generateStencilBuffer;

    rtWrapper.setTextures(texture);

    updateRenderTargetTextureSampleCount(fes, rtWrapper, samples);

    return rtWrapper;
};

export const createDepthStencilTexture: IRenderTargetEngineExtension["createDepthStencilTexture"] = function (
    engineState: IWebGLEnginePublic,
    size: TextureSize,
    options: DepthTextureCreationOptions,
    rtWrapper: RenderTargetWrapper
): InternalTexture {
    if (options.isCube) {
        const width = (<
                {
                    width: number;
                    height: number;
                }
            >size).width || <number>size;
        // TODO this is from another extension
        return _createDepthStencilCubeTexture(engineState, width, options, rtWrapper);
    } else {
        return _createDepthStencilTexture(engineState, size, options, rtWrapper);
    }
};

export const _createDepthStencilTexture: IRenderTargetEngineExtension["_createDepthStencilTexture"] = function (
    engineState: IWebGLEnginePublic,
    size: TextureSize,
    options: DepthTextureCreationOptions,
    rtWrapper: RenderTargetWrapper
): InternalTexture {
    const fes = engineState as WebGLEngineStateFull;
    const gl = fes._gl;
    const layers = (<
            {
                /**
                 *
                 */
                width: number;
                /**
                 *
                 */
                height: number;
                /**
                 *
                 */
                layers?: number;
            }
        >size).layers || 0;
    const target = layers !== 0 ? gl.TEXTURE_2D_ARRAY : gl.TEXTURE_2D;
    const internalTexture = new InternalTexture(augmentEngineState(fes), InternalTextureSource.DepthStencil);
    if (!fes._caps.depthTextureExtension) {
        Logger.Error("Depth texture is not supported by your browser or hardware.");
        return internalTexture;
    }

    const internalOptions = {
        bilinearFiltering: false,
        comparisonFunction: 0,
        generateStencil: false,
        ...options,
    };

    _bindTextureDirectly(fes, target, internalTexture, true);

    _setupDepthStencilTexture(
        fes,
        internalTexture,
        size,
        internalOptions.generateStencil,
        internalOptions.comparisonFunction === 0 ? false : internalOptions.bilinearFiltering,
        internalOptions.comparisonFunction,
        internalOptions.samples
    );

    if (internalOptions.depthTextureFormat !== undefined) {
        if (
            internalOptions.depthTextureFormat !== Constants.TEXTUREFORMAT_DEPTH16 &&
            internalOptions.depthTextureFormat !== Constants.TEXTUREFORMAT_DEPTH24 &&
            internalOptions.depthTextureFormat !== Constants.TEXTUREFORMAT_DEPTH24UNORM_STENCIL8 &&
            internalOptions.depthTextureFormat !== Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 &&
            internalOptions.depthTextureFormat !== Constants.TEXTUREFORMAT_DEPTH32_FLOAT &&
            internalOptions.depthTextureFormat !== Constants.TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8
        ) {
            Logger.Error("Depth texture format is not supported.");
            return internalTexture;
        }
        internalTexture.format = internalOptions.depthTextureFormat;
    } else {
        internalTexture.format = internalOptions.generateStencil ? Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 : Constants.TEXTUREFORMAT_DEPTH24;
    }

    const hasStencil =
        internalTexture.format === Constants.TEXTUREFORMAT_DEPTH24UNORM_STENCIL8 ||
        internalTexture.format === Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 ||
        internalTexture.format === Constants.TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8;

    rtWrapper._depthStencilTexture = internalTexture;
    rtWrapper._depthStencilTextureWithStencil = hasStencil;

    let type: GLenum = gl.UNSIGNED_INT;
    if (internalTexture.format === Constants.TEXTUREFORMAT_DEPTH16) {
        type = gl.UNSIGNED_SHORT;
    } else if (internalTexture.format === Constants.TEXTUREFORMAT_DEPTH24UNORM_STENCIL8 || internalTexture.format === Constants.TEXTUREFORMAT_DEPTH24_STENCIL8) {
        type = gl.UNSIGNED_INT_24_8;
    } else if (internalTexture.format === Constants.TEXTUREFORMAT_DEPTH32_FLOAT) {
        type = gl.FLOAT;
    } else if (internalTexture.format === Constants.TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8) {
        type = gl.FLOAT_32_UNSIGNED_INT_24_8_REV;
    }

    const format: GLenum = hasStencil ? gl.DEPTH_STENCIL : gl.DEPTH_COMPONENT;
    let internalFormat = format;
    if (fes.webGLVersion > 1) {
        if (internalTexture.format === Constants.TEXTUREFORMAT_DEPTH16) {
            internalFormat = gl.DEPTH_COMPONENT16;
        } else if (internalTexture.format === Constants.TEXTUREFORMAT_DEPTH24) {
            internalFormat = gl.DEPTH_COMPONENT24;
        } else if (internalTexture.format === Constants.TEXTUREFORMAT_DEPTH24UNORM_STENCIL8 || internalTexture.format === Constants.TEXTUREFORMAT_DEPTH24_STENCIL8) {
            internalFormat = gl.DEPTH24_STENCIL8;
        } else if (internalTexture.format === Constants.TEXTUREFORMAT_DEPTH32_FLOAT) {
            internalFormat = gl.DEPTH_COMPONENT32F;
        } else if (internalTexture.format === Constants.TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8) {
            internalFormat = gl.DEPTH32F_STENCIL8;
        }
    }

    if (internalTexture.is2DArray) {
        gl.texImage3D(target, 0, internalFormat, internalTexture.width, internalTexture.height, layers, 0, format, type, null);
    } else {
        gl.texImage2D(target, 0, internalFormat, internalTexture.width, internalTexture.height, 0, format, type, null);
    }

    _bindTextureDirectly(fes, target, null);

    fes._internalTexturesCache.push(internalTexture);

    // Dispose previous depth/stencil render buffers and clear the corresponding attachment.
    // Next time this framebuffer is bound, the new depth/stencil texture will be attached.
    const glRtWrapper = <WebGLRenderTargetWrapper>(rtWrapper as any);
    if (glRtWrapper._depthStencilBuffer) {
        const currentFrameBuffer = fes._currentFramebuffer;
        _bindUnboundFramebuffer(fes, glRtWrapper._framebuffer);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, null);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, null);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT, gl.RENDERBUFFER, null);
        _bindUnboundFramebuffer(fes, currentFrameBuffer);

        gl.deleteRenderbuffer(glRtWrapper._depthStencilBuffer);
        glRtWrapper._depthStencilBuffer = null;
    }

    return internalTexture;
};

export const updateRenderTargetTextureSampleCount: IRenderTargetEngineExtension["updateRenderTargetTextureSampleCount"] = function (
    engineState: IWebGLEnginePublic,
    rtWrapper: Nullable<WebGLRenderTargetWrapper>,
    samples: number
): number {
    const fes = engineState as WebGLEngineStateFull;
    if (fes.webGLVersion < 2 || !rtWrapper || !rtWrapper.texture) {
        return 1;
    }

    if (rtWrapper.samples === samples) {
        return samples;
    }

    const gl = fes._gl;

    samples = Math.min(samples, fes._caps.maxMSAASamples);

    // Dispose previous render buffers
    if (rtWrapper._depthStencilBuffer) {
        gl.deleteRenderbuffer(rtWrapper._depthStencilBuffer);
        rtWrapper._depthStencilBuffer = null;
    }

    if (rtWrapper._MSAAFramebuffer) {
        gl.deleteFramebuffer(rtWrapper._MSAAFramebuffer);
        rtWrapper._MSAAFramebuffer = null;
    }

    const hardwareTexture = rtWrapper.texture._hardwareTexture as WebGLHardwareTexture;
    hardwareTexture.releaseMSAARenderBuffers();

    if (samples > 1 && typeof gl.renderbufferStorageMultisample === "function") {
        const framebuffer = gl.createFramebuffer();

        if (!framebuffer) {
            throw new Error("Unable to create multi sampled framebuffer");
        }

        rtWrapper._MSAAFramebuffer = framebuffer;
        _bindUnboundFramebuffer(fes, rtWrapper._MSAAFramebuffer);

        const colorRenderbuffer = _createRenderBuffer(
            fes,
            rtWrapper.texture.width,
            rtWrapper.texture.height,
            samples,
            -1 /* not used */,
            _getRGBAMultiSampleBufferFormat(fes, rtWrapper.texture.type),
            gl.COLOR_ATTACHMENT0,
            false
        );

        if (!colorRenderbuffer) {
            throw new Error("Unable to create multi sampled framebuffer");
        }

        hardwareTexture.addMSAARenderBuffer(colorRenderbuffer);
    } else {
        _bindUnboundFramebuffer(fes, rtWrapper._framebuffer);
    }

    rtWrapper.texture.samples = samples;
    rtWrapper._samples = samples;
    rtWrapper._depthStencilBuffer = _setupFramebufferDepthAttachments(
        fes,
        rtWrapper._generateStencilBuffer,
        rtWrapper._generateDepthBuffer,
        rtWrapper.texture.width,
        rtWrapper.texture.height,
        samples
    );

    _bindUnboundFramebuffer(fes, null);

    return samples;
};

export const renderTargetWebGLExtensions: IRenderTargetEngineExtension = {
    createRenderTargetTexture,
    createDepthStencilTexture,
    updateRenderTargetTextureSampleCount,
    _createHardwareRenderTargetWrapper,
    _createDepthStencilTexture,
};

export default renderTargetWebGLExtensions;
