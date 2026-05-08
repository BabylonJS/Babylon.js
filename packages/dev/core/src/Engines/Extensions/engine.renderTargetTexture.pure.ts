/** This file must only contain pure code and pure imports */

import { Nullable } from "../../types";
import { ThinEngine } from "../../Engines/thinEngine.pure";
import { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture.pure";

let _registered = false;
export function registerEnginesExtensionsEngineRenderTargetTexture(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    ThinEngine.prototype.setDepthStencilTexture = function (channel: number, uniform: Nullable<WebGLUniformLocation>, texture: Nullable<RenderTargetTexture>, name?: string): void {
        if (channel === undefined) {
            return;
        }

        if (uniform) {
            this._boundUniforms[channel] = uniform;
        }

        if (!texture || !texture.depthStencilTexture) {
            this._setTexture(channel, null, undefined, undefined, name);
        } else {
            this._setTexture(channel, texture, false, true, name);
        }
    };
}
