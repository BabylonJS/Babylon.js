/** This file must only contain pure code and pure imports */

import { InternalTextureSource, InternalTexture } from "../../../Materials/Textures/internalTexture";
import { type ImageSource, type Nullable } from "../../../types";
import { WebGPUEngine } from "../../webgpuEngine.pure";
import { type WebGPUHardwareTexture } from "../webgpuHardwareTexture";
import { GetExponentOfTwo } from "../../../Misc/tools.functions";

let _Registered = false;
/**
 * Register side effects for enginesWebGPUExtensionsEngineDynamicTexture.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterEnginesWebGPUExtensionsEngineDynamicTexture(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

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
