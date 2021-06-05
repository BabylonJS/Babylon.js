import { InternalTexture } from "../../../Materials/Textures/internalTexture";
import { Nullable } from "../../../types";
import { WebGPUEngine } from "../../webgpuEngine";
import { WebGPUHardwareTexture } from "../webgpuHardwareTexture";

WebGPUEngine.prototype._readTexturePixels = function(texture: InternalTexture, width: number, height: number, faceIndex = -1, level = 0, buffer: Nullable<ArrayBufferView> = null, flushRenderer = true): Promise<ArrayBufferView> {
    let gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;

    if (flushRenderer) {
        this.flushFramebuffer();
    }

    return this._textureHelper.readPixels(gpuTextureWrapper.underlyingResource!, 0, 0, width, height, gpuTextureWrapper.format, faceIndex, level, buffer);
};

WebGPUEngine.prototype._readTexturePixelsSync = function(texture: InternalTexture, width: number, height: number, faceIndex = -1, level = 0, buffer: Nullable<ArrayBufferView> = null, flushRenderer = true): ArrayBufferView {
    throw "_readTexturePixelsSync is unsupported in WebGPU!";
};
