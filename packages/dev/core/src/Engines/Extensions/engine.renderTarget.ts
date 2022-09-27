import { InternalTexture, InternalTextureSource } from "../../Materials/Textures/internalTexture";
import { Logger } from "../../Misc/logger";
import type { RenderTargetCreationOptions, DepthTextureCreationOptions, TextureSize } from "../../Materials/Textures/textureCreationOptions";
import { ThinEngine } from "../thinEngine";
import type { Nullable } from "../../types";
import type { RenderTargetWrapper } from "../renderTargetWrapper";
import { WebGLRenderTargetWrapper } from "../WebGL/webGLRenderTargetWrapper";
import type { WebGLHardwareTexture } from "../WebGL/webGLHardwareTexture";

import { Constants } from "../constants";

/**
 * Type used to define a texture size (either with a number or with a rect width and height)
 * @deprecated please use TextureSize instead
 */
export type RenderTargetTextureSize = TextureSize;

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
        /**
         * Creates a new render target texture
         * @param size defines the size of the texture
         * @param options defines the options used to create the texture
         * @returns a new render target wrapper ready to render texture
         */
        createRenderTargetTexture(size: TextureSize, options: boolean | RenderTargetCreationOptions): RenderTargetWrapper;

        /**
         * Creates a depth stencil texture.
         * This is only available in WebGL 2 or with the depth texture extension available.
         * @param size The size of face edge in the texture.
         * @param options The options defining the texture.
         * @param rtWrapper The render target wrapper for which the depth/stencil texture must be created
         * @returns The texture
         */
        createDepthStencilTexture(size: TextureSize, options: DepthTextureCreationOptions, rtWrapper: RenderTargetWrapper): InternalTexture;

        /**
         * Updates the sample count of a render target texture
         * @see https://doc.babylonjs.com/features/webgl2#multisample-render-targets
         * @param rtWrapper defines the render target wrapper to update
         * @param samples defines the sample count to set
         * @returns the effective sample count (could be 0 if multisample render targets are not supported)
         */
        updateRenderTargetTextureSampleCount(rtWrapper: Nullable<RenderTargetWrapper>, samples: number): number;

        /** @internal */
        _createDepthStencilTexture(size: TextureSize, options: DepthTextureCreationOptions, rtWrapper: RenderTargetWrapper): InternalTexture;

        /** @internal */
        _createHardwareRenderTargetWrapper(isMulti: boolean, isCube: boolean, size: TextureSize): RenderTargetWrapper;
    }
}

ThinEngine.prototype._createHardwareRenderTargetWrapper = function (isMulti: boolean, isCube: boolean, size: TextureSize): RenderTargetWrapper {
    const rtWrapper = new WebGLRenderTargetWrapper(isMulti, isCube, size, this, this._gl);
    this._renderTargetWrapperCache.push(rtWrapper);
    return rtWrapper;
};

ThinEngine.prototype.createRenderTargetTexture = function (this: ThinEngine, size: TextureSize, options: boolean | RenderTargetCreationOptions): RenderTargetWrapper {
    const rtWrapper = this._createHardwareRenderTargetWrapper(false, false, size) as WebGLRenderTargetWrapper;

    const fullOptions: RenderTargetCreationOptions = {};
    if (options !== undefined && typeof options === "object") {
        fullOptions.generateDepthBuffer = !!options.generateDepthBuffer;
        fullOptions.generateStencilBuffer = !!options.generateStencilBuffer;
        fullOptions.noColorTarget = !!options.noColorTarget;
    } else {
        fullOptions.generateDepthBuffer = true;
        fullOptions.generateStencilBuffer = false;
        fullOptions.noColorTarget = false;
    }

    const texture = fullOptions.noColorTarget ? null : this._createInternalTexture(size, options, true, InternalTextureSource.RenderTarget);
    const width = (<{ width: number; height: number; layers?: number }>size).width || <number>size;
    const height = (<{ width: number; height: number; layers?: number }>size).height || <number>size;

    const currentFrameBuffer = this._currentFramebuffer;
    const gl = this._gl;

    // Create the framebuffer
    const framebuffer = gl.createFramebuffer();
    this._bindUnboundFramebuffer(framebuffer);
    rtWrapper._depthStencilBuffer = this._setupFramebufferDepthAttachments(fullOptions.generateStencilBuffer ? true : false, fullOptions.generateDepthBuffer, width, height);

    // No need to rebind on every frame
    if (texture && !texture.is2DArray) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture._hardwareTexture!.underlyingResource, 0);
    }

    this._bindUnboundFramebuffer(currentFrameBuffer);

    rtWrapper._framebuffer = framebuffer;
    rtWrapper._generateDepthBuffer = fullOptions.generateDepthBuffer;
    rtWrapper._generateStencilBuffer = fullOptions.generateStencilBuffer ? true : false;

    rtWrapper.setTextures(texture);

    return rtWrapper;
};

ThinEngine.prototype.createDepthStencilTexture = function (size: TextureSize, options: DepthTextureCreationOptions, rtWrapper: RenderTargetWrapper): InternalTexture {
    if (options.isCube) {
        const width = (<{ width: number; height: number }>size).width || <number>size;
        return this._createDepthStencilCubeTexture(width, options, rtWrapper);
    } else {
        return this._createDepthStencilTexture(size, options, rtWrapper);
    }
};

