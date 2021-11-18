import { InternalTexture } from "../../../Materials/Textures/internalTexture";
import { Nullable } from "../../../types";
import { WebGPUEngine } from "../../webgpuEngine";
import { WebGPUHardwareTexture } from "../webgpuHardwareTexture";

WebGPUEngine.prototype.updateDynamicTexture = function (texture: Nullable<InternalTexture>, canvas: HTMLCanvasElement | OffscreenCanvas, invertY: boolean, premulAlpha: boolean = false, format?: number, forceBindTexture?: boolean, allowGPUOptimization?: boolean): void {
    if (!texture) {
        return;
    }

    const width = canvas.width, height = canvas.height;

    let gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;

    if (!texture._hardwareTexture?.underlyingResource) {
        gpuTextureWrapper = this._textureHelper.createGPUTextureForInternalTexture(texture, width, height);
    }

    this._textureHelper.updateTexture(canvas, texture, width, height, texture.depth, gpuTextureWrapper.format, 0, 0, invertY, premulAlpha, 0, 0, this._uploadEncoder, allowGPUOptimization);
    if (texture.generateMipMaps) {
        this._generateMipmaps(texture, this._uploadEncoder);
    }

    texture.isReady = true;
};
