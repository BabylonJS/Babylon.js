import type { InternalTexture } from "@babylonjs/core/Materials/Textures/internalTexture.js";
import type { ICanvas } from "@babylonjs/core/Engines/ICanvas.js";
import type { Nullable } from "@babylonjs/core/types.js";
import type { IBaseEnginePublic } from "../../engine.base.js";

export interface IDynamicTextureEngineExtension {
    /**
     * Creates a dynamic texture
     * @param width defines the width of the texture
     * @param height defines the height of the texture
     * @param generateMipMaps defines if the engine should generate the mip levels
     * @param samplingMode defines the required sampling mode (Texture.NEAREST_SAMPLINGMODE by default)
     * @returns the dynamic texture inside an InternalTexture
     */
    createDynamicTexture(engineState: IBaseEnginePublic, width: number, height: number, generateMipMaps: boolean, samplingMode: number): InternalTexture;

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
        engineState: IBaseEnginePublic,
        texture: Nullable<InternalTexture>,
        source: ImageBitmap | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | OffscreenCanvas | ICanvas,
        invertY?: boolean,
        premulAlpha?: boolean,
        format?: number,
        forceBindTexture?: boolean,
        allowGPUOptimization?: boolean
    ): void;
}
