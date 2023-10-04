import { InternalTexture, InternalTextureSource } from "core/Materials/Textures/internalTexture";
import type { Nullable } from "core/types";
import {
    _bindTextureDirectly,
    _getInternalFormat,
    _getRGBABufferInternalSizedFormat,
    _getSamplingParameters,
    _getUseSRGBBuffer,
    _getWebGLTextureType,
    _unpackFlipY,
    type IWebGLEnginePublic,
    type WebGLEngineStateFull,
} from "../../engine.webgl.js";
import {
    TEXTURETYPE_FLOAT,
    TEXTURETYPE_HALF_FLOAT,
    TEXTURETYPE_UNSIGNED_INT,
    TEXTURETYPE_UNSIGNED_INTEGER,
    TEXTURE_NEAREST_SAMPLINGMODE,
    TEXTURE_TRILINEAR_SAMPLINGMODE,
} from "../../engine.constants.js";
import { augmentEngineState } from "../../engine.adapters.js";
import { Logger } from "core/Misc/logger";
import { Tools } from "core/Misc/tools";
import type { Scene } from "core/scene";
import type { IWebRequest } from "core/Misc/interfaces/iWebRequest";
import { _loadFile } from "../../engine.tools.js";
import type { IRawTextureEngineExtension } from "../rawTexture/engine.rawTexture.base.js";

export const updateRawTexture: IRawTextureEngineExtension["updateRawTexture"] = function (
    engineState: IWebGLEnginePublic,
    texture: Nullable<InternalTexture>,
    data: Nullable<ArrayBufferView>,
    format: number,
    invertY: boolean,
    compression: Nullable<string> = null,
    type: number = TEXTURETYPE_UNSIGNED_INT,
    useSRGBBuffer: boolean = false
): void {
    if (!texture) {
        return;
    }
    const fes = engineState as WebGLEngineStateFull;
    // Babylon's internalSizedFomat but gl's texImage2D internalFormat
    const internalSizedFomat = _getRGBABufferInternalSizedFormat(fes, type, format, useSRGBBuffer);

    // Babylon's internalFormat but gl's texImage2D format
    const internalFormat = _getInternalFormat(fes, format);
    const textureType = _getWebGLTextureType(fes, type);
    _bindTextureDirectly(fes, fes._gl.TEXTURE_2D, texture, true);
    _unpackFlipY(fes, invertY === undefined ? true : invertY ? true : false);

    if (!fes.doNotHandleContextLost) {
        texture._bufferView = data;
        texture.format = format;
        texture.type = type;
        texture.invertY = invertY;
        texture._compression = compression;
    }

    if (texture.width % 4 !== 0) {
        fes._gl.pixelStorei(fes._gl.UNPACK_ALIGNMENT, 1);
    }

    if (compression && data) {
        fes._gl.compressedTexImage2D(fes._gl.TEXTURE_2D, 0, (<any>fes._caps.s3tc)[compression], texture.width, texture.height, 0, <DataView>data);
    } else {
        fes._gl.texImage2D(fes._gl.TEXTURE_2D, 0, internalSizedFomat, texture.width, texture.height, 0, internalFormat, textureType, data);
    }

    if (texture.generateMipMaps) {
        fes._gl.generateMipmap(fes._gl.TEXTURE_2D);
    }
    _bindTextureDirectly(fes, fes._gl.TEXTURE_2D, null);
    //  this.resetTextureCache();
    texture.isReady = true;
};

