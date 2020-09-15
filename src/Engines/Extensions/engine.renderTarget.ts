import { InternalTexture, InternalTextureSource } from '../../Materials/Textures/internalTexture';
import { Logger } from '../../Misc/logger';
import { RenderTargetCreationOptions } from '../../Materials/Textures/renderTargetCreationOptions';
import { Constants } from '../constants';
import { ThinEngine } from '../thinEngine';
import { DepthTextureCreationOptions } from '../depthTextureCreationOptions';

/**
 * Type used to define a render target texture size (either with a number or with a rect width and height)
 */
export type RenderTargetTextureSize = number | { width: number, height: number, layers?: number };

declare module "../../Engines/thinEngine" {

    export interface ThinEngine {
        /**
         * Creates a new render target texture
         * @param size defines the size of the texture
         * @param options defines the options used to create the texture
         * @returns a new render target texture stored in an InternalTexture
         */
        createRenderTargetTexture(size: RenderTargetTextureSize, options: boolean | RenderTargetCreationOptions): InternalTexture;

        /**
         * Creates a depth stencil texture.
         * This is only available in WebGL 2 or with the depth texture extension available.
         * @param size The size of face edge in the texture.
         * @param options The options defining the texture.
         * @returns The texture
         */
        createDepthStencilTexture(size: RenderTargetTextureSize, options: DepthTextureCreationOptions): InternalTexture;

        /** @hidden */
        _createDepthStencilTexture(size: RenderTargetTextureSize, options: DepthTextureCreationOptions): InternalTexture;
    }
}

ThinEngine.prototype.createRenderTargetTexture = function(this: ThinEngine, size: RenderTargetTextureSize, options: boolean | RenderTargetCreationOptions): InternalTexture {
    const fullOptions = new RenderTargetCreationOptions();
    if (options !== undefined && typeof options === "object") {
        fullOptions.generateMipMaps = options.generateMipMaps;
        fullOptions.generateDepthBuffer = !!options.generateDepthBuffer;
        fullOptions.generateStencilBuffer = !!options.generateStencilBuffer;
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
    if (fullOptions.type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloat) {
        fullOptions.type = Constants.TEXTURETYPE_UNSIGNED_INT;
        Logger.Warn("Float textures are not supported. Render target forced to TEXTURETYPE_UNSIGNED_BYTE type");
    }

    const gl = this._gl;
    const texture = new InternalTexture(this, InternalTextureSource.RenderTarget);
    const width = (<{ width: number, height: number, layers?: number }>size).width || <number>size;
    const height = (<{ width: number, height: number, layers?: number }>size).height || <number>size;
    const layers = (<{ width: number, height: number, layers?: number }>size).layers || 0;
    const filters = this._getSamplingParameters(fullOptions.samplingMode, fullOptions.generateMipMaps ? true : false);
    const target = layers !== 0 ? gl.TEXTURE_2D_ARRAY : gl.TEXTURE_2D;
    const sizedFormat = this._getRGBABufferInternalSizedFormat(fullOptions.type, fullOptions.format);
    const internalFormat = this._getInternalFormat(fullOptions.format);
    const type = this._getWebGLTextureType(fullOptions.type);

    // Bind
    this._bindTextureDirectly(target, texture);

    if (layers !== 0) {
        texture.is2DArray = true;
        gl.texImage3D(target, 0, sizedFormat, width, height, layers, 0, internalFormat, type, null);
    }
    else {
        gl.texImage2D(target, 0, sizedFormat, width, height, 0, internalFormat, type, null);
    }

    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, filters.mag);
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, filters.min);
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // MipMaps
    if (fullOptions.generateMipMaps) {
        this._gl.generateMipmap(target);
    }

    this._bindTextureDirectly(target, null);

    // Create the framebuffer
    const framebuffer = gl.createFramebuffer();
    this._bindUnboundFramebuffer(framebuffer);
    texture._depthStencilBuffer = this._setupFramebufferDepthAttachments(fullOptions.generateStencilBuffer ? true : false, fullOptions.generateDepthBuffer, width, height);

    // No need to rebind on every frame
    if (!texture.is2DArray) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture._webGLTexture, 0);
    }

    this._bindUnboundFramebuffer(null);

    texture._framebuffer = framebuffer;
    texture.baseWidth = width;
    texture.baseHeight = height;
    texture.width = width;
    texture.height = height;
    texture.depth = layers;
    texture.isReady = true;
    texture.samples = 1;
    texture.generateMipMaps = fullOptions.generateMipMaps ? true : false;
    texture.samplingMode = fullOptions.samplingMode;
    texture.type = fullOptions.type;
    texture.format = fullOptions.format;
    texture._generateDepthBuffer = fullOptions.generateDepthBuffer;
    texture._generateStencilBuffer = fullOptions.generateStencilBuffer ? true : false;

    this._internalTexturesCache.push(texture);

    return texture;
};

ThinEngine.prototype.createDepthStencilTexture = function(size: RenderTargetTextureSize, options: DepthTextureCreationOptions): InternalTexture {
    if (options.isCube) {
        let width = (<{ width: number, height: number }>size).width || <number>size;
        return this._createDepthStencilCubeTexture(width, options);
    }
    else {
        return this._createDepthStencilTexture(size, options);
    }
};

ThinEngine.prototype._createDepthStencilTexture = function(size: RenderTargetTextureSize, options: DepthTextureCreationOptions): InternalTexture {
    const gl = this._gl;
    const layers = (<{ width: number, height: number, layers?: number }>size).layers || 0;
    const target = layers !== 0 ? gl.TEXTURE_2D_ARRAY : gl.TEXTURE_2D;
    const internalTexture = new InternalTexture(this, InternalTextureSource.Depth);
    if (!this._caps.depthTextureExtension) {
        Logger.Error("Depth texture is not supported by your browser or hardware.");
        return internalTexture;
    }

    const internalOptions = {
        bilinearFiltering: false,
        comparisonFunction: 0,
        generateStencil: false,
        ...options
    };

    this._bindTextureDirectly(target, internalTexture, true);

    this._setupDepthStencilTexture(internalTexture, size, internalOptions.generateStencil, internalOptions.bilinearFiltering, internalOptions.comparisonFunction);

    const type = internalOptions.generateStencil ? gl.UNSIGNED_INT_24_8 : gl.UNSIGNED_INT;
    const internalFormat = internalOptions.generateStencil ? gl.DEPTH_STENCIL : gl.DEPTH_COMPONENT;
    let sizedFormat = internalFormat;
    if (this.webGLVersion > 1) {
        sizedFormat = internalOptions.generateStencil ? gl.DEPTH24_STENCIL8 : gl.DEPTH_COMPONENT24;
    }

    if (internalTexture.is2DArray) {
        gl.texImage3D(target, 0, sizedFormat, internalTexture.width, internalTexture.height, layers, 0, internalFormat, type, null);
    }
    else {
        gl.texImage2D(target, 0, sizedFormat, internalTexture.width, internalTexture.height, 0, internalFormat, type, null);
    }

    this._bindTextureDirectly(target, null);

    return internalTexture;
};