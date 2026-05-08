import { type ICanvas } from "../ICanvas";
import { type InternalTexture } from "../../Materials/Textures/internalTexture";
import { type ImageSource, type Nullable } from "../../types";
declare module "../../Engines/abstractEngine.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /**
         * Creates a dynamic texture
         * @param width defines the width of the texture
         * @param height defines the height of the texture
         * @param generateMipMaps defines if the engine should generate the mip levels
         * @param samplingMode defines the required sampling mode (Texture.NEAREST_SAMPLINGMODE by default)
         * @returns the dynamic texture inside an InternalTexture
         */
        createDynamicTexture(width: number, height: number, generateMipMaps: boolean, samplingMode: number): InternalTexture;

        /**
         * Update the content of a dynamic texture
         * @param texture defines the texture to update
         * @param source defines the source containing the data
         * @param invertY defines if data must be stored with Y axis inverted
         * @param premulAlpha defines if alpha is stored as premultiplied
         * @param format defines the format of the data
         * @param forceBindTexture if the texture should be forced to be bound eg. after a graphics context loss (Default: false)
         * @param allowGPUOptimization true to allow some specific GPU optimizations (subject to engine feature "allowGPUOptimizationsForGUI" being true)
         */
        updateDynamicTexture(
            texture: Nullable<InternalTexture>,
            source: ImageSource | ICanvas,
            invertY?: boolean,
            premulAlpha?: boolean,
            format?: number,
            forceBindTexture?: boolean,
            allowGPUOptimization?: boolean
        ): void;
    }
}
