import type { InternalTexture } from "core/Materials/Textures/internalTexture";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import type { IBaseEnginePublic } from "../engine.base";

/**
 * Defines the extension for the engine to create additional internal texture formats
 */
export interface IRawTextureEngineExtension {
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
        engineState: IBaseEnginePublic,
        data: Nullable<ArrayBufferView>,
        width: number,
        height: number,
        format: number,
        generateMipMaps: boolean,
        invertY: boolean,
        samplingMode: number,
        compression?: Nullable<string>,
        type?: number,
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
    updateRawTexture(engineState: IBaseEnginePublic, texture: Nullable<InternalTexture>, data: Nullable<ArrayBufferView>, format: number, invertY: boolean): void;

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
        engineState: IBaseEnginePublic,
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
        engineState: IBaseEnginePublic,
        data: Nullable<ArrayBufferView[]>,
        size: number,
        format: number,
        type: number,
        generateMipMaps: boolean,
        invertY: boolean,
        samplingMode: number,
        compression?: Nullable<string>
    ): InternalTexture;

    /**
     * Update a raw cube texture
     * @param texture defines the texture to update
     * @param data defines the data to store
     * @param format defines the data format
     * @param type defines the type fo the data (Engine.TEXTURETYPE_UNSIGNED_INT by default)
     * @param invertY defines if data must be stored with Y axis inverted
     */
    updateRawCubeTexture(engineState: IBaseEnginePublic, texture: InternalTexture, data: ArrayBufferView[], format: number, type: number, invertY: boolean): void;

    /**
     * Update a raw cube texture
     * @param texture defines the texture to update
     * @param data defines the data to store
     * @param format defines the data format
     * @param type defines the type fo the data (Engine.TEXTURETYPE_UNSIGNED_INT by default)
     * @param invertY defines if data must be stored with Y axis inverted
     * @param compression defines the compression used (null by default)
     */
    updateRawCubeTexture(
        engineState: IBaseEnginePublic,
        texture: InternalTexture,
        data: ArrayBufferView[],
        format: number,
        type: number,
        invertY: boolean,
        compression: Nullable<string>
    ): void;

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
    updateRawCubeTexture(
        engineState: IBaseEnginePublic,
        texture: InternalTexture,
        data: ArrayBufferView[],
        format: number,
        type: number,
        invertY: boolean,
        compression: Nullable<string>,
        level: number
    ): void;

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
        engineState: IBaseEnginePublic,
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
        engineState: IBaseEnginePublic,
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
        engineState: IBaseEnginePublic,
        data: Nullable<ArrayBufferView>,
        width: number,
        height: number,
        depth: number,
        format: number,
        generateMipMaps: boolean,
        invertY: boolean,
        samplingMode: number,
        compression?: Nullable<string>,
        textureType?: number,
        creationFlags?: number
    ): InternalTexture;

    /**
     * Update a raw 3D texture
     * @param texture defines the texture to update
     * @param data defines the data to store
     * @param format defines the data format
     * @param invertY defines if data must be stored with Y axis inverted
     */
    updateRawTexture3D(engineState: IBaseEnginePublic, texture: InternalTexture, data: Nullable<ArrayBufferView>, format: number, invertY: boolean): void;

    /**
     * Update a raw 3D texture
     * @param texture defines the texture to update
     * @param data defines the data to store
     * @param format defines the data format
     * @param invertY defines if data must be stored with Y axis inverted
     * @param compression defines the used compression (can be null)
     * @param textureType defines the texture Type (Engine.TEXTURETYPE_UNSIGNED_INT, Engine.TEXTURETYPE_FLOAT...)
     */
    updateRawTexture3D(
        engineState: IBaseEnginePublic,
        texture: InternalTexture,
        data: Nullable<ArrayBufferView>,
        format: number,
        invertY: boolean,
        compression: Nullable<string>,
        textureType: number
    ): void;

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
        engineState: IBaseEnginePublic,
        data: Nullable<ArrayBufferView>,
        width: number,
        height: number,
        depth: number,
        format: number,
        generateMipMaps: boolean,
        invertY: boolean,
        samplingMode: number,
        compression?: Nullable<string>,
        textureType?: number,
        creationFlags?: number
    ): InternalTexture;

    /**
     * Update a raw 2D array texture
     * @param texture defines the texture to update
     * @param data defines the data to store
     * @param format defines the data format
     * @param invertY defines if data must be stored with Y axis inverted
     */
    updateRawTexture2DArray(engineState: IBaseEnginePublic, texture: InternalTexture, data: Nullable<ArrayBufferView>, format: number, invertY: boolean): void;

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
        engineState: IBaseEnginePublic,
        texture: InternalTexture,
        data: Nullable<ArrayBufferView>,
        format: number,
        invertY: boolean,
        compression: Nullable<string>,
        textureType: number
    ): void;
}