ThinEngine.prototype._createDepthStencilTexture = function (size: TextureSize, options: DepthTextureCreationOptions, rtWrapper: RenderTargetWrapper): InternalTexture {
    const gl = this._gl;
    const layers = (<{ width: number; height: number; layers?: number }>size).layers || 0;
    const target = layers !== 0 ? gl.TEXTURE_2D_ARRAY : gl.TEXTURE_2D;
    const internalTexture = new InternalTexture(this, InternalTextureSource.DepthStencil);
    if (!this._caps.depthTextureExtension) {
        Logger.Error("Depth texture is not supported by your browser or hardware.");
        return internalTexture;
    }

    const internalOptions = {
        bilinearFiltering: false,
        comparisonFunction: 0,
        generateStencil: false,
        ...options,
    };

    this._bindTextureDirectly(target, internalTexture, true);

    this._setupDepthStencilTexture(
        internalTexture,
        size,
        internalOptions.generateStencil,
        internalOptions.comparisonFunction === 0 ? false : internalOptions.bilinearFiltering,
        internalOptions.comparisonFunction
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

    let type = gl.UNSIGNED_INT;
    if (internalTexture.format === Constants.TEXTUREFORMAT_DEPTH16) {
        type = gl.UNSIGNED_SHORT;
    } else if (internalTexture.format === Constants.TEXTUREFORMAT_DEPTH24UNORM_STENCIL8 || internalTexture.format === Constants.TEXTUREFORMAT_DEPTH24_STENCIL8) {
        type = gl.UNSIGNED_INT_24_8;
    } else if (internalTexture.format === Constants.TEXTUREFORMAT_DEPTH32_FLOAT) {
        type = gl.FLOAT;
    } else if (internalTexture.format === Constants.TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8) {
        type = gl.FLOAT_32_UNSIGNED_INT_24_8_REV;
    }

    const format = hasStencil ? gl.DEPTH_STENCIL : gl.DEPTH_COMPONENT;
    let internalFormat = format;
    if (this.webGLVersion > 1) {
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

    this._bindTextureDirectly(target, null);

    this._internalTexturesCache.push(internalTexture);

    // Dispose previous depth/stencil render buffers and clear the corresponding attachment.
    // Next time this framebuffer is bound, the new depth/stencil texture will be attached.
    const glRtWrapper = <WebGLRenderTargetWrapper>(rtWrapper as any);
    if (glRtWrapper._depthStencilBuffer) {
        const currentFrameBuffer = this._currentFramebuffer;
        this._bindUnboundFramebuffer(glRtWrapper._framebuffer);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, null);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, null);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT, gl.RENDERBUFFER, null);
        this._bindUnboundFramebuffer(currentFrameBuffer);

        gl.deleteRenderbuffer(glRtWrapper._depthStencilBuffer);
        glRtWrapper._depthStencilBuffer = null;
    }

    return internalTexture;
};

ThinEngine.prototype.updateRenderTargetTextureSampleCount = function (rtWrapper: Nullable<WebGLRenderTargetWrapper>, samples: number): number {
    if (this.webGLVersion < 2 || !rtWrapper || !rtWrapper.texture) {
        return 1;
    }

    if (rtWrapper.samples === samples) {
        return samples;
    }

    const gl = this._gl;

    samples = Math.min(samples, this.getCaps().maxMSAASamples);

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
    if (hardwareTexture._MSAARenderBuffer) {
        gl.deleteRenderbuffer(hardwareTexture._MSAARenderBuffer);
        hardwareTexture._MSAARenderBuffer = null;
    }

    if (samples > 1 && gl.renderbufferStorageMultisample) {
        const framebuffer = gl.createFramebuffer();

        if (!framebuffer) {
            throw new Error("Unable to create multi sampled framebuffer");
        }

        rtWrapper._MSAAFramebuffer = framebuffer;
        this._bindUnboundFramebuffer(rtWrapper._MSAAFramebuffer);

        const colorRenderbuffer = this._createRenderBuffer(
            rtWrapper.texture.width,
            rtWrapper.texture.height,
            samples,
            -1 /* not used */,
            this._getRGBAMultiSampleBufferFormat(rtWrapper.texture.type),
            gl.COLOR_ATTACHMENT0,
            false
        );

        if (!colorRenderbuffer) {
            throw new Error("Unable to create multi sampled framebuffer");
        }

        hardwareTexture._MSAARenderBuffer = colorRenderbuffer;
    } else {
        this._bindUnboundFramebuffer(rtWrapper._framebuffer);
    }

    rtWrapper.texture.samples = samples;
    rtWrapper._depthStencilBuffer = this._setupFramebufferDepthAttachments(
        rtWrapper._generateStencilBuffer,
        rtWrapper._generateDepthBuffer,
        rtWrapper.texture.width,
        rtWrapper.texture.height,
        samples
    );

    this._bindUnboundFramebuffer(null);

    return samples;
};
