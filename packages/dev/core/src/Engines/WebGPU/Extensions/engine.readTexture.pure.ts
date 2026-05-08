/** This file must only contain pure code and pure imports */

import { ThinWebGPUEngine } from "core/Engines/thinWebGPUEngine";
import { type InternalTexture } from "../../../Materials/Textures/internalTexture";
import { type Nullable } from "../../../types";
import { type WebGPUHardwareTexture } from "../webgpuHardwareTexture";

let _Registered = false;
/**
 * Register side effects for enginesWebGPUExtensionsEngineReadTexture.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterEnginesWebGPUExtensionsEngineReadTexture(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    // eslint-disable-next-line @typescript-eslint/promise-function-async
    ThinWebGPUEngine.prototype._readTexturePixels = function (
        texture: InternalTexture,
        width: number,
        height: number,
        faceIndex = -1,
        level = 0,
        buffer: Nullable<ArrayBufferView> = null,
        flushRenderer = true,
        noDataConversion = false,
        x = 0,
        y = 0
    ): Promise<ArrayBufferView> {
        const gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;

        if (flushRenderer) {
            this.flushFramebuffer();
        }

        return this._textureHelper.readPixels(gpuTextureWrapper.underlyingResource!, x, y, width, height, gpuTextureWrapper.format, faceIndex, level, buffer, noDataConversion);
    };

    ThinWebGPUEngine.prototype._readTexturePixelsSync = function (): ArrayBufferView {
        // eslint-disable-next-line no-throw-literal
        throw "_readTexturePixelsSync is unsupported in WebGPU!";
    };
}
