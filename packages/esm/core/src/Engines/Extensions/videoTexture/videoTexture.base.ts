import type { ExternalTexture } from "@babylonjs/core/Materials/Textures/externalTexture.js";
import type { InternalTexture } from "@babylonjs/core/Materials/Textures/internalTexture.js";
import type { Nullable } from "@babylonjs/core/types.js";
import type { IBaseEnginePublic } from "../../engine.base.js";

export interface IVideoTextureEngineExtension {
    /**
     * Update a video texture
     * @param texture defines the texture to update
     * @param video defines the video element to use
     * @param invertY defines if data must be stored with Y axis inverted
     */
    updateVideoTexture(engineState: IBaseEnginePublic, texture: Nullable<InternalTexture>, video: HTMLVideoElement | Nullable<ExternalTexture>, invertY: boolean): void;
}
