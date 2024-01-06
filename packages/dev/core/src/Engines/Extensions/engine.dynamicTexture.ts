import { ThinEngine } from "../../Engines/thinEngine";
import { InternalTexture, InternalTextureSource } from "../../Materials/Textures/internalTexture";
import type { ImageSource, Nullable } from "../../types";
import type { ICanvas } from "../ICanvas";

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
         * @param source defines the source containing the data
         * @param invertY defines if data must be stored with Y axis inverted
         * @param premulAlpha defines if alpha is stored as premultiplied
         * @param format defines the format of the data
         * @param forceBindTexture if the texture should be forced to be bound eg. after a graphics context loss (Default: false)
         * @param allowGPUOptimization true to allow some specific GPU optimizations (subject to engine feature "allowGPUOptimizationsForGUI" being true)
         */
        updateDynamicTexture(
            texture: Nullable<InternalTexture>,
            source: ImageSource | ICanvas,
            invertY?: boolean,
            premulAlpha?: boolean,
            format?: number,
            forceBindTexture?: boolean,
            allowGPUOptimization?: boolean
        ): void;
    }
}

ThinEngine.prototype.createDynamicTexture = function (width: number, height: number, generateMipMaps: boolean, samplingMode: number): InternalTexture {
    const texture = new InternalTexture(this, InternalTextureSource.Dynamic);
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

ThinEngine.prototype.updateDynamicTexture = function (
    texture: Nullable<InternalTexture>,
    source: ImageSource,
    invertY?: boolean,
    premulAlpha: boolean = false,
    format?: number,
    forceBindTexture: boolean = false,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    allowGPUOptimization: boolean = false
): void {
    if (!texture) {
        return;
    }

    const gl = this._gl;
    const target = gl.TEXTURE_2D;

    const wasPreviouslyBound = this._bindTextureDirectly(target, texture, true, forceBindTexture);

    this._unpackFlipY(invertY === undefined ? texture.invertY : invertY);

    if (premulAlpha) {
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
    }

    const textureType = this._getWebGLTextureType(texture.type);
    const glformat = this._getInternalFormat(format ? format : texture.format);
    const internalFormat = this._getRGBABufferInternalSizedFormat(texture.type, glformat);

    gl.texImage2D(target, 0, internalFormat, glformat, textureType, source as TexImageSource);

    if (texture.generateMipMaps) {
        gl.generateMipmap(target);
    }

    if (!wasPreviouslyBound) {
        this._bindTextureDirectly(target, null);
    }

    if (premulAlpha) {
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
    }

    if (format) {
        texture.format = format;
    }

    texture._dynamicTextureSource = source;
    texture._premulAlpha = premulAlpha;
    texture.invertY = invertY || false;
    texture.isReady = true;
};
