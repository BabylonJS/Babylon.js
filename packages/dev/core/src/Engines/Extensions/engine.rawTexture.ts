import type { Nullable } from "../../types";
import type { InternalTexture } from "../../Materials/Textures/internalTexture";
import type { Scene } from "../../scene";
import { Constants } from "../constants";
import { ThinEngine } from "../thinEngine";

import * as extension from "core/esm/Engines/WebGL/Extensions/rawTexture/engine.rawTexture.webgl";
import { EngineExtensions, loadExtension } from "core/esm/Engines/Extensions/engine.extensions";

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
        /**
         * Creates a raw texture
         * @param data defines the data to store in the texture
         * @param width defines the width of the texture
         * @param height defines the height of the texture
         * @param format defines the format of the data
         * @param generateMipMaps defines if the engine should generate the mip levels
         * @param invertY defines if data must be stored with Y axis inverted
         * @param samplingMode defines the required sampling mode (Texture.NEAREST_SAMPLINGMODE by default)
         * @param compression defines the compression used (null by default)
         * @param type defines the type fo the data (Engine.TEXTURETYPE_UNSIGNED_INT by default)
         * @param creationFlags specific flags to use when creating the texture (Constants.TEXTURE_CREATIONFLAG_STORAGE for storage textures, for eg)
         * @param useSRGBBuffer defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU).
         * @returns the raw texture inside an InternalTexture
         */
        createRawTexture(
            data: Nullable<ArrayBufferView>,
            width: number,
            height: number,
            format: number,
            generateMipMaps: boolean,
            invertY: boolean,
            samplingMode: number,
            compression: Nullable<string>,
            type: number,
            creationFlags?: number,
            useSRGBBuffer?: boolean
        ): InternalTexture;

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
         * @param type defines the type fo the data (Engine.TEXTURETYPE_UNSIGNED_INT by default)
         * @param useSRGBBuffer defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU).
         */
        updateRawTexture(
            texture: Nullable<InternalTexture>,
            data: Nullable<ArrayBufferView>,
            format: number,
            invertY: boolean,
            compression: Nullable<string>,
            type: number,
            useSRGBBuffer: boolean
        ): void;

        /**
         * Creates a new raw cube texture
         * @param data defines the array of data to use to create each face
         * @param size defines the size of the textures
         * @param format defines the format of the data
         * @param type defines the type of the data (like Engine.TEXTURETYPE_UNSIGNED_INT)
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
         * @param type defines the type fo the data (Engine.TEXTURETYPE_UNSIGNED_INT by default)
         * @param invertY defines if data must be stored with Y axis inverted
         */
        updateRawCubeTexture(texture: InternalTexture, data: ArrayBufferView[], format: number, type: number, invertY: boolean): void;

        /**
         * Update a raw cube texture
         * @param texture defines the texture to update
         * @param data defines the data to store
         * @param format defines the data format
         * @param type defines the type fo the data (Engine.TEXTURETYPE_UNSIGNED_INT by default)
         * @param invertY defines if data must be stored with Y axis inverted
         * @param compression defines the compression used (null by default)
         */
        updateRawCubeTexture(texture: InternalTexture, data: ArrayBufferView[], format: number, type: number, invertY: boolean, compression: Nullable<string>): void;

        /**
         * Update a raw cube texture
         * @param texture defines the texture to update
         * @param data defines the data to store
         * @param format defines the data format
         * @param type defines the type fo the data (Engine.TEXTURETYPE_UNSIGNED_INT by default)
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
         * @param type defines the type fo the data (like Engine.TEXTURETYPE_UNSIGNED_INT)
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
            callback: (ArrayBuffer: ArrayBuffer) => Nullable<ArrayBufferView[]>,
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
         * @param type defines the type fo the data (like Engine.TEXTURETYPE_UNSIGNED_INT)
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
            callback: (ArrayBuffer: ArrayBuffer) => Nullable<ArrayBufferView[]>,
            mipmapGenerator: Nullable<(faces: ArrayBufferView[]) => ArrayBufferView[][]>,
            onLoad: Nullable<() => void>,
            onError: Nullable<(message?: string, exception?: any) => void>,
            samplingMode: number,
            invertY: boolean
        ): InternalTexture;

        /**
         * Creates a new raw 3D texture
         * @param data defines the data used to create the texture
         * @param width defines the width of the texture
         * @param height defines the height of the texture
         * @param depth defines the depth of the texture
         * @param format defines the format of the texture
         * @param generateMipMaps defines if the engine must generate mip levels
         * @param invertY defines if data must be stored with Y axis inverted
         * @param samplingMode defines the required sampling mode (like Texture.NEAREST_SAMPLINGMODE)
         * @param compression defines the compressed used (can be null)
         * @param textureType defines the compressed used (can be null)
         * @param creationFlags specific flags to use when creating the texture (Constants.TEXTURE_CREATIONFLAG_STORAGE for storage textures, for eg)
         * @returns a new raw 3D texture (stored in an InternalTexture)
         */
        createRawTexture3D(
            data: Nullable<ArrayBufferView>,
            width: number,
            height: number,
            depth: number,
            format: number,
            generateMipMaps: boolean,
            invertY: boolean,
            samplingMode: number,
            compression: Nullable<string>,
            textureType: number,
            creationFlags?: number
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
         * @param textureType defines the texture Type (Engine.TEXTURETYPE_UNSIGNED_INT, Engine.TEXTURETYPE_FLOAT...)
         */
        updateRawTexture3D(texture: InternalTexture, data: Nullable<ArrayBufferView>, format: number, invertY: boolean, compression: Nullable<string>, textureType: number): void;

        /**
         * Creates a new raw 2D array texture
         * @param data defines the data used to create the texture
         * @param width defines the width of the texture
         * @param height defines the height of the texture
         * @param depth defines the number of layers of the texture
         * @param format defines the format of the texture
         * @param generateMipMaps defines if the engine must generate mip levels
         * @param invertY defines if data must be stored with Y axis inverted
         * @param samplingMode defines the required sampling mode (like Texture.NEAREST_SAMPLINGMODE)
         * @param compression defines the compressed used (can be null)
         * @param textureType defines the compressed used (can be null)
         * @param creationFlags specific flags to use when creating the texture (Constants.TEXTURE_CREATIONFLAG_STORAGE for storage textures, for eg)
         * @returns a new raw 2D array texture (stored in an InternalTexture)
         */
        createRawTexture2DArray(
            data: Nullable<ArrayBufferView>,
            width: number,
            height: number,
            depth: number,
            format: number,
            generateMipMaps: boolean,
            invertY: boolean,
            samplingMode: number,
            compression: Nullable<string>,
            textureType: number,
            creationFlags?: number
        ): InternalTexture;

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
         * @param textureType defines the texture Type (Engine.TEXTURETYPE_UNSIGNED_INT, Engine.TEXTURETYPE_FLOAT...)
         */
        updateRawTexture2DArray(
            texture: InternalTexture,
            data: Nullable<ArrayBufferView>,
            format: number,
            invertY: boolean,
            compression: Nullable<string>,
            textureType: number
        ): void;
    }
}

