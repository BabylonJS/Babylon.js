import { WebGPUEngine } from "../../webgpuEngine";
import { ExternalTexture } from "../../../Materials/Textures/externalTexture";
import { Nullable } from "../../../types";
import { WebGPUExternalTexture } from "../webgpuExternalTexture";
import { Effect } from "../../../Materials/effect";

declare module "../../../Materials/effect" {
    export interface Effect {
        /**
         * Sets an external texture on the engine to be used in the shader.
         * @param name Name of the external texture variable.
         * @param texture Texture to set.
         */
        setExternalTexture(name: string, texture: Nullable<ExternalTexture>): void;
    }
}

Effect.prototype.setExternalTexture = function(name: string, texture: Nullable<ExternalTexture>): void {
    this._engine.setExternalTexture(name, texture);
};

WebGPUEngine.prototype.createExternalTexture = function (video: HTMLVideoElement): Nullable<ExternalTexture> {
    const texture = new WebGPUExternalTexture(video);
    return texture;
};

WebGPUEngine.prototype.setExternalTexture = function (name: string, texture: Nullable<ExternalTexture>): void {
    if (!texture) {
        this._currentMaterialContext.setTexture(name, null);
        return;
    }
    this._setInternalTexture(name, texture);
};
