import { InternalTexture, InternalTextureSource } from '../../Materials/Textures/internalTexture';
import { IMultiRenderTargetOptions } from '../../Materials/Textures/multiRenderTarget';
import { Logger } from '../../Misc/logger';
import { Nullable } from '../../types';
import { Constants } from '../constants';
import { ThinEngine } from '../thinEngine';

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
        /**
         * Unbind a list of render target textures from the webGL context
         * This is used only when drawBuffer extension or webGL2 are active
         * @param count number of color textures
         * @param textures defines the render target textures to unbind
         * @param disableGenerateMipMaps defines a boolean indicating that mipmaps must not be generated
         * @param onBeforeUnbind defines a function which will be called before the effective unbind
         */
        unBindMultiColorAttachmentFramebuffer(count: number, textures: InternalTexture[], disableGenerateMipMaps: boolean, onBeforeUnbind?: () => void): void;

        /**
         * Create a multi render target texture
         * @see http://doc.babylonjs.com/features/webgl2#multiple-render-target
         * @param size defines the size of the texture
         * @param options defines the creation options
         * @returns the cube texture as an InternalTexture
         */
        createMultipleRenderTarget(size: any, options: IMultiRenderTargetOptions): InternalTexture[];

        /**
         * Update the sample count for a given multiple render target texture
         * @see http://doc.babylonjs.com/features/webgl2#multisample-render-targets
         * @param count number of color textures
         * @param textures defines the textures to update
         * @param samples defines the sample count to set
         * @returns the effective sample count (could be 0 if multisample render targets are not supported)
         */
        updateMultipleRenderTargetTextureSampleCount(count: number, textures: Nullable<InternalTexture[]>, samples: number): number;
    }
}

ThinEngine.prototype.unBindMultiColorAttachmentFramebuffer = function(count: number, textures: InternalTexture[], disableGenerateMipMaps: boolean = false, onBeforeUnbind?: () => void): void {
    this._currentRenderTarget = null;

    // If MSAA, we need to bitblt back to main texture
    var gl = this._gl;

    if (textures[0]._MSAAFramebuffer) {
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, textures[0]._MSAAFramebuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, textures[0]._framebuffer);

        var attachments = textures[0]._attachments;
        if (!attachments) {
            attachments = new Array(count);
            textures[0]._attachments = attachments;
        }

        for (var i = 0; i < count; i++) {
            var texture = textures[i];

            for (var j = 0; j < attachments.length; j++) {
                attachments[j] = gl.NONE;
            }

            attachments[i] = (<any>gl)[this.webGLVersion > 1 ? "COLOR_ATTACHMENT" + i : "COLOR_ATTACHMENT" + i + "_WEBGL"];
            gl.readBuffer(attachments[i]);
            gl.drawBuffers(attachments);
            gl.blitFramebuffer(0, 0, texture.width, texture.height,
                0, 0, texture.width, texture.height,
                gl.COLOR_BUFFER_BIT, gl.NEAREST);

        }
        for (var i = 0; i < attachments.length; i++) {
            attachments[i] = (<any>gl)[this.webGLVersion > 1 ? "COLOR_ATTACHMENT" + i : "COLOR_ATTACHMENT" + i + "_WEBGL"];
        }
        gl.drawBuffers(attachments);
    }

    for (var i = 0; i < count; i++) {
        var texture = textures[i];
        if (texture.generateMipMaps && !disableGenerateMipMaps && !texture.isCube) {
            this._bindTextureDirectly(gl.TEXTURE_2D, texture, true);
            gl.generateMipmap(gl.TEXTURE_2D);
            this._bindTextureDirectly(gl.TEXTURE_2D, null);
        }
    }

    if (onBeforeUnbind) {
        if (textures[0]._MSAAFramebuffer) {
            // Bind the correct framebuffer
            this._bindUnboundFramebuffer(textures[0]._framebuffer);
        }
        onBeforeUnbind();
    }

    this._bindUnboundFramebuffer(null);
};

