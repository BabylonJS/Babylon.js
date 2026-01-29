import { InternalTexture, InternalTextureSource } from "../../../Materials/Textures/internalTexture";
import type { IWebRequest } from "../../../Misc/interfaces/iWebRequest";
import type { Nullable } from "../../../types";
import { Constants } from "../../constants";
import type { WebGPUHardwareTexture } from "../webgpuHardwareTexture";
import { Logger } from "../../../Misc/logger";

import type { Scene } from "../../../scene";
import { ThinWebGPUEngine } from "core/Engines/thinWebGPUEngine";

declare module "../../abstractEngine" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /**
         * Update a raw texture
         * @param texture defines the texture to update
         * @param data defines the data to store in the texture
         * @param format defines the format of the data
         * @param invertY defines if data must be stored with Y axis inverted
         */
        updateRawTexture(texture: Nullable<InternalTexture>, data: Nullable<ArrayBufferView>, format: number, invertY: boolean): void;

        /**
         * Update a raw texture
         * @param texture defines the texture to update
         * @param data defines the data to store in the texture
         * @param format defines the format of the data
         * @param invertY defines if data must be stored with Y axis inverted
         * @param compression defines the compression used (null by default)
         * @param type defines the type fo the data (Engine.TEXTURETYPE_UNSIGNED_BYTE by default)
         * @param useSRGBBuffer defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU).
         * @param mipLevel defines which mipLevel of the texture is going to be updated
         */
        updateRawTexture(
            texture: Nullable<InternalTexture>,
            data: Nullable<ArrayBufferView>,
            format: number,
            invertY: boolean,
            compression: Nullable<string>,
            type: number,
            useSRGBBuffer: boolean,
            mipLevel?: number
        ): void;

        /**
         * Creates a new raw cube texture
         * @param data defines the array of data to use to create each face
         * @param size defines the size of the textures
         * @param format defines the format of the data
         * @param type defines the type of the data (like Engine.TEXTURETYPE_UNSIGNED_BYTE)
         * @param generateMipMaps  defines if the engine should generate the mip levels
         * @param invertY defines if data must be stored with Y axis inverted
         * @param samplingMode defines the required sampling mode (like Texture.NEAREST_SAMPLINGMODE)
         * @param compression defines the compression used (null by default)
         * @returns the cube texture as an InternalTexture
         */
        createRawCubeTexture(
            data: Nullable<ArrayBufferView[]>,
            size: number,
            format: number,
            type: number,
            generateMipMaps: boolean,
            invertY: boolean,
            samplingMode: number,
            compression: Nullable<string>
        ): InternalTexture;

        /**
         * Update a raw cube texture
         * @param texture defines the texture to update
         * @param data defines the data to store
         * @param format defines the data format
         * @param type defines the type fo the data (Engine.TEXTURETYPE_UNSIGNED_BYTE by default)
         * @param invertY defines if data must be stored with Y axis inverted
         */
        updateRawCubeTexture(texture: InternalTexture, data: ArrayBufferView[], format: number, type: number, invertY: boolean): void;

        /**
         * Update a raw cube texture
         * @param texture defines the texture to update
         * @param data defines the data to store
         * @param format defines the data format
         * @param type defines the type fo the data (Engine.TEXTURETYPE_UNSIGNED_BYTE by default)
         * @param invertY defines if data must be stored with Y axis inverted
         * @param compression defines the compression used (null by default)
         */
        updateRawCubeTexture(texture: InternalTexture, data: ArrayBufferView[], format: number, type: number, invertY: boolean, compression: Nullable<string>): void;

        /**
         * Update a raw cube texture
         * @param texture defines the texture to update
         * @param data defines the data to store
         * @param format defines the data format
         * @param type defines the type fo the data (Engine.TEXTURETYPE_UNSIGNED_BYTE by default)
         * @param invertY defines if data must be stored with Y axis inverted
         * @param compression defines the compression used (null by default)
         * @param level defines which level of the texture to update
         */
        updateRawCubeTexture(texture: InternalTexture, data: ArrayBufferView[], format: number, type: number, invertY: boolean, compression: Nullable<string>, level: number): void;

        /**
         * Creates a new raw cube texture from a specified url
         * @param url defines the url where the data is located
         * @param scene defines the current scene
         * @param size defines the size of the textures
         * @param format defines the format of the data
         * @param type defines the type fo the data (like Engine.TEXTURETYPE_UNSIGNED_BYTE)
         * @param noMipmap defines if the engine should avoid generating the mip levels
         * @param callback defines a callback used to extract texture data from loaded data
         * @param mipmapGenerator defines to provide an optional tool to generate mip levels
         * @param onLoad defines a callback called when texture is loaded
         * @param onError defines a callback called if there is an error
         * @returns the cube texture as an InternalTexture
         */
        createRawCubeTextureFromUrl(
            url: string,
            scene: Nullable<Scene>,
            size: number,
            format: number,
            type: number,
            noMipmap: boolean,
            callback: (ArrayBuffer: ArrayBuffer) => Nullable<ArrayBufferView[] | Promise<ArrayBufferView[]>>,
            mipmapGenerator: Nullable<(faces: ArrayBufferView[]) => ArrayBufferView[][]>,
            onLoad: Nullable<() => void>,
            onError: Nullable<(message?: string, exception?: any) => void>
        ): InternalTexture;

        /**
         * Creates a new raw cube texture from a specified url
         * @param url defines the url where the data is located
         * @param scene defines the current scene
         * @param size defines the size of the textures
         * @param format defines the format of the data
         * @param type defines the type fo the data (like Engine.TEXTURETYPE_UNSIGNED_BYTE)
         * @param noMipmap defines if the engine should avoid generating the mip levels
         * @param callback defines a callback used to extract texture data from loaded data
         * @param mipmapGenerator defines to provide an optional tool to generate mip levels
         * @param onLoad defines a callback called when texture is loaded
         * @param onError defines a callback called if there is an error
         * @param samplingMode defines the required sampling mode (like Texture.NEAREST_SAMPLINGMODE)
         * @param invertY defines if data must be stored with Y axis inverted
         * @returns the cube texture as an InternalTexture
         */
        createRawCubeTextureFromUrl(
            url: string,
            scene: Nullable<Scene>,
            size: number,
            format: number,
            type: number,
            noMipmap: boolean,
            callback: (ArrayBuffer: ArrayBuffer) => Nullable<ArrayBufferView[] | Promise<ArrayBufferView[]>>,
            mipmapGenerator: Nullable<(faces: ArrayBufferView[]) => ArrayBufferView[][]>,
            onLoad: Nullable<() => void>,
            onError: Nullable<(message?: string, exception?: any) => void>,
            samplingMode: number,
            invertY: boolean
        ): InternalTexture;

        /**
         * Update a raw 3D texture
         * @param texture defines the texture to update
         * @param data defines the data to store
         * @param format defines the data format
         * @param invertY defines if data must be stored with Y axis inverted
         */
        updateRawTexture3D(texture: InternalTexture, data: Nullable<ArrayBufferView>, format: number, invertY: boolean): void;

        /**
         * Update a raw 3D texture
         * @param texture defines the texture to update
         * @param data defines the data to store
         * @param format defines the data format
         * @param invertY defines if data must be stored with Y axis inverted
         * @param compression defines the used compression (can be null)
         * @param textureType defines the texture Type (Engine.TEXTURETYPE_UNSIGNED_BYTE, Engine.TEXTURETYPE_FLOAT...)
         */
        updateRawTexture3D(texture: InternalTexture, data: Nullable<ArrayBufferView>, format: number, invertY: boolean, compression: Nullable<string>, textureType: number): void;

        /**
         * Update a raw 2D array texture
         * @param texture defines the texture to update
         * @param data defines the data to store
         * @param format defines the data format
         * @param invertY defines if data must be stored with Y axis inverted
         */
        updateRawTexture2DArray(texture: InternalTexture, data: Nullable<ArrayBufferView>, format: number, invertY: boolean): void;

        /**
         * Update a raw 2D array texture
         * @param texture defines the texture to update
         * @param data defines the data to store
         * @param format defines the data format
         * @param invertY defines if data must be stored with Y axis inverted
         * @param compression defines the used compression (can be null)
         * @param textureType defines the texture Type (Engine.TEXTURETYPE_UNSIGNED_BYTE, Engine.TEXTURETYPE_FLOAT...)
         */
        updateRawTexture2DArray(
            texture: InternalTexture,
            data: Nullable<ArrayBufferView>,
            format: number,
            invertY: boolean,
            compression: Nullable<string>,
            textureType: number
        ): void;

        /**
         * Update a raw 2D array texture
         * @param texture defines the texture to update
         * @param data defines the data to store
         * @param format defines the data format
         * @param invertY defines if data must be stored with Y axis inverted
         * @param compression defines the used compression (can be null)
         * @param textureType defines the texture Type (Engine.TEXTURETYPE_UNSIGNED_BYTE, Engine.TEXTURETYPE_FLOAT...)
         * @param mipLevel defines which mipLevel of the texture is going to be updated
         */
        updateRawTexture2DArray(
            texture: InternalTexture,
            data: Nullable<ArrayBufferView>,
            format: number,
            invertY: boolean,
            compression: Nullable<string>,
            textureType: number,
            mipLevel?: number
        ): void;
    }
}

