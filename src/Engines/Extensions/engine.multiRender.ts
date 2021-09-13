import { InternalTexture, InternalTextureSource } from '../../Materials/Textures/internalTexture';
import { IMultiRenderTargetOptions } from '../../Materials/Textures/multiRenderTarget';
import { Logger } from '../../Misc/logger';
import { Nullable } from '../../types';
import { Constants } from '../constants';
import { ThinEngine } from '../thinEngine';
import { RenderTargetWrapper } from "../renderTargetWrapper";
import { WebGLRenderTargetWrapper } from "../WebGL/webGLRenderTargetWrapper";
import { WebGLHardwareTexture } from "../WebGL/webGLHardwareTexture";
import { RenderTargetTextureSize } from "./engine.renderTarget";

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
        /**
         * Unbind a list of render target textures from the webGL context
         * This is used only when drawBuffer extension or webGL2 are active
         * @param rtWrapper defines the render target wrapper to unbind
         * @param disableGenerateMipMaps defines a boolean indicating that mipmaps must not be generated
         * @param onBeforeUnbind defines a function which will be called before the effective unbind
         */
        unBindMultiColorAttachmentFramebuffer(rtWrapper: RenderTargetWrapper, disableGenerateMipMaps: boolean, onBeforeUnbind?: () => void): void;

        /**
         * Create a multi render target texture
         * @see https://doc.babylonjs.com/features/webgl2#multiple-render-target
         * @param size defines the size of the texture
         * @param options defines the creation options
         * @param initializeBuffers if set to true, the engine will make an initializing call of drawBuffers
         * @returns a new render target wrapper ready to render textures
         */
        createMultipleRenderTarget(size: RenderTargetTextureSize, options: IMultiRenderTargetOptions, initializeBuffers?: boolean): RenderTargetWrapper;

        /**
         * Update the sample count for a given multiple render target texture
         * @see https://doc.babylonjs.com/features/webgl2#multisample-render-targets
         * @param rtWrapper defines the render target wrapper to update
         * @param samples defines the sample count to set
         * @param initializeBuffers if set to true, the engine will make an initializing call of drawBuffers
         * @returns the effective sample count (could be 0 if multisample render targets are not supported)
         */
        updateMultipleRenderTargetTextureSampleCount(rtWrapper: Nullable<RenderTargetWrapper>, samples: number, initializeBuffers?: boolean): number;

        /**
         * Select a subsets of attachments to draw to.
         * @param attachments gl attachments
         */
        bindAttachments(attachments: number[]): void;

        /**
         * Creates a layout object to draw/clear on specific textures in a MRT
         * @param textureStatus textureStatus[i] indicates if the i-th is active
         * @returns A layout to be fed to the engine, calling `bindAttachments`.
         */
        buildTextureLayout(textureStatus: boolean[]): number[];

        /**
         * Restores the webgl state to only draw on the main color attachment
         * when the frame buffer associated is the canvas frame buffer
         */
        restoreSingleAttachment(): void;

        /**
         * Restores the webgl state to only draw on the main color attachment
         * when the frame buffer associated is not the canvas frame buffer
         */
        restoreSingleAttachmentForRenderTarget(): void;
    }
}

ThinEngine.prototype.restoreSingleAttachment = function (): void {
    const gl = this._gl;

    this.bindAttachments([gl.BACK]);
};

ThinEngine.prototype.restoreSingleAttachmentForRenderTarget = function (): void {
    const gl = this._gl;

    this.bindAttachments([gl.COLOR_ATTACHMENT0]);
};

ThinEngine.prototype.buildTextureLayout = function (textureStatus: boolean[]): number[] {
    const gl = this._gl;

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

ThinEngine.prototype.bindAttachments = function (attachments: number[]): void {
    const gl = this._gl;

    gl.drawBuffers(attachments);
};

ThinEngine.prototype.unBindMultiColorAttachmentFramebuffer = function (rtWrapper: WebGLRenderTargetWrapper, disableGenerateMipMaps: boolean = false, onBeforeUnbind?: () => void): void {
    this._currentRenderTarget = null;

    // If MSAA, we need to bitblt back to main texture
    var gl = this._gl;

    var attachments = rtWrapper._attachments!;
    var count = attachments.length;

    if (rtWrapper._MSAAFramebuffer) {
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, rtWrapper._MSAAFramebuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, rtWrapper._framebuffer);

        for (var i = 0; i < count; i++) {
            var texture = rtWrapper.textures![i];

            for (var j = 0; j < count; j++) {
                attachments[j] = gl.NONE;
            }

            attachments[i] = (<any>gl)[this.webGLVersion > 1 ? "COLOR_ATTACHMENT" + i : "COLOR_ATTACHMENT" + i + "_WEBGL"];
            gl.readBuffer(attachments[i]);
            gl.drawBuffers(attachments);
            gl.blitFramebuffer(0, 0, texture.width, texture.height,
                0, 0, texture.width, texture.height,
                gl.COLOR_BUFFER_BIT, gl.NEAREST);

        }

        for (var i = 0; i < count; i++) {
            attachments[i] = (<any>gl)[this.webGLVersion > 1 ? "COLOR_ATTACHMENT" + i : "COLOR_ATTACHMENT" + i + "_WEBGL"];
        }

        gl.drawBuffers(attachments);
    }

    for (var i = 0; i < count; i++) {
        var texture = rtWrapper.textures![i];
        if (texture.generateMipMaps && !disableGenerateMipMaps && !texture.isCube) {
            this._bindTextureDirectly(gl.TEXTURE_2D, texture, true);
            gl.generateMipmap(gl.TEXTURE_2D);
            this._bindTextureDirectly(gl.TEXTURE_2D, null);
        }
    }

    if (onBeforeUnbind) {
        if (rtWrapper._MSAAFramebuffer) {
            // Bind the correct framebuffer
            this._bindUnboundFramebuffer(rtWrapper._framebuffer);
        }
        onBeforeUnbind();
    }

    this._bindUnboundFramebuffer(null);
};

