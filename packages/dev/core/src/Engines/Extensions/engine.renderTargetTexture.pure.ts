/** This file must only contain pure code and pure imports */

import { type Nullable } from "../../types";
import { ThinEngine } from "../../Engines/thinEngine.pure";
import { type RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture.pure";

let _Registered = false;
/**
 * Register side effects for enginesExtensionsEngineRenderTargetTexture.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterEnginesExtensionsEngineRenderTargetTexture(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

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
