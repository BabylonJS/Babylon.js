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
    }
}

ThinEngine.prototype.createExternalTexture = function (video: HTMLVideoElement): Nullable<ExternalTexture> {
    return null;
};