ThinEngine.prototype.createMultipleRenderTarget = function (size: RenderTargetTextureSize, options: IMultiRenderTargetOptions, initializeBuffers: boolean = true): RenderTargetWrapper {
    var generateMipMaps = false;
    var generateDepthBuffer = true;
    var generateStencilBuffer = false;
    var generateDepthTexture = false;
    var depthTextureFormat = Constants.TEXTUREFORMAT_DEPTH16;
    var textureCount = 1;

    var defaultType = Constants.TEXTURETYPE_UNSIGNED_INT;
    var defaultSamplingMode = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;

    var types = new Array<number>();
    var samplingModes = new Array<number>();

    const rtWrapper = this._createHardwareRenderTargetWrapper(true, false, size) as WebGLRenderTargetWrapper;

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
        if (this.webGLVersion > 1 &&
            (options.depthTextureFormat == Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 || options.depthTextureFormat == Constants.TEXTUREFORMAT_DEPTH32_FLOAT)) {
            depthTextureFormat = options.depthTextureFormat;
        }

    }
    var gl = this._gl;
    // Create the framebuffer
    var framebuffer = gl.createFramebuffer();
    this._bindUnboundFramebuffer(framebuffer);

    var width = (<{ width: number, height: number }>size).width || <number>size;
    var height = (<{ width: number, height: number }>size).height || <number>size;

    var textures: InternalTexture[] = [];
    var attachments: number[] = [];

    var depthStencilBuffer = this._setupFramebufferDepthAttachments(!generateDepthTexture && generateStencilBuffer, !generateDepthTexture && generateDepthBuffer, width, height);

    rtWrapper._framebuffer = framebuffer;
    rtWrapper._depthStencilBuffer = depthStencilBuffer;
    rtWrapper._generateDepthBuffer = !generateDepthTexture && generateDepthBuffer;
    rtWrapper._generateStencilBuffer = !generateDepthTexture && generateStencilBuffer;
    rtWrapper._attachments = attachments;

    for (var i = 0; i < textureCount; i++) {
        var samplingMode = samplingModes[i] || defaultSamplingMode;
        var type = types[i] || defaultType;

        if (type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloatLinearFiltering) {
            // if floating point linear (gl.FLOAT) then force to NEAREST_SAMPLINGMODE
            samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        }
        else if (type === Constants.TEXTURETYPE_HALF_FLOAT && !this._caps.textureHalfFloatLinearFiltering) {
            // if floating point linear (HALF_FLOAT) then force to NEAREST_SAMPLINGMODE
            samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        }

        var filters = this._getSamplingParameters(samplingMode, generateMipMaps);
        if (type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloat) {
            type = Constants.TEXTURETYPE_UNSIGNED_INT;
            Logger.Warn("Float textures are not supported. Render target forced to TEXTURETYPE_UNSIGNED_BYTE type");
        }

        var texture = new InternalTexture(this, InternalTextureSource.MultiRenderTarget);
        var attachment = (<any>gl)[this.webGLVersion > 1 ? "COLOR_ATTACHMENT" + i : "COLOR_ATTACHMENT" + i + "_WEBGL"];

        textures.push(texture);
        attachments.push(attachment);

        gl.activeTexture((<any>gl)["TEXTURE" + i]);
        gl.bindTexture(gl.TEXTURE_2D, texture._hardwareTexture!.underlyingResource);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filters.mag);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filters.min);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.texImage2D(gl.TEXTURE_2D, 0, this._getRGBABufferInternalSizedFormat(type), width, height, 0, gl.RGBA, this._getWebGLTextureType(type), null);

        gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, attachment, gl.TEXTURE_2D, texture._hardwareTexture!.underlyingResource, 0);

        if (generateMipMaps) {
            this._gl.generateMipmap(this._gl.TEXTURE_2D);
        }

        // Unbind
        this._bindTextureDirectly(gl.TEXTURE_2D, null);

        texture.baseWidth = width;
        texture.baseHeight = height;
        texture.width = width;
        texture.height = height;
        texture.isReady = true;
        texture.samples = 1;
        texture.generateMipMaps = generateMipMaps;
        texture.samplingMode = samplingMode;
        texture.type = type;

        this._internalTexturesCache.push(texture);
    }

    if (generateDepthTexture && this._caps.depthTextureExtension) {
        // Depth texture
        var depthTexture = new InternalTexture(this, InternalTextureSource.Depth);

        var depthTextureType = Constants.TEXTURETYPE_UNSIGNED_SHORT;
        var glDepthTextureInternalFormat = gl.DEPTH_COMPONENT16;
        var glDepthTextureFormat = gl.DEPTH_COMPONENT;
        var glDepthTextureType = gl.UNSIGNED_SHORT;
        var glAttachment = gl.DEPTH_ATTACHMENT;
        if (this.webGLVersion > 1) {
            if (depthTextureFormat == Constants.TEXTUREFORMAT_DEPTH32_FLOAT) {
                depthTextureType = Constants.TEXTURETYPE_FLOAT;
                glDepthTextureType= gl.FLOAT;
                glDepthTextureInternalFormat = gl.DEPTH_COMPONENT32F;
            } else if (depthTextureFormat == Constants.TEXTUREFORMAT_DEPTH24) {
                depthTextureType = Constants.TEXTURETYPE_UNSIGNED_INT;
                glDepthTextureType= gl.UNSIGNED_INT;
                glDepthTextureInternalFormat = gl.DEPTH_COMPONENT24;
                glAttachment = gl.DEPTH_ATTACHMENT;
            } else if (depthTextureFormat == Constants.TEXTUREFORMAT_DEPTH24_STENCIL8) {
                depthTextureType = Constants.TEXTURETYPE_UNSIGNED_INT_24_8;
                glDepthTextureType= gl.UNSIGNED_INT_24_8;
                glDepthTextureInternalFormat = gl.DEPTH24_STENCIL8;
                glDepthTextureFormat = gl.DEPTH_STENCIL;
                glAttachment = gl.DEPTH_STENCIL_ATTACHMENT;
            }
        }

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, depthTexture._hardwareTexture!.underlyingResource);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            glDepthTextureInternalFormat,
            width,
            height,
            0,
            glDepthTextureFormat,
            glDepthTextureType,
            null
        );

        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            glAttachment,
            gl.TEXTURE_2D,
            depthTexture._hardwareTexture!.underlyingResource,
            0
        );

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

        textures.push(depthTexture);
        this._internalTexturesCache.push(depthTexture);
    }
    rtWrapper.setTextures(textures);
    if (initializeBuffers) {
        gl.drawBuffers(attachments);
    }

    this._bindUnboundFramebuffer(null);

    this.resetTextureCache();

    return rtWrapper;
};

