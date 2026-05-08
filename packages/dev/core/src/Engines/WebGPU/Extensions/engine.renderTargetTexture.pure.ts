/** This file must only contain pure code and pure imports */

import { Nullable } from "../../../types";
import { RenderTargetTexture } from "../../../Materials/Textures/renderTargetTexture.pure";
import { ThinWebGPUEngine } from "core/Engines/thinWebGPUEngine";

declare module "../../abstractEngine" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /**
         * Sets a depth stencil texture from a render target to the according uniform.
         * @param channel The texture channel
         * @param uniform The uniform to set
         * @param texture The render target texture containing the depth stencil texture to apply
         * @param name The texture name
         */
        setDepthStencilTexture(channel: number, uniform: Nullable<WebGLUniformLocation>, texture: Nullable<RenderTargetTexture>, name?: string): void;
    }
}

export {};

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