export const createRawTexture: IRawTextureEngineExtension["createRawTexture"] = function (
    engineState: IWebGLEnginePublic,
    data: Nullable<ArrayBufferView>,
    width: number,
    height: number,
    format: number,
    generateMipMaps: boolean,
    invertY: boolean,
    samplingMode: number,
    compression: Nullable<string> = null,
    type: number = TEXTURETYPE_UNSIGNED_INT,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    creationFlags = 0,
    useSRGBBuffer = false
): InternalTexture {
    const fes = engineState as WebGLEngineStateFull;
    const adapter = augmentEngineState(fes);
    const texture = new InternalTexture(adapter, InternalTextureSource.Raw);
    texture.baseWidth = width;
    texture.baseHeight = height;
    texture.width = width;
    texture.height = height;
    texture.format = format;
    texture.generateMipMaps = generateMipMaps;
    texture.samplingMode = samplingMode;
    texture.invertY = invertY;
    texture._compression = compression;
    texture.type = type;
    texture._useSRGBBuffer = _getUseSRGBBuffer(fes, useSRGBBuffer, !generateMipMaps);

    if (!fes.doNotHandleContextLost) {
        texture._bufferView = data;
    }

    updateRawTexture(fes, texture, data, format, invertY, compression, type, texture._useSRGBBuffer);
    _bindTextureDirectly(fes, fes._gl.TEXTURE_2D, texture, true);

    // Filters
    const filters = _getSamplingParameters(fes, samplingMode, generateMipMaps);

    fes._gl.texParameteri(fes._gl.TEXTURE_2D, fes._gl.TEXTURE_MAG_FILTER, filters.mag);
    fes._gl.texParameteri(fes._gl.TEXTURE_2D, fes._gl.TEXTURE_MIN_FILTER, filters.min);

    if (generateMipMaps) {
        fes._gl.generateMipmap(fes._gl.TEXTURE_2D);
    }

    _bindTextureDirectly(fes, fes._gl.TEXTURE_2D, null);

    fes._internalTexturesCache.push(texture);

    return texture;
};

export const createRawCubeTexture: IRawTextureEngineExtension["createRawCubeTexture"] = function (
    engineState: IWebGLEnginePublic,
    data: Nullable<ArrayBufferView[]>,
    size: number,
    format: number,
    type: number,
    generateMipMaps: boolean,
    invertY: boolean,
    samplingMode: number,
    compression: Nullable<string> = null
): InternalTexture {
    const fes = engineState as WebGLEngineStateFull;
    const adapter = augmentEngineState(fes);
    const gl = fes._gl;
    const texture = new InternalTexture(adapter, InternalTextureSource.CubeRaw);
    texture.isCube = true;
    texture.format = format;
    texture.type = type;
    if (!fes.doNotHandleContextLost) {
        texture._bufferViewArray = data;
    }

    const textureType = _getWebGLTextureType(fes, type);
    let internalFormat = _getInternalFormat(fes, format);

    if (internalFormat === gl.RGB) {
        internalFormat = gl.RGBA;
    }

    // Mipmap generation needs a sized internal format that is both color-renderable and texture-filterable
    if (textureType === gl.FLOAT && !fes._caps.textureFloatLinearFiltering) {
        generateMipMaps = false;
        samplingMode = TEXTURE_NEAREST_SAMPLINGMODE;
        Logger.Warn("Float texture filtering is not supported. Mipmap generation and sampling mode are forced to false and TEXTURE_NEAREST_SAMPLINGMODE, respectively.");
    } else if (textureType === fes._gl.HALF_FLOAT_OES && !fes._caps.textureHalfFloatLinearFiltering) {
        generateMipMaps = false;
        samplingMode = TEXTURE_NEAREST_SAMPLINGMODE;
        Logger.Warn("Half float texture filtering is not supported. Mipmap generation and sampling mode are forced to false and TEXTURE_NEAREST_SAMPLINGMODE, respectively.");
    } else if (textureType === gl.FLOAT && !fes._caps.textureFloatRender) {
        generateMipMaps = false;
        Logger.Warn("Render to float textures is not supported. Mipmap generation forced to false.");
    } else if (textureType === gl.HALF_FLOAT && !fes._caps.colorBufferFloat) {
        generateMipMaps = false;
        Logger.Warn("Render to half float textures is not supported. Mipmap generation forced to false.");
    }

    const width = size;
    const height = width;

    texture.width = width;
    texture.height = height;
    texture.invertY = invertY;
    texture._compression = compression;

    // Double check on POT to generate Mips.
    const isPot = !fes.needPOTTextures || (Tools.IsExponentOfTwo(texture.width) && Tools.IsExponentOfTwo(texture.height));
    if (!isPot) {
        generateMipMaps = false;
    }

    // Upload data if needed. The texture won't be ready until then.
    if (data) {
        updateRawCubeTexture(fes, texture, data, format, type, invertY, compression);
    } else {
        const internalSizedFomat = _getRGBABufferInternalSizedFormat(fes, type);
        const level = 0;

        _bindTextureDirectly(fes, gl.TEXTURE_CUBE_MAP, texture, true);

        for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
            if (compression) {
                gl.compressedTexImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex, level, (<any>fes._caps.s3tc)[compression], texture.width, texture.height, 0, undefined as any);
            } else {
                gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex, level, internalSizedFomat, texture.width, texture.height, 0, internalFormat, textureType, null);
            }
        }

        _bindTextureDirectly(fes, fes._gl.TEXTURE_CUBE_MAP, null);
    }

    _bindTextureDirectly(fes, fes._gl.TEXTURE_CUBE_MAP, texture, true);

    // Filters
    if (data && generateMipMaps) {
        fes._gl.generateMipmap(fes._gl.TEXTURE_CUBE_MAP);
    }

    const filters = _getSamplingParameters(fes, samplingMode, generateMipMaps);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, filters.mag);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, filters.min);

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    _bindTextureDirectly(fes, gl.TEXTURE_CUBE_MAP, null);

    texture.generateMipMaps = generateMipMaps;
    texture.samplingMode = samplingMode;
    texture.isReady = true;

    return texture;
};

