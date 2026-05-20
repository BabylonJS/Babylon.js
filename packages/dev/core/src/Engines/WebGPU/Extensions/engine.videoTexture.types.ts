import { type InternalTexture } from "../../../Materials/Textures/internalTexture";
import { type Nullable } from "../../../types";
import { type ExternalTexture } from "../../../Materials/Textures/externalTexture";
declare module "../../abstractEngine.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /**
         * Update a video texture
         * @param texture defines the texture to update
         * @param video defines the video element to use
         * @param invertY defines if data must be stored with Y axis inverted
         */
        updateVideoTexture(texture: Nullable<InternalTexture>, video: HTMLVideoElement | Nullable<ExternalTexture>, invertY: boolean): void;
    }
}
