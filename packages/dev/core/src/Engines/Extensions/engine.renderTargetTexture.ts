import type { Nullable } from "../../types";
import { ThinEngine } from "../../Engines/thinEngine";
import type { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";

declare module "../../Engines/abstractEngine" {
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
