import { InternalTexture, InternalTextureSource } from "../../Materials/Textures/internalTexture";
import { Logger } from "../../Misc/logger";
import type { RenderTargetCreationOptions, DepthTextureCreationOptions, TextureSize } from "../../Materials/Textures/textureCreationOptions";
import { ThinEngine } from "../thinEngine";
import type { Nullable } from "../../types";
import type { RenderTargetWrapper } from "../renderTargetWrapper";
import { WebGLRenderTargetWrapper } from "../WebGL/webGLRenderTargetWrapper";
import type { WebGLHardwareTexture } from "../WebGL/webGLHardwareTexture";

import { Constants } from "../constants";

import "../AbstractEngine/abstractEngine.texture";

/**
 * Type used to define a texture size (either with a number or with a rect width and height)
 * @deprecated please use TextureSize instead
 */
export type RenderTargetTextureSize = TextureSize;

declare module "../../Engines/abstractEngine" {
    export interface AbstractEngine {
        /**
         * Creates a new render target texture
         * @param size defines the size of the texture
         * @param options defines the options used to create the texture
         * @returns a new render target wrapper ready to render texture
         */
        createRenderTargetTexture(size: TextureSize, options: boolean | RenderTargetCreationOptions): RenderTargetWrapper;

        /**
         * Updates the sample count of a render target texture
         * @see https://doc.babylonjs.com/setup/support/webGL2#multisample-render-targets
         * @param rtWrapper defines the render target wrapper to update
         * @param samples defines the sample count to set
         * @returns the effective sample count (could be 0 if multisample render targets are not supported)
         */
        updateRenderTargetTextureSampleCount(rtWrapper: Nullable<RenderTargetWrapper>, samples: number): number;

        /** @internal */
        _createDepthStencilTexture(size: TextureSize, options: DepthTextureCreationOptions, rtWrapper: RenderTargetWrapper): InternalTexture;

        /** @internal */
        _createHardwareRenderTargetWrapper(isMulti: boolean, isCube: boolean, size: TextureSize): RenderTargetWrapper;

        /** @internal */
        _setupDepthStencilTexture(internalTexture: InternalTexture, size: TextureSize, bilinearFiltering: boolean, comparisonFunction: number, samples?: number): void;
    }
}

ThinEngine.prototype._createHardwareRenderTargetWrapper = function (isMulti: boolean, isCube: boolean, size: TextureSize): RenderTargetWrapper {
    const rtWrapper = new WebGLRenderTargetWrapper(isMulti, isCube, size, this, this._gl);
    this._renderTargetWrapperCache.push(rtWrapper);
    return rtWrapper;
};

ThinEngine.prototype.createRenderTargetTexture = function (this: ThinEngine, size: TextureSize, options: boolean | RenderTargetCreationOptions): RenderTargetWrapper {
    const rtWrapper = this._createHardwareRenderTargetWrapper(false, false, size) as WebGLRenderTargetWrapper;

    let generateDepthBuffer = true;
    let generateStencilBuffer = false;
    let noColorAttachment = false;
    let colorAttachment: InternalTexture | undefined = undefined;
    let samples = 1;
    let label: string | undefined = undefined;
    if (options !== undefined && typeof options === "object") {
        generateDepthBuffer = options.generateDepthBuffer ?? true;
        generateStencilBuffer = !!options.generateStencilBuffer;
        noColorAttachment = !!options.noColorAttachment;
        colorAttachment = options.colorAttachment;
        samples = options.samples ?? 1;
        label = options.label;
    }

    const texture = colorAttachment || (noColorAttachment ? null : this._createInternalTexture(size, options, true, InternalTextureSource.RenderTarget));
    const width = (<{ width: number; height: number; layers?: number }>size).width || <number>size;
    const height = (<{ width: number; height: number; layers?: number }>size).height || <number>size;

    const currentFrameBuffer = this._currentFramebuffer;
    const gl = this._gl;

    // Create the framebuffer
    const framebuffer = gl.createFramebuffer();
    this._bindUnboundFramebuffer(framebuffer);
    rtWrapper._depthStencilBuffer = this._setupFramebufferDepthAttachments(generateStencilBuffer, generateDepthBuffer, width, height);

    // No need to rebind on every frame
    if (texture && !texture.is2DArray && !texture.is3D) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture._hardwareTexture!.underlyingResource, 0);
    }

    this._bindUnboundFramebuffer(currentFrameBuffer);

    rtWrapper.label = label ?? "RenderTargetWrapper";
    rtWrapper._framebuffer = framebuffer;
    rtWrapper._generateDepthBuffer = generateDepthBuffer;
    rtWrapper._generateStencilBuffer = generateStencilBuffer;

    rtWrapper.setTextures(texture);

    this.updateRenderTargetTextureSampleCount(rtWrapper, samples);

    return rtWrapper;
};

