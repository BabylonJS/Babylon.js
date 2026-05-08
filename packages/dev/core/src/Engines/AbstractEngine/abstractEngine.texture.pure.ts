/** This file must only contain pure code and pure imports */

import { DepthTextureCreationOptions, TextureSize } from "../../Materials/Textures/textureCreationOptions";
import { RenderTargetWrapper } from "../renderTargetWrapper";
import { InternalTexture } from "../../Materials/Textures/internalTexture";
import { AbstractEngine } from "../abstractEngine.pure";

let _registered = false;
export function registerAbstractEngineTexture(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    AbstractEngine.prototype.createDepthStencilTexture = function (size: TextureSize, options: DepthTextureCreationOptions, rtWrapper: RenderTargetWrapper): InternalTexture {
        if (options.isCube) {
            const width = (<{ width: number; height: number }>size).width || <number>size;
            return this._createDepthStencilCubeTexture(width, options);
        } else {
            return this._createDepthStencilTexture(size, options, rtWrapper);
        }
    };
}
