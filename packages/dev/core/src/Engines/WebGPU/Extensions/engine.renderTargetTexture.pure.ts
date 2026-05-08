/** This file must only contain pure code and pure imports */

import { Nullable } from "../../../types";
import { RenderTargetTexture } from "../../../Materials/Textures/renderTargetTexture.pure";
import { ThinWebGPUEngine } from "core/Engines/thinWebGPUEngine";

let _registered = false;
export function registerEnginesWebGPUExtensionsEngineRenderTargetTexture(): void {
    if (_registered) {
        return;
    }
    _registered = true;

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
