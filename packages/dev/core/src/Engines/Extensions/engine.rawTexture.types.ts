import { type Nullable } from "../../types";
import { type InternalTexture } from "../../Materials/Textures/internalTexture";
import { type Scene } from "../../scene";
declare module "../abstractEngine.pure" {
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
    }
}
