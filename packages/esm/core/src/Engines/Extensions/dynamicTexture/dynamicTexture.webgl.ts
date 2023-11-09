import { ThinEngine } from "@babylonjs/core/Engines/thinEngine.js";
import { InternalTexture, InternalTextureSource } from "@babylonjs/core/Materials/Textures/internalTexture.js";
import type { Nullable } from "@babylonjs/core/types.js";
import {
    updateTextureSamplingMode,
    _bindTextureDirectly,
    _getInternalFormat,
    _getRGBABufferInternalSizedFormat,
    _getWebGLTextureType,
    _unpackFlipY,
    _releaseTexture,
    createTexture,
} from "../../engine.webgl.js";

import type { IWebGLEnginePublic, WebGLEngineStateFull } from "../../engine.webgl.js";
import type { IDynamicTextureEngineExtension } from "./dynamicTexture.base.js";
import { augmentEngineState } from "../../engine.adapters.js";

export const createDynamicTexture: IDynamicTextureEngineExtension["createDynamicTexture"] = function (
    engineState: IWebGLEnginePublic,
    width: number,
    height: number,
    generateMipMaps: boolean,
    samplingMode: number
): InternalTexture {
    const fes = engineState as WebGLEngineStateFull;
    // TODO - make sure all needed functions are here, cache this if possible
    const engineAdapter = augmentEngineState(engineState, {
        _releaseTexture,
        getLoadedTexturesCache: (_engineState: IWebGLEnginePublic) => {
            return (_engineState as WebGLEngineStateFull)._internalTexturesCache;
        },
        createTexture,
    });
    const texture = new InternalTexture(engineAdapter, InternalTextureSource.Dynamic);
    texture.baseWidth = width;
    texture.baseHeight = height;

    if (generateMipMaps) {
        width = fes.needPOTTextures ? ThinEngine.GetExponentOfTwo(width, fes._caps.maxTextureSize) : width;
        height = fes.needPOTTextures ? ThinEngine.GetExponentOfTwo(height, fes._caps.maxTextureSize) : height;
    }

    //  this.resetTextureCache();
    texture.width = width;
    texture.height = height;
    texture.isReady = false;
    texture.generateMipMaps = generateMipMaps;
    texture.samplingMode = samplingMode;

    updateTextureSamplingMode(engineState, samplingMode, texture);

    fes._internalTexturesCache.push(texture);

    return texture;
};

export const updateDynamicTexture: IDynamicTextureEngineExtension["updateDynamicTexture"] = function (
    engineState: IWebGLEnginePublic,
    texture: Nullable<InternalTexture>,
    source: ImageBitmap | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | OffscreenCanvas,
    invertY?: boolean,
    premulAlpha: boolean = false,
    format?: number,
    forceBindTexture: boolean = false,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    allowGPUOptimization: boolean = false
): void {
    if (!texture) {
        return;
    }

    const fes = engineState as WebGLEngineStateFull;

    const gl = fes._gl;
    const target = gl.TEXTURE_2D;

    const wasPreviouslyBound = _bindTextureDirectly(engineState, target, texture, true, forceBindTexture);

    _unpackFlipY(fes, invertY === undefined ? texture.invertY : invertY);

    if (premulAlpha) {
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
    }

    const textureType = _getWebGLTextureType(fes, texture.type);
    const glformat = _getInternalFormat(fes, format ? format : texture.format);
    const internalFormat = _getRGBABufferInternalSizedFormat(fes, texture.type, glformat);

    gl.texImage2D(target, 0, internalFormat, glformat, textureType, source as TexImageSource);

    if (texture.generateMipMaps) {
        gl.generateMipmap(target);
    }

    if (!wasPreviouslyBound) {
        _bindTextureDirectly(fes, target, null);
    }

    if (premulAlpha) {
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
    }

    texture.isReady = true;
};

export const dynamicTextureEngineExtension: IDynamicTextureEngineExtension = {
    createDynamicTexture,
    updateDynamicTexture,
};

export default dynamicTextureEngineExtension;