export const updateRawCubeTexture: IRawTextureEngineExtension["updateRawCubeTexture"] = function (
    engineState: IWebGLEnginePublic,
    texture: InternalTexture,
    data: ArrayBufferView[],
    format: number,
    type: number,
    invertY: boolean,
    compression: Nullable<string> = null,
    level: number = 0
): void {
    const fes = engineState as WebGLEngineStateFull;
    texture._bufferViewArray = data;
    texture.format = format;
    texture.type = type;
    texture.invertY = invertY;
    texture._compression = compression;

    const gl = fes._gl;
    const textureType = _getWebGLTextureType(fes, type);
    let internalFormat = _getInternalFormat(fes, format);
    const internalSizedFomat = _getRGBABufferInternalSizedFormat(fes, type);

    let needConversion = false;
    if (internalFormat === gl.RGB) {
        internalFormat = gl.RGBA;
        needConversion = true;
    }

    _bindTextureDirectly(fes, gl.TEXTURE_CUBE_MAP, texture, true);
    _unpackFlipY(fes, invertY === undefined ? true : invertY ? true : false);

    if (texture.width % 4 !== 0) {
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    }

    // Data are known to be in +X +Y +Z -X -Y -Z
    for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
        let faceData = data[faceIndex];

        if (compression) {
            gl.compressedTexImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex, level, (<any>fes._caps.s3tc)[compression], texture.width, texture.height, 0, <DataView>faceData);
        } else {
            if (needConversion) {
                faceData = _convertRGBtoRGBATextureData(faceData, texture.width, texture.height, type);
            }
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex, level, internalSizedFomat, texture.width, texture.height, 0, internalFormat, textureType, faceData);
        }
    }

    const isPot = !fes.needPOTTextures || (Tools.IsExponentOfTwo(texture.width) && Tools.IsExponentOfTwo(texture.height));
    if (isPot && texture.generateMipMaps && level === 0) {
        fes._gl.generateMipmap(fes._gl.TEXTURE_CUBE_MAP);
    }
    _bindTextureDirectly(fes, fes._gl.TEXTURE_CUBE_MAP, null);

    texture.isReady = true;
};