ThinWebGPUEngine.prototype.createRawTexture = function (
    data: Nullable<ArrayBufferView>,
    width: number,
    height: number,
    format: number,
    generateMipMaps: boolean,
    invertY: boolean,
    samplingMode: number,
    compression: Nullable<string> = null,
    type: number = Constants.TEXTURETYPE_UNSIGNED_BYTE,
    creationFlags: number = 0,
    useSRGBBuffer: boolean = false,
    mipLevelCount?: number
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

    this._textureHelper.updateMipLevelCountForInternalTexture(texture, mipLevelCount);
    this._textureHelper.createGPUTextureForInternalTexture(texture, width, height, undefined, creationFlags);

    this.updateRawTexture(texture, data, format, invertY, compression, type, useSRGBBuffer);

    this._internalTexturesCache.push(texture);

    return texture;
};

ThinWebGPUEngine.prototype.updateRawTexture = function (
    texture: Nullable<InternalTexture>,
    bufferView: Nullable<ArrayBufferView>,
    format: number,
    invertY: boolean,
    compression: Nullable<string> = null,
    type: number = Constants.TEXTURETYPE_UNSIGNED_BYTE,
    useSRGBBuffer: boolean = false,
    mipLevel?: number
): void {
    if (!texture) {
        return;
    }

    if (!this._doNotHandleContextLost) {
        texture._bufferView = bufferView;
        texture.invertY = invertY;
        texture._compression = compression;
        texture._useSRGBBuffer = useSRGBBuffer;
        if (mipLevel !== undefined && bufferView) {
            if (!texture._bufferViewArray) {
                texture._bufferViewArray = new Array(texture.mipLevelCount);
            }
            texture._bufferViewArray[mipLevel] = bufferView;
        }
    }

    if (bufferView) {
        const gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;
        const needConversion = format === Constants.TEXTUREFORMAT_RGB;

        if (needConversion) {
            bufferView = ConvertRGBtoRGBATextureData(bufferView, texture.width, texture.height, type);
        }

        const data = new Uint8Array(bufferView.buffer, bufferView.byteOffset, bufferView.byteLength);

        const mipWidth = Math.max(1, texture.width >> (mipLevel ?? 0));
        const mipHeight = Math.max(1, texture.height >> (mipLevel ?? 0));
        this._textureHelper.updateTexture(data, texture, mipWidth, mipHeight, texture.depth, gpuTextureWrapper.format, 0, mipLevel ?? 0, invertY, false, 0, 0);
        if (texture.generateMipMaps && !mipLevel) {
            this._generateMipmaps(texture, this._uploadEncoder);
        }
    }

    texture.isReady = true;
};

