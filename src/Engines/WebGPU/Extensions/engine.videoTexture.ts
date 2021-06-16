import { InternalTexture } from "../../../Materials/Textures/internalTexture";
import { Nullable } from "../../../types";
import { WebGPUEngine } from "../../webgpuEngine";
import { WebGPUHardwareTexture } from "../webgpuHardwareTexture";

WebGPUEngine.prototype.updateVideoTexture = function(texture: Nullable<InternalTexture>, video: HTMLVideoElement, invertY: boolean): void {
    if (!texture || texture._isDisabled) {
        return;
    }

    if (this._videoTextureSupported === undefined) {
        this._videoTextureSupported = true;
    }

    let gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;

    if (!texture._hardwareTexture?.underlyingResource) {
        gpuTextureWrapper = this._textureHelper.createGPUTextureForInternalTexture(texture);
    }

    this.createImageBitmap(video).then((bitmap) => {
        this._textureHelper.updateTexture(bitmap, texture, texture.width, texture.height, texture.depth, gpuTextureWrapper.format, 0, 0, !invertY, false, 0, 0, this._uploadEncoder);
        if (texture.generateMipMaps) {
            this._generateMipmaps(texture, this._uploadEncoder);
        }

        texture.isReady = true;
    }).catch((msg) => {
        // Sometimes createImageBitmap(video) fails with "Failed to execute 'createImageBitmap' on 'Window': The provided element's player has no current data."
        // Just keep going on
        texture.isReady = true;
    });
};
