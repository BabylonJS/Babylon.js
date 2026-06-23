/** This file must only contain pure code and pure imports */

import { type InternalTexture } from "../../../Materials/Textures/internalTexture";
import { type Nullable } from "../../../types";
import { WebGPUEngine } from "../../webgpuEngine.pure";
import { type WebGPUHardwareTexture } from "../webgpuHardwareTexture";
import { type ExternalTexture } from "../../../Materials/Textures/externalTexture";

let _Registered = false;
/**
 * Register side effects for enginesWebGPUExtensionsEngineVideoTexture.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterEnginesWebGPUExtensionsEngineVideoTexture(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    // eslint-disable-next-line @typescript-eslint/naming-convention
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
            if (video.isReady()) {
                try {
                    if (this.snapshotRendering) {
                        // Under snapshot rendering the main render encoder is reserved for recording/replaying
                        // bundles, and _generateMipmaps()'s _endCurrentRenderPass() would corrupt the bundle. Run the
                        // copy (and mipmap generation, if any) on a single dedicated, immediately-submitted encoder.
                        const commandEncoder = this._device.createCommandEncoder();
                        this._textureHelper.copyVideoToTexture(video, texture, gpuTextureWrapper.format, !invertY, commandEncoder);
                        if (texture.generateMipMaps) {
                            this._generateMipmaps(texture, commandEncoder);
                        }
                        this._device.queue.submit([commandEncoder.finish()]);
                    } else {
                        this._textureHelper.copyVideoToTexture(video, texture, gpuTextureWrapper.format, !invertY);
                        if (texture.generateMipMaps) {
                            this._generateMipmaps(texture);
                        }
                    }
                } catch (e) {
                    // WebGPU doesn't support video element who are not playing so far
                    // Ignore this error ensures we can start a video texture in a paused state
                }
                texture.isReady = true;
            }
        } else if (video) {
            this.createImageBitmap(video)
                // eslint-disable-next-line github/no-then
                .then((bitmap) => {
                    this._textureHelper.updateTexture(bitmap, texture, texture.width, texture.height, texture.depth, gpuTextureWrapper.format, 0, 0, !invertY, false, 0, 0);
                    if (texture.generateMipMaps) {
                        this._generateMipmaps(texture);
                    }

                    texture.isReady = true;
                })
                // eslint-disable-next-line github/no-then
                .catch(() => {
                    // Sometimes createImageBitmap(video) fails with "Failed to execute 'createImageBitmap' on 'Window': The provided element's player has no current data."
                    // Just keep going on
                    texture.isReady = true;
                });
        }
    };
}