ThinWebGPUEngine.prototype.createRawCubeTexture = function (
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

    if (format === Constants.TEXTUREFORMAT_RGB) {
        const gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;
        gpuTextureWrapper._originalFormatIsRGB = true;
    }

    if (data) {
        this.updateRawCubeTexture(texture, data, format, type, invertY, compression);
    }

    texture.isReady = true;

    return texture;
};

ThinWebGPUEngine.prototype.updateRawCubeTexture = function (
    texture: InternalTexture,
    bufferView: ArrayBufferView[],
    _format: number,
    type: number,
    invertY: boolean,
    compression: Nullable<string> = null
): void {
    texture._bufferViewArray = bufferView;
    texture.invertY = invertY;
    texture._compression = compression;

    const gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;
    const needConversion = gpuTextureWrapper._originalFormatIsRGB;

    const faces = [0, 2, 4, 1, 3, 5];

    const data = [];
    for (let i = 0; i < bufferView.length; ++i) {
        let faceData = bufferView[faces[i]];
        if (needConversion) {
            faceData = ConvertRGBtoRGBATextureData(faceData, texture.width, texture.height, type);
        }
        data.push(new Uint8Array(faceData.buffer, faceData.byteOffset, faceData.byteLength));
    }

    this._textureHelper.updateCubeTextures(data, gpuTextureWrapper.underlyingResource!, texture.width, texture.height, gpuTextureWrapper.format, invertY, false, 0, 0);
    if (texture.generateMipMaps) {
        this._generateMipmaps(texture, this._uploadEncoder);
    }

    texture.isReady = true;
};

