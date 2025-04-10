import { InternalTexture, InternalTextureSource } from "../../../Materials/Textures/internalTexture";
import type { ImageSource, Nullable } from "../../../types";
import { WebGPUEngine } from "../../webgpuEngine";
import type { WebGPUHardwareTexture } from "../webgpuHardwareTexture";
import { GetExponentOfTwo } from "../../../Misc/tools.functions";
import type { ICanvas } from "../../../Engines/ICanvas";

declare module "../../abstractEngine" {
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

WebGPUEngine.prototype.createDynamicTexture = function (width: number, height: number, generateMipMaps: boolean, samplingMode: number): InternalTexture {
    const texture = new InternalTexture(this, InternalTextureSource.Dynamic);
    texture.baseWidth = width;
    texture.baseHeight = height;

    if (generateMipMaps) {
        width = this.needPOTTextures ? GetExponentOfTwo(width, this._caps.maxTextureSize) : width;
        height = this.needPOTTextures ? GetExponentOfTwo(height, this._caps.maxTextureSize) : height;
    }

    texture.width = width;
    texture.height = height;
    texture.isReady = false;
    texture.generateMipMaps = generateMipMaps;
    texture.samplingMode = samplingMode;

    this.updateTextureSamplingMode(samplingMode, texture);

    this._internalTexturesCache.push(texture);

    if (width && height) {
        this._textureHelper.createGPUTextureForInternalTexture(texture, width, height);
    }

    return texture;
};

WebGPUEngine.prototype.updateDynamicTexture = function (
    texture: Nullable<InternalTexture>,
    source: ImageSource,
    invertY: boolean,
    premulAlpha: boolean = false,
    format?: number,
    forceBindTexture?: boolean,
    allowGPUOptimization?: boolean
): void {
    if (!texture) {
        return;
    }

    const width = source.width,
        height = source.height;

    let gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;

    if (!texture._hardwareTexture?.underlyingResource) {
        gpuTextureWrapper = this._textureHelper.createGPUTextureForInternalTexture(texture, width, height);
    }

    this._textureHelper.updateTexture(source, texture, width, height, texture.depth, gpuTextureWrapper.format, 0, 0, invertY, premulAlpha, 0, 0, allowGPUOptimization);
    if (texture.generateMipMaps) {
        this._generateMipmaps(texture);
    }

    texture._dynamicTextureSource = source;
    texture._premulAlpha = premulAlpha;
    texture.invertY = invertY || false;
    texture.isReady = true;
};
