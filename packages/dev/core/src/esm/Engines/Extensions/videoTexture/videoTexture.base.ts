import type { ExternalTexture } from "core/Materials/Textures/externalTexture";
import type { InternalTexture } from "core/Materials/Textures/internalTexture";
import type { Nullable } from "core/types";
import type { IBaseEnginePublic } from "../../engine.base";

export interface IVideoTextureEngineExtension {
    /**
     * Update a video texture
     * @param texture defines the texture to update
     * @param video defines the video element to use
     * @param invertY defines if data must be stored with Y axis inverted
     */
    updateVideoTexture(engineState: IBaseEnginePublic, texture: Nullable<InternalTexture>, video: HTMLVideoElement | Nullable<ExternalTexture>, invertY: boolean): void;
}