ThinWebGPUEngine.prototype.createRawCubeTextureFromUrl = function (
    url: string,
    scene: Nullable<Scene>,
    size: number,
    format: number,
    type: number,
    noMipmap: boolean,
    callback: (ArrayBuffer: ArrayBuffer) => Nullable<ArrayBufferView[] | Promise<ArrayBufferView[]>>,
    mipmapGenerator: Nullable<(faces: ArrayBufferView[]) => ArrayBufferView[][]>,
    onLoad: Nullable<() => void> = null,
    onError: Nullable<(message?: string, exception?: any) => void> = null,
    samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
    invertY: boolean = false
): InternalTexture {
    const texture = this.createRawCubeTexture(null, size, format, type, !noMipmap, invertY, samplingMode, null);
    scene?.addPendingData(texture);
    texture.url = url;
    texture.isReady = false;

    this._internalTexturesCache.push(texture);

    const onerror = (request?: IWebRequest, exception?: any) => {
        scene?.removePendingData(texture);
        if (onError && request) {
            onError(request.status + " " + request.statusText, exception);
        }
    };

    const internalCallbackAsync = async (data: any) => {
        const faceDataArraysResult = callback(data);
        if (!faceDataArraysResult) {
            return;
        }

        const faceDataArrays: any = faceDataArraysResult instanceof Promise ? await faceDataArraysResult : faceDataArraysResult;
        const width = texture.width;

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
                        mipFaceData = ConvertRGBtoRGBATextureData(mipFaceData, mipSize, mipSize, type);
                    }
                    allFaces.push(new Uint8Array(mipFaceData.buffer, mipFaceData.byteOffset, mipFaceData.byteLength));
                }
                this._textureHelper.updateCubeTextures(allFaces, gpuTextureWrapper.underlyingResource!, mipSize, mipSize, gpuTextureWrapper.format, invertY, false, 0, 0);
            }
        } else {
            this.updateRawCubeTexture(texture, faceDataArrays, format, type, invertY);
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
            // eslint-disable-next-line github/no-then
            internalCallbackAsync(data).catch((err) => {
                onerror(undefined, err);
            });
        },
        undefined,
        scene?.offlineProvider,
        true,
        onerror
    );

    return texture;
};

