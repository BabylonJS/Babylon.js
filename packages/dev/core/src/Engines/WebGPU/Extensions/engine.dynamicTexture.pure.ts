/** This file must only contain pure code and pure imports */

import { InternalTextureSource, InternalTexture } from "../../../Materials/Textures/internalTexture";
import { ImageSource, Nullable } from "../../../types";
import { WebGPUEngine } from "../../webgpuEngine.pure";
import { WebGPUHardwareTexture } from "../webgpuHardwareTexture";
import { GetExponentOfTwo } from "../../../Misc/tools.functions";

let _registered = false;
export function registerEnginesWebGPUExtensionsEngineDynamicTexture(): void {
    if (_registered) {
        return;
    }
    _registered = true;

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
}
