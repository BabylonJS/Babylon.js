import type { InternalTexture } from "../../../Materials/Textures/internalTexture";
import type { Nullable } from "../../../types";
import { WebGPUEngine } from "../../webgpuEngine";
import type { WebGPUHardwareTexture } from "../webgpuHardwareTexture";

WebGPUEngine.prototype._readTexturePixels = function (
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

WebGPUEngine.prototype._readTexturePixelsSync = function (): ArrayBufferView {
    // eslint-disable-next-line no-throw-literal
    throw "_readTexturePixelsSync is unsupported in WebGPU!";
};