export const createRawCubeTextureFromUrl: IRawTextureEngineExtension["createRawCubeTextureFromUrl"] = function (
    engineState: IWebGLEnginePublic,
    url: string,
    scene: Nullable<Scene>,
    size: number,
    format: number,
    type: number,
    noMipmap: boolean,
    callback: (ArrayBuffer: ArrayBuffer) => Nullable<ArrayBufferView[]>,
    mipmapGenerator: Nullable<(faces: ArrayBufferView[]) => ArrayBufferView[][]>,
    onLoad: Nullable<() => void> = null,
    onError: Nullable<(message?: string, exception?: any) => void> = null,
    samplingMode: number = TEXTURE_TRILINEAR_SAMPLINGMODE,
    invertY: boolean = false
): InternalTexture {
    const fes = engineState as WebGLEngineStateFull;
    const gl = fes._gl;
    const texture = createRawCubeTexture(fes, null, size, format, type, !noMipmap, invertY, samplingMode, null);
    scene?.addPendingData(texture);
    texture.url = url;
    texture.isReady = false;
    fes._internalTexturesCache.push(texture);

    const onerror = (request?: IWebRequest, exception?: any) => {
        scene?.removePendingData(texture);
        if (onError && request) {
            onError(request.status + " " + request.statusText, exception);
        }
    };

    const internalCallback = (data: any) => {
        const width = texture.width;
        const faceDataArrays = callback(data);

        if (!faceDataArrays) {
            return;
        }

        if (mipmapGenerator) {
            const textureType = _getWebGLTextureType(fes, type);
            let internalFormat = _getInternalFormat(fes, format);
            const internalSizedFomat = _getRGBABufferInternalSizedFormat(fes, type);

            let needConversion = false;
            if (internalFormat === gl.RGB) {
                internalFormat = gl.RGBA;
                needConversion = true;
            }

            _bindTextureDirectly(fes, gl.TEXTURE_CUBE_MAP, texture, true);
            _unpackFlipY(fes, false);

            const mipData = mipmapGenerator(faceDataArrays);
            for (let level = 0; level < mipData.length; level++) {
                const mipSize = width >> level;

                for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
                    let mipFaceData = mipData[level][faceIndex];
                    if (needConversion) {
                        mipFaceData = _convertRGBtoRGBATextureData(mipFaceData, mipSize, mipSize, type);
                    }
                    gl.texImage2D(faceIndex, level, internalSizedFomat, mipSize, mipSize, 0, internalFormat, textureType, mipFaceData);
                }
            }

            _bindTextureDirectly(fes, gl.TEXTURE_CUBE_MAP, null);
        } else {
            updateRawCubeTexture(fes, texture, faceDataArrays, format, type, invertY);
        }

        texture.isReady = true;
        // this.resetTextureCache();
        scene?.removePendingData(texture);

        texture.onLoadedObservable.notifyObservers(texture);
        texture.onLoadedObservable.clear();

        if (onLoad) {
            onLoad();
        }
    };

    _loadFile(
        fes,
        url,
        (data) => {
            internalCallback(data);
        },
        undefined,
        scene?.offlineProvider,
        true,
        onerror
    );

    return texture;
};

/**
 * @internal
 */
function _convertRGBtoRGBATextureData(rgbData: any, width: number, height: number, textureType: number): ArrayBufferView {
    // Create new RGBA data container.
    let rgbaData: any;
    let val1 = 1;
    if (textureType === TEXTURETYPE_FLOAT) {
        rgbaData = new Float32Array(width * height * 4);
    } else if (textureType === TEXTURETYPE_HALF_FLOAT) {
        rgbaData = new Uint16Array(width * height * 4);
        val1 = 15360; // 15360 is the encoding of 1 in half float
    } else if (textureType === TEXTURETYPE_UNSIGNED_INTEGER) {
        rgbaData = new Uint32Array(width * height * 4);
    } else {
        rgbaData = new Uint8Array(width * height * 4);
    }

    // Convert each pixel.
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            const index = (y * width + x) * 3;
            const newIndex = (y * width + x) * 4;

            // Map Old Value to new value.
            rgbaData[newIndex + 0] = rgbData[index + 0];
            rgbaData[newIndex + 1] = rgbData[index + 1];
            rgbaData[newIndex + 2] = rgbData[index + 2];

            // Add fully opaque alpha channel.
            rgbaData[newIndex + 3] = val1;
        }
    }

    return rgbaData;
}

/**
 * Create a function for createRawTexture3D/createRawTexture2DArray
 * @param is3D true for TEXTURE_3D and false for TEXTURE_2D_ARRAY
 * @internal
 */
function _makeCreateRawTextureFunction(
    is3D: boolean,
    engineState: IWebGLEnginePublic,
    data: Nullable<ArrayBufferView>,
    width: number,
    height: number,
    depth: number,
    format: number,
    generateMipMaps: boolean,
    invertY: boolean,
    samplingMode: number,
    compression: Nullable<string> = null,
    textureType: number = TEXTURETYPE_UNSIGNED_INT
): InternalTexture {
    const fes = engineState as WebGLEngineStateFull;
    const target = is3D ? fes._gl.TEXTURE_3D : fes._gl.TEXTURE_2D_ARRAY;
    const source = is3D ? InternalTextureSource.Raw3D : InternalTextureSource.Raw2DArray;
    const adapter = augmentEngineState(fes);
    const texture = new InternalTexture(adapter, source);
    texture.baseWidth = width;
    texture.baseHeight = height;
    texture.baseDepth = depth;
    texture.width = width;
    texture.height = height;
    texture.depth = depth;
    texture.format = format;
    texture.type = textureType;
    texture.generateMipMaps = generateMipMaps;
    texture.samplingMode = samplingMode;
    if (is3D) {
        texture.is3D = true;
    } else {
        texture.is2DArray = true;
    }

    if (!fes.doNotHandleContextLost) {
        texture._bufferView = data;
    }

    if (is3D) {
        updateRawTexture3D(fes, texture, data, format, invertY, compression, textureType);
    } else {
        updateRawTexture2DArray(fes, texture, data, format, invertY, compression, textureType);
    }
    _bindTextureDirectly(fes, target, texture, true);

    // Filters
    const filters = _getSamplingParameters(fes, samplingMode, generateMipMaps);

    fes._gl.texParameteri(target, fes._gl.TEXTURE_MAG_FILTER, filters.mag);
    fes._gl.texParameteri(target, fes._gl.TEXTURE_MIN_FILTER, filters.min);

    if (generateMipMaps) {
        fes._gl.generateMipmap(target);
    }

    _bindTextureDirectly(fes, target, null);

    fes._internalTexturesCache.push(texture);

    return texture;
}