ThinEngine.prototype.updateMultipleRenderTargetTextureSampleCount = function (rtWrapper: Nullable<WebGLRenderTargetWrapper>, samples: number, initializeBuffers: boolean = true): number {
    if (this.webGLVersion < 2 || !rtWrapper || !rtWrapper.texture) {
        return 1;
    }

    if (rtWrapper.samples === samples) {
        return samples;
    }

    const count = rtWrapper._attachments!.length;

    if (count === 0) {
        return 1;
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

    for (let i = 0; i < count; i++) {
        const hardwareTexture = rtWrapper.textures![i]._hardwareTexture as Nullable<WebGLHardwareTexture>;
        if (hardwareTexture?._MSAARenderBuffer) {
            gl.deleteRenderbuffer(hardwareTexture._MSAARenderBuffer);
            hardwareTexture._MSAARenderBuffer = null;
        }
    }

    if (samples > 1 && gl.renderbufferStorageMultisample) {
        const framebuffer = gl.createFramebuffer();

        if (!framebuffer) {
            throw new Error("Unable to create multi sampled framebuffer");
        }

        rtWrapper._MSAAFramebuffer = framebuffer;
        this._bindUnboundFramebuffer(framebuffer);

        const attachments = [];

        for (let i = 0; i < count; i++) {
            const texture = rtWrapper.textures![i];
            const hardwareTexture = texture._hardwareTexture as WebGLHardwareTexture;
            const attachment = (<any>gl)[this.webGLVersion > 1 ? "COLOR_ATTACHMENT" + i : "COLOR_ATTACHMENT" + i + "_WEBGL"];

            const colorRenderbuffer = this._createRenderBuffer(texture.width, texture.height, samples, -1 /* not used */, this._getRGBAMultiSampleBufferFormat(texture.type), attachment);

            if (!colorRenderbuffer) {
                throw new Error("Unable to create multi sampled framebuffer");
            }

            hardwareTexture._MSAARenderBuffer = colorRenderbuffer;
            texture.samples = samples;

            attachments.push(attachment);
        }
        if (initializeBuffers) {
            gl.drawBuffers(attachments);
        }
    } else {
        this._bindUnboundFramebuffer(rtWrapper._framebuffer);
    }

    rtWrapper._depthStencilBuffer = this._setupFramebufferDepthAttachments(rtWrapper._generateStencilBuffer, rtWrapper._generateDepthBuffer, rtWrapper.texture.width, rtWrapper.texture.height, samples);

    this._bindUnboundFramebuffer(null);

    return samples;
};