ThinEngine.prototype.updateRawTexture = function (
    texture: Nullable<InternalTexture>,
    data: Nullable<ArrayBufferView>,
    format: number,
    invertY: boolean,
    compression: Nullable<string> = null,
    type: number = Constants.TEXTURETYPE_UNSIGNED_INT,
    useSRGBBuffer: boolean = false
): void {
    extension.updateRawTexture(this._engineState, texture, data, format, invertY, compression, type, useSRGBBuffer);
};

ThinEngine.prototype.createRawTexture = function (
    data: Nullable<ArrayBufferView>,
    width: number,
    height: number,
    format: number,
    generateMipMaps: boolean,
    invertY: boolean,
    samplingMode: number,
    compression: Nullable<string> = null,
    type: number = Constants.TEXTURETYPE_UNSIGNED_INT,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    creationFlags = 0,
    useSRGBBuffer: boolean = false
): InternalTexture {
    return extension.createRawTexture(this._engineState, data, width, height, format, generateMipMaps, invertY, samplingMode, compression, type, creationFlags, useSRGBBuffer);
};

ThinEngine.prototype.createRawCubeTexture = function (
    data: Nullable<ArrayBufferView[]>,
    size: number,
    format: number,
    type: number,
    generateMipMaps: boolean,
    invertY: boolean,
    samplingMode: number,
    compression: Nullable<string> = null
): InternalTexture {
    return extension.createRawCubeTexture(this._engineState, data, size, format, type, generateMipMaps, invertY, samplingMode, compression);
};

ThinEngine.prototype.updateRawCubeTexture = function (
    texture: InternalTexture,
    data: ArrayBufferView[],
    format: number,
    type: number,
    invertY: boolean,
    compression: Nullable<string> = null,
    level: number = 0
): void {
    extension.updateRawCubeTexture(this._engineState, texture, data, format, type, invertY, compression, level);
};

ThinEngine.prototype.createRawCubeTextureFromUrl = function (
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
    return extension.createRawCubeTextureFromUrl(this._engineState, url, scene, size, format, type, noMipmap, callback, mipmapGenerator, onLoad, onError, samplingMode, invertY);
};

ThinEngine.prototype.createRawTexture2DArray = function (
    data: Nullable<ArrayBufferView>,
    width: number,
    height: number,
    depth: number,
    format: number,
    generateMipMaps: boolean,
    invertY: boolean,
    samplingMode: number,
    compression: Nullable<string> = null,
    textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT
): InternalTexture {
    return extension.createRawTexture2DArray(this._engineState, data, width, height, depth, format, generateMipMaps, invertY, samplingMode, compression, textureType);
};
ThinEngine.prototype.createRawTexture3D = function (
    data: Nullable<ArrayBufferView>,
    width: number,
    height: number,
    depth: number,
    format: number,
    generateMipMaps: boolean,
    invertY: boolean,
    samplingMode: number,
    compression: Nullable<string> = null,
    textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT
): InternalTexture {
    return extension.createRawTexture3D(this._engineState, data, width, height, depth, format, generateMipMaps, invertY, samplingMode, compression, textureType);
};

ThinEngine.prototype.updateRawTexture2DArray = function (
    texture: InternalTexture,
    data: Nullable<ArrayBufferView>,
    format: number,
    invertY: boolean,
    compression: Nullable<string> = null,
    textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT
): void {
    extension.updateRawTexture2DArray(this._engineState, texture, data, format, invertY, compression, textureType);
};
ThinEngine.prototype.updateRawTexture3D = function (
    texture: InternalTexture,
    data: Nullable<ArrayBufferView>,
    format: number,
    invertY: boolean,
    compression: Nullable<string> = null,
    textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT
): void {
    extension.updateRawTexture3D(this._engineState, texture, data, format, invertY, compression, textureType);
};

loadExtension(EngineExtensions.RAW_TEXTURE, extension);