ThinEngine.prototype.createMultipleRenderTarget = function(size: any, options: IMultiRenderTargetOptions): InternalTexture[] {
    var generateMipMaps = false;
    var generateDepthBuffer = true;
    var generateStencilBuffer = false;
    var generateDepthTexture = false;
    var textureCount = 1;

    var defaultType = Constants.TEXTURETYPE_UNSIGNED_INT;
    var defaultSamplingMode = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;

    var types = new Array<number>();
    var samplingModes = new Array<number>();

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
    var gl = this._gl;
    // Create the framebuffer
    var framebuffer = gl.createFramebuffer();
    this._bindUnboundFramebuffer(framebuffer);

    var width = size.width || size;
    var height = size.height || size;

    var textures = [];
    var attachments = [];

    var depthStencilBuffer = this._setupFramebufferDepthAttachments(generateStencilBuffer, generateDepthBuffer, width, height);

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
        gl.bindTexture(gl.TEXTURE_2D, texture._webGLTexture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filters.mag);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filters.min);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.texImage2D(gl.TEXTURE_2D, 0, this._getRGBABufferInternalSizedFormat(type), width, height, 0, gl.RGBA, this._getWebGLTextureType(type), null);

        gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, attachment, gl.TEXTURE_2D, texture._webGLTexture, 0);

        if (generateMipMaps) {
            this._gl.generateMipmap(this._gl.TEXTURE_2D);
        }

        // Unbind
        this._bindTextureDirectly(gl.TEXTURE_2D, null);

        texture._framebuffer = framebuffer;
        texture._depthStencilBuffer = depthStencilBuffer;
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
        texture._generateStencilBuffer = generateStencilBuffer;
        texture._attachments = attachments;

        this._internalTexturesCache.push(texture);
    }

    if (generateDepthTexture && this._caps.depthTextureExtension) {
        // Depth texture
        var depthTexture = new InternalTexture(this, InternalTextureSource.MultiRenderTarget);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, depthTexture._webGLTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            this.webGLVersion < 2 ? gl.DEPTH_COMPONENT : gl.DEPTH_COMPONENT16,
            width,
            height,
            0,
            gl.DEPTH_COMPONENT,
            gl.UNSIGNED_SHORT,
            null
        );

        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.DEPTH_ATTACHMENT,
            gl.TEXTURE_2D,
            depthTexture._webGLTexture,
            0
        );

        depthTexture._framebuffer = framebuffer;
        depthTexture.baseWidth = width;
        depthTexture.baseHeight = height;
        depthTexture.width = width;
        depthTexture.height = height;
        depthTexture.isReady = true;
        depthTexture.samples = 1;
        depthTexture.generateMipMaps = generateMipMaps;
        depthTexture.samplingMode = gl.NEAREST;
        depthTexture._generateDepthBuffer = generateDepthBuffer;
        depthTexture._generateStencilBuffer = generateStencilBuffer;

        textures.push(depthTexture);
        this._internalTexturesCache.push(depthTexture);
    }

    gl.drawBuffers(attachments);
    this._bindUnboundFramebuffer(null);

    this.resetTextureCache();

    return textures;
};

ThinEngine.prototype.updateMultipleRenderTargetTextureSampleCount = function(count: number, textures: Nullable<InternalTexture[]>, samples: number): number {
    if (this.webGLVersion < 2 || !textures || count == 0) {
        return 1;
    }

    if (textures[0].samples === samples) {
        return samples;
    }

    var gl = this._gl;

    samples = Math.min(samples, this.getCaps().maxMSAASamples);

    // Dispose previous render buffers
    if (textures[0]._depthStencilBuffer) {
        gl.deleteRenderbuffer(textures[0]._depthStencilBuffer);
        textures[0]._depthStencilBuffer = null;
    }

    if (textures[0]._MSAAFramebuffer) {
        gl.deleteFramebuffer(textures[0]._MSAAFramebuffer);
        textures[0]._MSAAFramebuffer = null;
    }

    for (var i = 0; i < count; i++) {
        if (textures[i]._MSAARenderBuffer) {
            gl.deleteRenderbuffer(textures[i]._MSAARenderBuffer);
            textures[i]._MSAARenderBuffer = null;
        }
    }

    if (samples > 1 && gl.renderbufferStorageMultisample) {
        let framebuffer = gl.createFramebuffer();

        if (!framebuffer) {
            throw new Error("Unable to create multi sampled framebuffer");
        }

        this._bindUnboundFramebuffer(framebuffer);

        let depthStencilBuffer = this._setupFramebufferDepthAttachments(textures[0]._generateStencilBuffer, textures[0]._generateDepthBuffer, textures[0].width, textures[0].height, samples);

        var attachments = [];

        for (var i = 0; i < count; i++) {
            var texture = textures[i];
            var attachment = (<any>gl)[this.webGLVersion > 1 ? "COLOR_ATTACHMENT" + i : "COLOR_ATTACHMENT" + i + "_WEBGL"];

            var colorRenderbuffer = gl.createRenderbuffer();

            if (!colorRenderbuffer) {
                throw new Error("Unable to create multi sampled framebuffer");
            }

            gl.bindRenderbuffer(gl.RENDERBUFFER, colorRenderbuffer);
            gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, this._getRGBAMultiSampleBufferFormat(texture.type), texture.width, texture.height);

            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attachment, gl.RENDERBUFFER, colorRenderbuffer);

            texture._MSAAFramebuffer = framebuffer;
            texture._MSAARenderBuffer = colorRenderbuffer;
            texture.samples = samples;
            texture._depthStencilBuffer = depthStencilBuffer;
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            attachments.push(attachment);
        }
        gl.drawBuffers(attachments);
    } else {
        this._bindUnboundFramebuffer(textures[0]._framebuffer);
    }

    this._bindUnboundFramebuffer(null);

    return samples;
};
