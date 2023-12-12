import { ThinEngine } from "../../Engines/thinEngine";
import type { InternalTexture } from "../../Materials/Textures/internalTexture";
import type { Nullable } from "../../types";
import type { ExternalTexture } from "../../Materials/Textures/externalTexture";
import * as extension from "core/esm/Engines/WebGL/Extensions/videoTexture/videoTexture.webgl";
import { EngineExtensions, loadExtension } from "core/esm/Engines/Extensions/engine.extensions";

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
        /**
         * Update a video texture
         * @param texture defines the texture to update
         * @param video defines the video element to use
         * @param invertY defines if data must be stored with Y axis inverted
         */
        updateVideoTexture(texture: Nullable<InternalTexture>, video: HTMLVideoElement | Nullable<ExternalTexture>, invertY: boolean): void;
    }
}

ThinEngine.prototype.updateVideoTexture = function (texture: Nullable<InternalTexture>, video: HTMLVideoElement, invertY: boolean): void {
    extension.updateVideoTexture(this._engineState, texture, video, invertY);
};

loadExtension(EngineExtensions.VIDEO_TEXTURE, extension);
