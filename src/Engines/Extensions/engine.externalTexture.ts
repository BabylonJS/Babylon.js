import { ThinEngine } from "../../Engines/thinEngine";
import { ExternalTexture } from "../../Materials/Textures/externalTexture";
import { Nullable } from '../../types';

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
        /**
         * Creates an external texture
         * @param video video element
         * @returns the external texture, or null if external textures are not supported by the engine
         */
        createExternalTexture(video: HTMLVideoElement): Nullable<ExternalTexture>;

        /**
         * Sets an internal texture to the according uniform.
         * @param name The name of the uniform in the effect
         * @param texture The texture to apply
         */
        setExternalTexture(name: string, texture: Nullable<ExternalTexture>): void;
    }
}

ThinEngine.prototype.createExternalTexture = function (video: HTMLVideoElement): Nullable<ExternalTexture> {
    return null;
};

ThinEngine.prototype.setExternalTexture = function (name: string, texture: Nullable<ExternalTexture>): void {
    throw new Error("setExternalTexture: This engine does not support external textures!");
};
