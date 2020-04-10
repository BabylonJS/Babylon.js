import { ThinEngine } from "../../Engines/thinEngine";
import { InternalTexture, InternalTextureSource } from '../../Materials/Textures/internalTexture';
import { Nullable } from '../../types';

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
        /**
         * Creates a dynamic texture
         * @param width defines the width of the texture
         * @param height defines the height of the texture
         * @param generateMipMaps defines if the engine should generate the mip levels
         * @param samplingMode defines the required sampling mode (Texture.NEAREST_SAMPLINGMODE by default)
         * @returns the dynamic texture inside an InternalTexture
         */
        createDynamicTexture(width: number, height: number, generateMipMaps: boolean, samplingMode: number): InternalTexture;

        /**
         * Update the content of a dynamic texture
         * @param texture defines the texture to update
         * @param canvas defines the canvas containing the source
         * @param invertY defines if data must be stored with Y axis inverted
         * @param premulAlpha defines if alpha is stored as premultiplied
         * @param format defines the format of the data
         * @param forceBindTexture if the texture should be forced to be bound eg. after a graphics context loss (Default: false)
         */
        updateDynamicTexture(texture: Nullable<InternalTexture>, canvas: HTMLCanvasElement | OffscreenCanvas, invertY: boolean, premulAlpha?: boolean, format?: number, forceBindTexture?: boolean): void;
    }
}

ThinEngine.prototype.createDynamicTexture = function(width: number, height: number, generateMipMaps: boolean, samplingMode: number): InternalTexture {
    var texture = new InternalTexture(this, InternalTextureSource.Dynamic);
    texture.baseWidth = width;
    texture.baseHeight = height;

    if (generateMipMaps) {
        width = this.needPOTTextures ? ThinEngine.GetExponentOfTwo(width, this._caps.maxTextureSize) : width;
        height = this.needPOTTextures ? ThinEngine.GetExponentOfTwo(height, this._caps.maxTextureSize) : height;
    }

    //  this.resetTextureCache();
    texture.width = width;
    texture.height = height;
    texture.isReady = false;
    texture.generateMipMaps = generateMipMaps;
    texture.samplingMode = samplingMode;

    this.updateTextureSamplingMode(samplingMode, texture);

    this._internalTexturesCache.push(texture);

    return texture;
};

ThinEngine.prototype.updateDynamicTexture = function(texture: Nullable<InternalTexture>, canvas: HTMLCanvasElement, invertY: boolean, premulAlpha: boolean = false, format?: number, forceBindTexture: boolean = false): void {
    if (!texture) {
        return;
    }

    this._bindTextureDirectly(this._gl.TEXTURE_2D, texture, true, forceBindTexture);
    this._unpackFlipY(invertY);
    if (premulAlpha) {
        this._gl.pixelStorei(this._gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
    }
    let internalFormat = format ? this._getInternalFormat(format) : this._gl.RGBA;
    this._gl.texImage2D(this._gl.TEXTURE_2D, 0, internalFormat, internalFormat, this._gl.UNSIGNED_BYTE, canvas);
    if (texture.generateMipMaps) {
        this._gl.generateMipmap(this._gl.TEXTURE_2D);
    }
    this._bindTextureDirectly(this._gl.TEXTURE_2D, null);
    if (premulAlpha) {
        this._gl.pixelStorei(this._gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
    }
    texture.isReady = true;
};