import { ThinEngine } from "core/Engines/thinEngine";
import { InternalTexture, InternalTextureSource } from "../../../Materials/Textures/internalTexture";
import type { Nullable } from "../../../types";
import { WebGPUEngine } from "../../webgpuEngine";
import type { WebGPUHardwareTexture } from "../webgpuHardwareTexture";

WebGPUEngine.prototype.createDynamicTexture = function (width: number, height: number, generateMipMaps: boolean, samplingMode: number): InternalTexture {
    const texture = new InternalTexture(this, InternalTextureSource.Dynamic);
    texture.baseWidth = width;
    texture.baseHeight = height;

    if (generateMipMaps) {
        width = this.needPOTTextures ? ThinEngine.GetExponentOfTwo(width, this._caps.maxTextureSize) : width;
        height = this.needPOTTextures ? ThinEngine.GetExponentOfTwo(height, this._caps.maxTextureSize) : height;
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
    canvas: HTMLCanvasElement | OffscreenCanvas,
    invertY: boolean,
    premulAlpha: boolean = false,
    format?: number,
    forceBindTexture?: boolean,
    allowGPUOptimization?: boolean
): void {
    if (!texture) {
        return;
    }

    const width = canvas.width,
        height = canvas.height;

    let gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;

    if (!texture._hardwareTexture?.underlyingResource) {
        gpuTextureWrapper = this._textureHelper.createGPUTextureForInternalTexture(texture, width, height);
    }

    this._textureHelper.updateTexture(canvas, texture, width, height, texture.depth, gpuTextureWrapper.format, 0, 0, invertY, premulAlpha, 0, 0, allowGPUOptimization);
    if (texture.generateMipMaps) {
        this._generateMipmaps(texture);
    }

    texture.isReady = true;
};
