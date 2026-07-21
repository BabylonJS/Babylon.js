/** This file must only contain pure code and pure imports */

import { type ImageSource } from "../../../types";
import { type InternalTexture } from "../../../Materials/Textures/internalTexture";
import { type WebGPUHardwareTexture } from "../webgpuHardwareTexture";
import { ThinWebGPUEngine } from "core/Engines/thinWebGPUEngine";

let _Registered = false;
/**
 * Register side effects for enginesWebGPUExtensionsEngineTexture2DArrayImageSource.
 * Adds AbstractEngine.updateTextureArrayLayerFromImageSource on the WebGPU engine.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterEnginesWebGPUExtensionsEngineTexture2DArrayImageSource(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    ThinWebGPUEngine.prototype.updateTextureArrayLayerFromImageSource = function (
        this: ThinWebGPUEngine,
        texture: InternalTexture,
        source: ImageSource,
        layer: number,
        invertY: boolean = false,
        premultiplyAlpha: boolean = false
    ): void {
        const gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;

        this._textureHelper.updateTexture(source, texture, texture.width, texture.height, 1, gpuTextureWrapper.format, layer, 0, invertY, premultiplyAlpha, 0, 0);

        if (texture.generateMipMaps) {
            this._generateMipmaps(texture, this._uploadEncoder);
        }

        texture.isReady = true;
    };
}