export const createRawTexture2DArray: (
    engineState: IWebGLEnginePublic,
    data: Nullable<ArrayBufferView>,
    width: number,
    height: number,
    depth: number,
    format: number,
    generateMipMaps: boolean,
    invertY: boolean,
    samplingMode: number,
    compression?: Nullable<string>,
    textureType?: number
) => InternalTexture = _makeCreateRawTextureFunction.bind(null, false);
export const createRawTexture3D: (
    engineState: IWebGLEnginePublic,
    data: Nullable<ArrayBufferView>,
    width: number,
    height: number,
    depth: number,
    format: number,
    generateMipMaps: boolean,
    invertY: boolean,
    samplingMode: number,
    compression?: Nullable<string>,
    textureType?: number
) => InternalTexture = _makeCreateRawTextureFunction.bind(null, true);

/**
 * Create a function for updateRawTexture3D/updateRawTexture2DArray
 * @param is3D true for TEXTURE_3D and false for TEXTURE_2D_ARRAY
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _makeUpdateRawTextureFunction(
    is3D: boolean,
    engineState: IWebGLEnginePublic,
    texture: InternalTexture,
    data: Nullable<ArrayBufferView>,
    format: number,
    invertY: boolean,
    compression: Nullable<string> = null,
    textureType: number = TEXTURETYPE_UNSIGNED_INT
): void {
    const fes = engineState as WebGLEngineStateFull;
    const target = is3D ? fes._gl.TEXTURE_3D : fes._gl.TEXTURE_2D_ARRAY;
    const internalType = _getWebGLTextureType(fes, textureType);
    const internalFormat = _getInternalFormat(fes, format);
    const internalSizedFomat = _getRGBABufferInternalSizedFormat(fes, textureType, format);

    _bindTextureDirectly(fes, target, texture, true);
    _unpackFlipY(fes, invertY === undefined ? true : invertY ? true : false);

    if (!fes.doNotHandleContextLost) {
        texture._bufferView = data;
        texture.format = format;
        texture.invertY = invertY;
        texture._compression = compression;
    }

    if (texture.width % 4 !== 0) {
        fes._gl.pixelStorei(fes._gl.UNPACK_ALIGNMENT, 1);
    }

    if (compression && data) {
        fes._gl.compressedTexImage3D(target, 0, (<any>fes._caps.s3tc)[compression], texture.width, texture.height, texture.depth, 0, data);
    } else {
        fes._gl.texImage3D(target, 0, internalSizedFomat, texture.width, texture.height, texture.depth, 0, internalFormat, internalType, data);
    }

    if (texture.generateMipMaps) {
        fes._gl.generateMipmap(target);
    }
    _bindTextureDirectly(fes, target, null);
    // this.resetTextureCache();
    texture.isReady = true;
}

export const updateRawTexture2DArray: (
    engineState: IWebGLEnginePublic,
    texture: InternalTexture,
    data: Nullable<ArrayBufferView>,
    format: number,
    invertY: boolean,
    compression?: Nullable<string>,
    textureType?: number
) => void = _makeUpdateRawTextureFunction.bind(null, false);
export const updateRawTexture3D: (
    engineState: IWebGLEnginePublic,
    texture: InternalTexture,
    data: Nullable<ArrayBufferView>,
    format: number,
    invertY: boolean,
    compression?: Nullable<string>,
    textureType?: number
) => void = _makeUpdateRawTextureFunction.bind(null, true);

export default {
    createRawTexture,
    createRawCubeTexture,
    createRawCubeTextureFromUrl,
    createRawTexture2DArray,
    createRawTexture3D,
    updateRawTexture,
    updateRawCubeTexture,
    updateRawTexture2DArray,
    updateRawTexture3D,
};
