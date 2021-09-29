import { InternalTexture, InternalTextureSource } from "../../Materials/Textures/internalTexture";
import { Logger } from "../../Misc/logger";
import { RenderTargetCreationOptions, DepthTextureCreationOptions } from "../../Materials/Textures/textureCreationOptions";
import { ThinEngine } from "../thinEngine";
import { Nullable } from "../../types";
import { RenderTargetWrapper } from "../renderTargetWrapper";
import { WebGLRenderTargetWrapper } from "../WebGL/webGLRenderTargetWrapper";
import { WebGLHardwareTexture } from "../WebGL/webGLHardwareTexture";
import { TextureSize } from "../../Materials/Textures/textureCreationOptions";

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

        /** @hidden */
        _createDepthStencilTexture(size: TextureSize, options: DepthTextureCreationOptions, rtWrapper: RenderTargetWrapper): InternalTexture;

        /** @hidden */
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

    const fullOptions = new RenderTargetCreationOptions();
    if (options !== undefined && typeof options === "object") {
        fullOptions.generateDepthBuffer = !!options.generateDepthBuffer;
        fullOptions.generateStencilBuffer = !!options.generateStencilBuffer;
    } else {
        fullOptions.generateDepthBuffer = true;
        fullOptions.generateStencilBuffer = false;
    }

    const texture = this._createInternalTexture(size, options);
    const width = (<{ width: number; height: number; layers?: number }>size).width || <number>size;
    const height = (<{ width: number; height: number; layers?: number }>size).height || <number>size;

    const currentFrameBuffer = this._currentFramebuffer;
    const gl = this._gl;

    // Create the framebuffer
    const framebuffer = gl.createFramebuffer();
    this._bindUnboundFramebuffer(framebuffer);
    rtWrapper._depthStencilBuffer = this._setupFramebufferDepthAttachments(fullOptions.generateStencilBuffer ? true : false, fullOptions.generateDepthBuffer, width, height);

    // No need to rebind on every frame
    if (!texture.is2DArray) {
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
        let width = (<{ width: number; height: number }>size).width || <number>size;
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

    rtWrapper._depthStencilTexture = internalTexture;
    rtWrapper._depthStencilTextureWithStencil = internalOptions.generateStencil;

    const type = internalOptions.generateStencil ? gl.UNSIGNED_INT_24_8 : gl.UNSIGNED_INT;
    const internalFormat = internalOptions.generateStencil ? gl.DEPTH_STENCIL : gl.DEPTH_COMPONENT;
    let sizedFormat = internalFormat;
    if (this.webGLVersion > 1) {
        sizedFormat = internalOptions.generateStencil ? gl.DEPTH24_STENCIL8 : gl.DEPTH_COMPONENT24;
    }

    if (internalTexture.is2DArray) {
        gl.texImage3D(target, 0, sizedFormat, internalTexture.width, internalTexture.height, layers, 0, internalFormat, type, null);
    } else {
        gl.texImage2D(target, 0, sizedFormat, internalTexture.width, internalTexture.height, 0, internalFormat, type, null);
    }

    this._bindTextureDirectly(target, null);

    this._internalTexturesCache.push(internalTexture);

    return internalTexture;
};

ThinEngine.prototype.updateRenderTargetTextureSampleCount = function (rtWrapper: Nullable<WebGLRenderTargetWrapper>, samples: number): number {
    if (this.webGLVersion < 2 || !rtWrapper || !rtWrapper.texture) {
        return 1;
    }

    if (rtWrapper.samples === samples) {
        return samples;
    }

    var gl = this._gl;

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
        let framebuffer = gl.createFramebuffer();

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
