import { InternalTexture, InternalTextureSource } from '../../Materials/Textures/internalTexture';
import { Logger } from '../../Misc/logger';
import { RenderTargetCreationOptions } from '../../Materials/Textures/renderTargetCreationOptions';
import { Constants } from '../constants';
import { ThinEngine } from '../thinEngine';
import { DepthTextureCreationOptions } from '../depthTextureCreationOptions';

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
        /**
         * Creates a new render target texture
         * @param size defines the size of the texture
         * @param options defines the options used to create the texture
         * @returns a new render target texture stored in an InternalTexture
         */
        createRenderTargetTexture(size: number | { width: number, height: number }, options: boolean | RenderTargetCreationOptions): InternalTexture;

        /**
         * Creates a depth stencil texture.
         * This is only available in WebGL 2 or with the depth texture extension available.
         * @param size The size of face edge in the texture.
         * @param options The options defining the texture.
         * @returns The texture
         */
        createDepthStencilTexture(size: number | { width: number, height: number }, options: DepthTextureCreationOptions): InternalTexture;

        /** @hidden */
        _createDepthStencilTexture(size: number | { width: number, height: number }, options: DepthTextureCreationOptions): InternalTexture;
    }
}

ThinEngine.prototype.createRenderTargetTexture = function(this: ThinEngine, size: number | { width: number, height: number }, options: boolean | RenderTargetCreationOptions): InternalTexture {
    let fullOptions = new RenderTargetCreationOptions();

    if (options !== undefined && typeof options === "object") {
        fullOptions.generateMipMaps = options.generateMipMaps;
        fullOptions.generateDepthBuffer = options.generateDepthBuffer === undefined ? true : options.generateDepthBuffer;
        fullOptions.generateStencilBuffer = fullOptions.generateDepthBuffer && options.generateStencilBuffer;
        fullOptions.type = options.type === undefined ? Constants.TEXTURETYPE_UNSIGNED_INT : options.type;
        fullOptions.samplingMode = options.samplingMode === undefined ? Constants.TEXTURE_TRILINEAR_SAMPLINGMODE : options.samplingMode;
        fullOptions.format = options.format === undefined ? Constants.TEXTUREFORMAT_RGBA : options.format;
    } else {
        fullOptions.generateMipMaps = <boolean>options;
        fullOptions.generateDepthBuffer = true;
        fullOptions.generateStencilBuffer = false;
        fullOptions.type = Constants.TEXTURETYPE_UNSIGNED_INT;
        fullOptions.samplingMode = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;
        fullOptions.format = Constants.TEXTUREFORMAT_RGBA;
    }

    if (fullOptions.type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloatLinearFiltering) {
        // if floating point linear (gl.FLOAT) then force to NEAREST_SAMPLINGMODE
        fullOptions.samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
    }
    else if (fullOptions.type === Constants.TEXTURETYPE_HALF_FLOAT && !this._caps.textureHalfFloatLinearFiltering) {
        // if floating point linear (HALF_FLOAT) then force to NEAREST_SAMPLINGMODE
        fullOptions.samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
    }
    var gl = this._gl;

    var texture = new InternalTexture(this, InternalTextureSource.RenderTarget);
    this._bindTextureDirectly(gl.TEXTURE_2D, texture, true);

    var width = (<{ width: number, height: number }>size).width || <number>size;
    var height = (<{ width: number, height: number }>size).height || <number>size;

    var filters = this._getSamplingParameters(fullOptions.samplingMode, fullOptions.generateMipMaps ? true : false);

    if (fullOptions.type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloat) {
        fullOptions.type = Constants.TEXTURETYPE_UNSIGNED_INT;
        Logger.Warn("Float textures are not supported. Render target forced to TEXTURETYPE_UNSIGNED_BYTE type");
    }

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filters.mag);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filters.min);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texImage2D(gl.TEXTURE_2D, 0, this._getRGBABufferInternalSizedFormat(fullOptions.type, fullOptions.format), width, height, 0, this._getInternalFormat(fullOptions.format), this._getWebGLTextureType(fullOptions.type), null);

    // Create the framebuffer
    var currentFrameBuffer = this._currentFramebuffer;
    var framebuffer = gl.createFramebuffer();
    this._bindUnboundFramebuffer(framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture._webGLTexture, 0);

    texture._depthStencilBuffer = this._setupFramebufferDepthAttachments(fullOptions.generateStencilBuffer ? true : false, fullOptions.generateDepthBuffer, width, height);

    if (fullOptions.generateMipMaps) {
        this._gl.generateMipmap(this._gl.TEXTURE_2D);
    }

    // Unbind
    this._bindTextureDirectly(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    this._bindUnboundFramebuffer(currentFrameBuffer);

    texture._framebuffer = framebuffer;
    texture.baseWidth = width;
    texture.baseHeight = height;
    texture.width = width;
    texture.height = height;
    texture.isReady = true;
    texture.samples = 1;
    texture.generateMipMaps = fullOptions.generateMipMaps ? true : false;
    texture.samplingMode = fullOptions.samplingMode;
    texture.type = fullOptions.type;
    texture.format = fullOptions.format;
    texture._generateDepthBuffer = fullOptions.generateDepthBuffer;
    texture._generateStencilBuffer = fullOptions.generateStencilBuffer ? true : false;

    // this.resetTextureCache();

    this._internalTexturesCache.push(texture);

    return texture;
};

ThinEngine.prototype.createDepthStencilTexture = function(size: number | { width: number, height: number }, options: DepthTextureCreationOptions): InternalTexture {
    if (options.isCube) {
        let width = (<{ width: number, height: number }>size).width || <number>size;
        return this._createDepthStencilCubeTexture(width, options);
    }
    else {
        return this._createDepthStencilTexture(size, options);
    }
};

ThinEngine.prototype._createDepthStencilTexture = function(size: number | { width: number, height: number }, options: DepthTextureCreationOptions): InternalTexture {
    var internalTexture = new InternalTexture(this, InternalTextureSource.Depth);

    if (!this._caps.depthTextureExtension) {
        Logger.Error("Depth texture is not supported by your browser or hardware.");
        return internalTexture;
    }

    var internalOptions = {
        bilinearFiltering: false,
        comparisonFunction: 0,
        generateStencil: false,
        ...options
    };

    var gl = this._gl;
    this._bindTextureDirectly(gl.TEXTURE_2D, internalTexture, true);

    this._setupDepthStencilTexture(internalTexture, size, internalOptions.generateStencil, internalOptions.bilinearFiltering, internalOptions.comparisonFunction);

    if (this.webGLVersion > 1) {
        if (internalOptions.generateStencil) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH24_STENCIL8, internalTexture.width, internalTexture.height, 0, gl.DEPTH_STENCIL, gl.UNSIGNED_INT_24_8, null);
        }
        else {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, internalTexture.width, internalTexture.height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
        }
    }
    else {
        if (internalOptions.generateStencil) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_STENCIL, internalTexture.width, internalTexture.height, 0, gl.DEPTH_STENCIL, gl.UNSIGNED_INT_24_8, null);
        }
        else {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, internalTexture.width, internalTexture.height, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
        }
    }

    this._bindTextureDirectly(gl.TEXTURE_2D, null);

    return internalTexture;
};