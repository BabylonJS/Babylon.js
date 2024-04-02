import { InternalTexture, InternalTextureSource } from "../../../Materials/Textures/internalTexture";
import type { IWebRequest } from "../../../Misc/interfaces/iWebRequest";
import type { Nullable } from "../../../types";
import { Constants } from "../../constants";
import { WebGPUEngine } from "../../webgpuEngine";
import type { WebGPUHardwareTexture } from "../webgpuHardwareTexture";
import { Logger } from "../../../Misc/logger";

import type { Scene } from "../../../scene";

WebGPUEngine.prototype.createRawTexture = function (
    data: Nullable<ArrayBufferView>,
    width: number,
    height: number,
    format: number,
    generateMipMaps: boolean,
    invertY: boolean,
    samplingMode: number,
    compression: Nullable<string> = null,
    type: number = Constants.TEXTURETYPE_UNSIGNED_INT,
    creationFlags: number = 0,
    useSRGBBuffer: boolean = false
): InternalTexture {
    const texture = new InternalTexture(this, InternalTextureSource.Raw);
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
    texture._creationFlags = creationFlags;
    texture._useSRGBBuffer = useSRGBBuffer;

    if (!this._doNotHandleContextLost) {
        texture._bufferView = data;
    }

    this._textureHelper.createGPUTextureForInternalTexture(texture, width, height, undefined, creationFlags);

    this.updateRawTexture(texture, data, format, invertY, compression, type, useSRGBBuffer);

    this._internalTexturesCache.push(texture);

    return texture;
};

WebGPUEngine.prototype.updateRawTexture = function (
    texture: Nullable<InternalTexture>,
    bufferView: Nullable<ArrayBufferView>,
    format: number,
    invertY: boolean,
    compression: Nullable<string> = null,
    type: number = Constants.TEXTURETYPE_UNSIGNED_INT,
    useSRGBBuffer: boolean = false
): void {
    if (!texture) {
        return;
    }

    if (!this._doNotHandleContextLost) {
        texture._bufferView = bufferView;
        texture.invertY = invertY;
        texture._compression = compression;
        texture._useSRGBBuffer = useSRGBBuffer;
    }

    if (bufferView) {
        const gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;
        const needConversion = format === Constants.TEXTUREFORMAT_RGB;

        if (needConversion) {
            bufferView = _convertRGBtoRGBATextureData(bufferView, texture.width, texture.height, type);
        }

        const data = new Uint8Array(bufferView.buffer, bufferView.byteOffset, bufferView.byteLength);

        this._textureHelper.updateTexture(data, texture, texture.width, texture.height, texture.depth, gpuTextureWrapper.format, 0, 0, invertY, false, 0, 0);
        if (texture.generateMipMaps) {
            this._generateMipmaps(texture, this._uploadEncoder);
        }
    }

    texture.isReady = true;
};

WebGPUEngine.prototype.createRawCubeTexture = function (
    data: Nullable<ArrayBufferView[]>,
    size: number,
    format: number,
    type: number,
    generateMipMaps: boolean,
    invertY: boolean,
    samplingMode: number,
    compression: Nullable<string> = null
): InternalTexture {
    const texture = new InternalTexture(this, InternalTextureSource.CubeRaw);

    if (type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloatLinearFiltering) {
        generateMipMaps = false;
        samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        Logger.Warn("Float texture filtering is not supported. Mipmap generation and sampling mode are forced to false and TEXTURE_NEAREST_SAMPLINGMODE, respectively.");
    } else if (type === Constants.TEXTURETYPE_HALF_FLOAT && !this._caps.textureHalfFloatLinearFiltering) {
        generateMipMaps = false;
        samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        Logger.Warn("Half float texture filtering is not supported. Mipmap generation and sampling mode are forced to false and TEXTURE_NEAREST_SAMPLINGMODE, respectively.");
    } else if (type === Constants.TEXTURETYPE_FLOAT && !this._caps.textureFloatRender) {
        generateMipMaps = false;
        Logger.Warn("Render to float textures is not supported. Mipmap generation forced to false.");
    } else if (type === Constants.TEXTURETYPE_HALF_FLOAT && !this._caps.colorBufferFloat) {
        generateMipMaps = false;
        Logger.Warn("Render to half float textures is not supported. Mipmap generation forced to false.");
    }

    texture.isCube = true;
    texture._originalFormat = format;
    texture.format = format === Constants.TEXTUREFORMAT_RGB ? Constants.TEXTUREFORMAT_RGBA : format;
    texture.type = type;
    texture.generateMipMaps = generateMipMaps;
    texture.width = size;
    texture.height = size;
    texture.samplingMode = samplingMode;
    if (!this._doNotHandleContextLost) {
        texture._bufferViewArray = data;
    }
    texture.invertY = invertY;
    texture._compression = compression;
    texture._cachedWrapU = Constants.TEXTURE_CLAMP_ADDRESSMODE;
    texture._cachedWrapV = Constants.TEXTURE_CLAMP_ADDRESSMODE;

    this._textureHelper.createGPUTextureForInternalTexture(texture);

    if (data) {
        this.updateRawCubeTexture(texture, data, format, type, invertY, compression);
    }

    texture.isReady = true;

    return texture;
};

