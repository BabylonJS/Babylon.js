import * as extension from "core/esm/Engines/WebGL/Extensions/dynamicTexture/dynamicTexture.webgl";
import { ThinEngine } from "../../Engines/thinEngine";
import { EngineExtensions, loadExtension } from "core/esm/Engines/Extensions/engine.extensions";
import type { InternalTexture} from "../../Materials/Textures/internalTexture";
import type { Nullable } from "../../types";
import type { ICanvas } from "../ICanvas";

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
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
            source: ImageBitmap | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | OffscreenCanvas | ICanvas,
            invertY?: boolean,
            premulAlpha?: boolean,
            format?: number,
            forceBindTexture?: boolean,
            allowGPUOptimization?: boolean
        ): void;
    }
}

ThinEngine.prototype.createDynamicTexture = function (width: number, height: number, generateMipMaps: boolean, samplingMode: number): InternalTexture {
    return extension.createDynamicTexture(this._engineState, width, height, generateMipMaps, samplingMode);
};

ThinEngine.prototype.updateDynamicTexture = function (
    texture: Nullable<InternalTexture>,
    source: ImageBitmap | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | OffscreenCanvas,
    invertY?: boolean,
    premulAlpha: boolean = false,
    format?: number,
    forceBindTexture: boolean = false,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    allowGPUOptimization: boolean = false
): void {
    extension.updateDynamicTexture(this._engineState, texture, source, invertY, premulAlpha, format, forceBindTexture);
};

loadExtension(EngineExtensions.DYNAMIC_TEXTURE, extension);
