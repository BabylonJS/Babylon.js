/** This file must only contain pure code and pure imports */

import { GetExponentOfTwo } from "core/Misc/tools.functions";
import { ThinEngine } from "../../Engines/thinEngine.pure";
import { InternalTextureSource, InternalTexture } from "../../Materials/Textures/internalTexture";
import { ImageSource, Nullable } from "../../types";

let _Registered = false;
/**
 * Register side effects for enginesExtensionsEngineDynamicTexture.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterEnginesExtensionsEngineDynamicTexture(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    ThinEngine.prototype.createDynamicTexture = function (width: number, height: number, generateMipMaps: boolean, samplingMode: number): InternalTexture {
        const texture = new InternalTexture(this, InternalTextureSource.Dynamic);
        texture.baseWidth = width;
        texture.baseHeight = height;

        if (generateMipMaps) {
            width = this.needPOTTextures ? GetExponentOfTwo(width, this._caps.maxTextureSize) : width;
            height = this.needPOTTextures ? GetExponentOfTwo(height, this._caps.maxTextureSize) : height;
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
}