WebGPUEngine.prototype.updateRawCubeTexture = function (
    texture: InternalTexture,
    bufferView: ArrayBufferView[],
    format: number,
    type: number,
    invertY: boolean,
    compression: Nullable<string> = null
): void {
    texture._bufferViewArray = bufferView;
    texture.invertY = invertY;
    texture._compression = compression;

    const gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;
    const needConversion = format === Constants.TEXTUREFORMAT_RGB;

    const data = [];
    for (let i = 0; i < bufferView.length; ++i) {
        let faceData = bufferView[i];
        if (needConversion) {
            faceData = _convertRGBtoRGBATextureData(bufferView[i], texture.width, texture.height, type);
        }
        data.push(new Uint8Array(faceData.buffer, faceData.byteOffset, faceData.byteLength));
    }

    this._textureHelper.updateCubeTextures(data, gpuTextureWrapper.underlyingResource!, texture.width, texture.height, gpuTextureWrapper.format, invertY, false, 0, 0);
    if (texture.generateMipMaps) {
        this._generateMipmaps(texture, this._uploadEncoder);
    }

    texture.isReady = true;
};

WebGPUEngine.prototype.createRawCubeTextureFromUrl = function (
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
    samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
    invertY: boolean = false
): InternalTexture {
    const texture = this.createRawCubeTexture(null, size, format, type, !noMipmap, invertY, samplingMode, null);
    scene?.addPendingData(texture);
    texture.url = url;

    this._internalTexturesCache.push(texture);

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

        const faces = [0, 2, 4, 1, 3, 5];

        if (mipmapGenerator) {
            const needConversion = format === Constants.TEXTUREFORMAT_RGB;
            const mipData = mipmapGenerator(faceDataArrays);
            const gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;
            const faces = [0, 1, 2, 3, 4, 5];
            for (let level = 0; level < mipData.length; level++) {
                const mipSize = width >> level;
                const allFaces = [];
                for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
                    let mipFaceData = mipData[level][faces[faceIndex]];
                    if (needConversion) {
                        mipFaceData = _convertRGBtoRGBATextureData(mipFaceData, mipSize, mipSize, type);
                    }
                    allFaces.push(new Uint8Array(mipFaceData.buffer, mipFaceData.byteOffset, mipFaceData.byteLength));
                }
                this._textureHelper.updateCubeTextures(allFaces, gpuTextureWrapper.underlyingResource!, mipSize, mipSize, gpuTextureWrapper.format, invertY, false, 0, 0);
            }
        } else {
            const allFaces = [];
            for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
                allFaces.push(faceDataArrays[faces[faceIndex]]);
            }
            this.updateRawCubeTexture(texture, allFaces, format, type, invertY);
        }

        texture.isReady = true;
        scene?.removePendingData(texture);

        if (onLoad) {
            onLoad();
        }
    };

    this._loadFile(
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

WebGPUEngine.prototype.createRawTexture3D = function (
    data: Nullable<ArrayBufferView>,
    width: number,
    height: number,
    depth: number,
    format: number,
    generateMipMaps: boolean,
    invertY: boolean,
    samplingMode: number,
    compression: Nullable<string> = null,
    textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT,
    creationFlags: number = 0
): InternalTexture {
    const source = InternalTextureSource.Raw3D;
    const texture = new InternalTexture(this, source);

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
    texture.is3D = true;
    texture._creationFlags = creationFlags;

    if (!this._doNotHandleContextLost) {
        texture._bufferView = data;
    }

    this._textureHelper.createGPUTextureForInternalTexture(texture, width, height, undefined, creationFlags);

    this.updateRawTexture3D(texture, data, format, invertY, compression, textureType);

    this._internalTexturesCache.push(texture);

    return texture;
};

WebGPUEngine.prototype.updateRawTexture3D = function (
    texture: InternalTexture,
    bufferView: Nullable<ArrayBufferView>,
    format: number,
    invertY: boolean,
    compression: Nullable<string> = null,
    textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT
): void {
    if (!this._doNotHandleContextLost) {
        texture._bufferView = bufferView;
        texture.format = format;
        texture.invertY = invertY;
        texture._compression = compression;
    }

    if (bufferView) {
        const gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;
        const needConversion = format === Constants.TEXTUREFORMAT_RGB;

        if (needConversion) {
            bufferView = _convertRGBtoRGBATextureData(bufferView, texture.width, texture.height, textureType);
        }

        const data = new Uint8Array(bufferView.buffer, bufferView.byteOffset, bufferView.byteLength);

        this._textureHelper.updateTexture(data, texture, texture.width, texture.height, texture.depth, gpuTextureWrapper.format, 0, 0, invertY, false, 0, 0);
        if (texture.generateMipMaps) {
            this._generateMipmaps(texture, this._uploadEncoder);
        }
    }

    texture.isReady = true;
};

WebGPUEngine.prototype.createRawTexture2DArray = function (
    data: Nullable<ArrayBufferView>,
    width: number,
    height: number,
    depth: number,
    format: number,
    generateMipMaps: boolean,
    invertY: boolean,
    samplingMode: number,
    compression: Nullable<string> = null,
    textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT,
    creationFlags: number = 0
): InternalTexture {
    const source = InternalTextureSource.Raw2DArray;
    const texture = new InternalTexture(this, source);

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
    texture.is2DArray = true;
    texture._creationFlags = creationFlags;

    if (!this._doNotHandleContextLost) {
        texture._bufferView = data;
    }

    this._textureHelper.createGPUTextureForInternalTexture(texture, width, height, depth, creationFlags);

    this.updateRawTexture2DArray(texture, data, format, invertY, compression, textureType);

    this._internalTexturesCache.push(texture);

    return texture;
};

WebGPUEngine.prototype.updateRawTexture2DArray = function (
    texture: InternalTexture,
    bufferView: Nullable<ArrayBufferView>,
    format: number,
    invertY: boolean,
    compression: Nullable<string> = null,
    textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT
): void {
    if (!this._doNotHandleContextLost) {
        texture._bufferView = bufferView;
        texture.format = format;
        texture.invertY = invertY;
        texture._compression = compression;
    }

    if (bufferView) {
        const gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;
        const needConversion = format === Constants.TEXTUREFORMAT_RGB;

        if (needConversion) {
            bufferView = _convertRGBtoRGBATextureData(bufferView, texture.width, texture.height, textureType);
        }

        const data = new Uint8Array(bufferView.buffer, bufferView.byteOffset, bufferView.byteLength);

        this._textureHelper.updateTexture(data, texture, texture.width, texture.height, texture.depth, gpuTextureWrapper.format, 0, 0, invertY, false, 0, 0);
        if (texture.generateMipMaps) {
            this._generateMipmaps(texture, this._uploadEncoder);
        }
    }

    texture.isReady = true;
};

/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _convertRGBtoRGBATextureData(rgbData: any, width: number, height: number, textureType: number): ArrayBufferView {
    // Create new RGBA data container.
    let rgbaData: any;
    let val1 = 1;
    if (textureType === Constants.TEXTURETYPE_FLOAT) {
        rgbaData = new Float32Array(width * height * 4);
    } else if (textureType === Constants.TEXTURETYPE_HALF_FLOAT) {
        rgbaData = new Uint16Array(width * height * 4);
        val1 = 15360; // 15360 is the encoding of 1 in half float
    } else if (textureType === Constants.TEXTURETYPE_UNSIGNED_INTEGER) {
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
