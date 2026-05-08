/** This file must only contain pure code and pure imports */

import { type DepthTextureCreationOptions, type TextureSize } from "../../Materials/Textures/textureCreationOptions";
import { type RenderTargetWrapper } from "../renderTargetWrapper";
import { type InternalTexture } from "../../Materials/Textures/internalTexture";
import { AbstractEngine } from "../abstractEngine.pure";

let _Registered = false;
/**
 * Register side effects for abstractEngineTexture.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterAbstractEngineTexture(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    AbstractEngine.prototype.createDepthStencilTexture = function (size: TextureSize, options: DepthTextureCreationOptions, rtWrapper: RenderTargetWrapper): InternalTexture {
        if (options.isCube) {
            const width = (<{ width: number; height: number }>size).width || <number>size;
            return this._createDepthStencilCubeTexture(width, options);
        } else {
            return this._createDepthStencilTexture(size, options, rtWrapper);
        }
    };
}
