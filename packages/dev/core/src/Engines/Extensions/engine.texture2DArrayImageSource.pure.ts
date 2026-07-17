/** This file must only contain pure code and pure imports */

import { type ImageSource } from "../../types";
import { type InternalTexture } from "../../Materials/Textures/internalTexture";
import { Logger } from "../../Misc/logger";
import { ThinEngine } from "../thinEngine.pure";

let _Registered = false;
/**
 * Register side effects for enginesExtensionsEngineTexture2DArrayImageSource.
 * Adds AbstractEngine.updateTextureArrayLayerFromImageSource on the WebGL2 engine.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterEnginesExtensionsEngineTexture2DArrayImageSource(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    ThinEngine.prototype.updateTextureArrayLayerFromImageSource = function (
        this: ThinEngine,
        texture: InternalTexture,
        source: ImageSource,
        layer: number,
        invertY: boolean = false,
        premultiplyAlpha: boolean = false
    ): void {
        if (this.webGLVersion < 2) {
            Logger.Error("updateTextureArrayLayerFromImageSource is only supported in WebGL2.");
            return;
        }

        const gl = this._gl as WebGL2RenderingContext;
        const target = gl.TEXTURE_2D_ARRAY;

        const textureType = this._getWebGLTextureType(texture.type);
        const glFormat = this._getInternalFormat(texture.format);

        this._bindTextureDirectly(target, texture, true);
        this._unpackFlipY(invertY);

        if (premultiplyAlpha) {
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
        }

        gl.texSubImage3D(target, 0, 0, 0, layer, texture.width, texture.height, 1, glFormat, textureType, source as TexImageSource);

        if (texture.generateMipMaps) {
            gl.generateMipmap(target);
        }

        if (premultiplyAlpha) {
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
        }

        this._bindTextureDirectly(target, null);

        texture.isReady = true;
    };
}