ThinEngine.prototype._createDepthStencilTexture = function (size: TextureSize, options: DepthTextureCreationOptions, rtWrapper: WebGLRenderTargetWrapper): InternalTexture {
    const gl = this._gl;
    const layers = (<{ width: number; height: number; depth?: number; layers?: number }>size).layers || 0;
    const depth = (<{ width: number; height: number; depth?: number; layers?: number }>size).depth || 0;
    let target: number = gl.TEXTURE_2D;
    if (layers !== 0) {
        target = gl.TEXTURE_2D_ARRAY;
    } else if (depth !== 0) {
        target = gl.TEXTURE_3D;
    }
    const internalTexture = new InternalTexture(this, InternalTextureSource.DepthStencil);
    internalTexture.label = options.label;
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
            Logger.Error(`Depth texture ${internalOptions.depthTextureFormat} format is not supported.`);
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
    const internalFormat = this._getInternalFormatFromDepthTextureFormat(internalTexture.format, true, hasStencil);

    if (internalTexture.is2DArray) {
        gl.texImage3D(target, 0, internalFormat, internalTexture.width, internalTexture.height, layers, 0, format, type, null);
    } else if (internalTexture.is3D) {
        gl.texImage3D(target, 0, internalFormat, internalTexture.width, internalTexture.height, depth, 0, format, type, null);
    } else {
        gl.texImage2D(target, 0, internalFormat, internalTexture.width, internalTexture.height, 0, format, type, null);
    }

    this._bindTextureDirectly(target, null);

    this._internalTexturesCache.push(internalTexture);

    if (rtWrapper._depthStencilBuffer) {
        gl.deleteRenderbuffer(rtWrapper._depthStencilBuffer);
        rtWrapper._depthStencilBuffer = null;
    }

    this._bindUnboundFramebuffer(rtWrapper._MSAAFramebuffer ?? rtWrapper._framebuffer);

    rtWrapper._generateStencilBuffer = hasStencil;
    rtWrapper._depthStencilTextureWithStencil = hasStencil;

    rtWrapper._depthStencilBuffer = this._setupFramebufferDepthAttachments(
        rtWrapper._generateStencilBuffer,
        rtWrapper._generateDepthBuffer,
        rtWrapper.width,
        rtWrapper.height,
        rtWrapper.samples,
        internalTexture.format
    );

    this._bindUnboundFramebuffer(null);

    return internalTexture;
};

ThinEngine.prototype.updateRenderTargetTextureSampleCount = function (rtWrapper: Nullable<WebGLRenderTargetWrapper>, samples: number): number {
    if (this.webGLVersion < 2 || !rtWrapper) {
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

    const hardwareTexture = rtWrapper.texture?._hardwareTexture as Nullable<WebGLHardwareTexture>;
    hardwareTexture?.releaseMSAARenderBuffers();

    const framebuffer = gl.createFramebuffer();

    if (!framebuffer) {
        throw new Error("Unable to create multi sampled framebuffer");
    }

    rtWrapper._MSAAFramebuffer = framebuffer;

    if (rtWrapper.texture && samples > 1 && typeof gl.renderbufferStorageMultisample === "function") {
        this._bindUnboundFramebuffer(rtWrapper._MSAAFramebuffer);

        const colorRenderbuffer = this._createRenderBuffer(
            rtWrapper.texture.width,
            rtWrapper.texture.height,
            samples,
            -1 /* not used */,
            this._getRGBABufferInternalSizedFormat(rtWrapper.texture.type, rtWrapper.texture.format, rtWrapper.texture._useSRGBBuffer),
            gl.COLOR_ATTACHMENT0,
            false
        );

        if (!colorRenderbuffer) {
            throw new Error("Unable to create multi sampled framebuffer");
        }

        hardwareTexture?.addMSAARenderBuffer(colorRenderbuffer);
    }

    this._bindUnboundFramebuffer(rtWrapper._MSAAFramebuffer ?? rtWrapper._framebuffer);

    if (rtWrapper.texture) {
        rtWrapper.texture.samples = samples;
    }

    rtWrapper._samples = samples;

    const depthFormat = rtWrapper._depthStencilTexture ? rtWrapper._depthStencilTexture.format : undefined;

    rtWrapper._depthStencilBuffer = this._setupFramebufferDepthAttachments(
        rtWrapper._generateStencilBuffer,
        rtWrapper._generateDepthBuffer,
        rtWrapper.width,
        rtWrapper.height,
        samples,
        depthFormat
    );

    this._bindUnboundFramebuffer(null);

    return samples;
};

ThinEngine.prototype._setupDepthStencilTexture = function (
    internalTexture: InternalTexture,
    size: TextureSize,
    bilinearFiltering: boolean,
    comparisonFunction: number,
    samples = 1
) {
    const width = (<{ width: number; height: number; layers?: number }>size).width || <number>size;
    const height = (<{ width: number; height: number; layers?: number }>size).height || <number>size;
    const layers = (<{ width: number; height: number; depth?: number; layers?: number }>size).layers || 0;
    const depth = (<{ width: number; height: number; depth?: number; layers?: number }>size).depth || 0;

    internalTexture.baseWidth = width;
    internalTexture.baseHeight = height;
    internalTexture.width = width;
    internalTexture.height = height;
    internalTexture.is2DArray = layers > 0;
    internalTexture.depth = layers || depth;
    internalTexture.isReady = true;
    internalTexture.samples = samples;
    internalTexture.generateMipMaps = false;
    internalTexture.samplingMode = bilinearFiltering ? Constants.TEXTURE_BILINEAR_SAMPLINGMODE : Constants.TEXTURE_NEAREST_SAMPLINGMODE;
    internalTexture.type = Constants.TEXTURETYPE_UNSIGNED_INT;
    internalTexture._comparisonFunction = comparisonFunction;

    const gl = this._gl;
    const target = this._getTextureTarget(internalTexture);
    const samplingParameters = this._getSamplingParameters(internalTexture.samplingMode, false);
    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, samplingParameters.mag);
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, samplingParameters.min);
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // TEXTURE_COMPARE_FUNC/MODE are only availble in WebGL2.
    if (this.webGLVersion > 1) {
        if (comparisonFunction === 0) {
            gl.texParameteri(target, gl.TEXTURE_COMPARE_FUNC, Constants.LEQUAL);
            gl.texParameteri(target, gl.TEXTURE_COMPARE_MODE, gl.NONE);
        } else {
            gl.texParameteri(target, gl.TEXTURE_COMPARE_FUNC, comparisonFunction);
            gl.texParameteri(target, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
        }
    }
};
