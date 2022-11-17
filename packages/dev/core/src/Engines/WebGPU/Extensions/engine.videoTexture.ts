import type { InternalTexture } from "../../../Materials/Textures/internalTexture";
import type { Nullable } from "../../../types";
import { WebGPUEngine } from "../../webgpuEngine";
import type { WebGPUHardwareTexture } from "../webgpuHardwareTexture";
import type { ExternalTexture } from "../../../Materials/Textures/externalTexture";

function IsExternalTexture(texture: Nullable<ExternalTexture> | HTMLVideoElement): texture is ExternalTexture {
    return texture && (texture as ExternalTexture).underlyingResource !== undefined ? true : false;
}

WebGPUEngine.prototype.updateVideoTexture = function (texture: Nullable<InternalTexture>, video: HTMLVideoElement | Nullable<ExternalTexture>, invertY: boolean): void {
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

    if (IsExternalTexture(video)) {
        this._textureHelper.copyVideoToTexture(video, texture, gpuTextureWrapper.format, !invertY);
        if (texture.generateMipMaps) {
            this._generateMipmaps(texture, this._uploadEncoder);
        }
        texture.isReady = true;
    } else if (video) {
        this.createImageBitmap(video)
            .then((bitmap) => {
                this._textureHelper.updateTexture(bitmap, texture, texture.width, texture.height, texture.depth, gpuTextureWrapper.format, 0, 0, !invertY, false, 0, 0);
                if (texture.generateMipMaps) {
                    this._generateMipmaps(texture, this._uploadEncoder);
                }

                texture.isReady = true;
            })
            .catch(() => {
                // Sometimes createImageBitmap(video) fails with "Failed to execute 'createImageBitmap' on 'Window': The provided element's player has no current data."
                // Just keep going on
                texture.isReady = true;
            });
    }
};