ThinWebGPUEngine.prototype.createRawTexture3D = function (
    data: Nullable<ArrayBufferView>,
    width: number,
    height: number,
    depth: number,
    format: number,
    generateMipMaps: boolean,
    invertY: boolean,
    samplingMode: number,
    compression: Nullable<string> = null,
    textureType: number = Constants.TEXTURETYPE_UNSIGNED_BYTE,
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

ThinWebGPUEngine.prototype.updateRawTexture3D = function (
    texture: InternalTexture,
    bufferView: Nullable<ArrayBufferView>,
    format: number,
    invertY: boolean,
    compression: Nullable<string> = null,
    textureType: number = Constants.TEXTURETYPE_UNSIGNED_BYTE
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
            bufferView = ConvertRGBtoRGBATextureData(bufferView, texture.width, texture.height, textureType);
        }

        const data = new Uint8Array(bufferView.buffer, bufferView.byteOffset, bufferView.byteLength);

        this._textureHelper.updateTexture(data, texture, texture.width, texture.height, texture.depth, gpuTextureWrapper.format, 0, 0, invertY, false, 0, 0);
        if (texture.generateMipMaps) {
            this._generateMipmaps(texture, this._uploadEncoder);
        }
    }

    texture.isReady = true;
};

ThinWebGPUEngine.prototype.createRawTexture2DArray = function (
    data: Nullable<ArrayBufferView>,
    width: number,
    height: number,
    depth: number,
    format: number,
    generateMipMaps: boolean,
    invertY: boolean,
    samplingMode: number,
    compression: Nullable<string> = null,
    textureType: number = Constants.TEXTURETYPE_UNSIGNED_BYTE,
    creationFlags: number = 0,
    mipLevelCount?: number
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

    this._textureHelper.updateMipLevelCountForInternalTexture(texture, mipLevelCount);
    this._textureHelper.createGPUTextureForInternalTexture(texture, width, height, depth, creationFlags);

    this.updateRawTexture2DArray(texture, data, format, invertY, compression, textureType);

    this._internalTexturesCache.push(texture);

    return texture;
};

ThinWebGPUEngine.prototype.updateRawTexture2DArray = function (
    texture: InternalTexture,
    bufferView: Nullable<ArrayBufferView>,
    format: number,
    invertY: boolean,
    compression: Nullable<string> = null,
    textureType: number = Constants.TEXTURETYPE_UNSIGNED_BYTE,
    mipLevel?: number
): void {
    if (!this._doNotHandleContextLost) {
        texture._bufferView = bufferView;
        texture.format = format;
        texture.invertY = invertY;
        texture._compression = compression;
        if (mipLevel !== undefined && bufferView) {
            if (!texture._bufferViewArray) {
                texture._bufferViewArray = new Array(texture.mipLevelCount);
            }
            texture._bufferViewArray[mipLevel] = bufferView;
        }
    }

    if (bufferView) {
        const gpuTextureWrapper = texture._hardwareTexture as WebGPUHardwareTexture;
        const needConversion = format === Constants.TEXTUREFORMAT_RGB;

        if (needConversion) {
            bufferView = ConvertRGBtoRGBATextureData(bufferView, texture.width, texture.height, textureType);
        }

        const data = new Uint8Array(bufferView.buffer, bufferView.byteOffset, bufferView.byteLength);

        const mipWidth = Math.max(1, texture.width >> (mipLevel ?? 0));
        const mipHeight = Math.max(1, texture.height >> (mipLevel ?? 0));
        this._textureHelper.updateTexture(data, texture, mipWidth, mipHeight, texture.depth, gpuTextureWrapper.format, 0, mipLevel ?? 0, invertY, false, 0, 0);
        if (texture.generateMipMaps && !mipLevel) {
            this._generateMipmaps(texture, this._uploadEncoder);
        }
    }

    texture.isReady = true;
};

/**
 * @internal
 */
function ConvertRGBtoRGBATextureData(rgbData: any, width: number, height: number, textureType: number): ArrayBufferView {
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
