/** This file must only contain pure code and pure imports */

import { type Nullable } from "../../../types";
import { type RenderTargetTexture } from "../../../Materials/Textures/renderTargetTexture.pure";
import { ThinWebGPUEngine } from "core/Engines/thinWebGPUEngine";

let _Registered = false;
/**
 * Register side effects for enginesWebGPUExtensionsEngineRenderTargetTexture.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterEnginesWebGPUExtensionsEngineRenderTargetTexture(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    ThinWebGPUEngine.prototype.setDepthStencilTexture = function (
        channel: number,
        uniform: Nullable<WebGLUniformLocation>,
        texture: Nullable<RenderTargetTexture>,
        name?: string
    ): void {
        if (!texture || !texture.depthStencilTexture) {
            this._setTexture(channel, null, undefined, undefined, name);
        } else {
            this._setTexture(channel, texture, false, true, name);
        }
    };
}
