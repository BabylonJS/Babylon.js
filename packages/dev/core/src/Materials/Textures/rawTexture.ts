import { Texture } from "./texture";
import { Constants } from "../../Engines/constants";
import type { Nullable } from "../../types";
import type { AbstractEngine } from "../../Engines/abstractEngine";

import type { Scene } from "../../scene";

/**
 * Raw texture can help creating a texture directly from an array of data.
 * This can be super useful if you either get the data from an uncompressed source or
 * if you wish to create your texture pixel by pixel.
 */
export class RawTexture extends Texture {
    private _waitingForData: boolean;
    /**
     * Instantiates a new RawTexture.
     * Raw texture can help creating a texture directly from an array of data.
     * This can be super useful if you either get the data from an uncompressed source or
     * if you wish to create your texture pixel by pixel.
     * @param data define the array of data to use to create the texture (null to create an empty texture)
     * @param width define the width of the texture
     * @param height define the height of the texture
     * @param format define the format of the data (RGB, RGBA... Engine.TEXTUREFORMAT_xxx)
     * @param sceneOrEngine defines the scene or engine the texture will belong to
     * @param generateMipMaps define whether mip maps should be generated or not
     * @param invertY define if the data should be flipped on Y when uploaded to the GPU
     * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
     * @param type define the format of the data (int, float... Engine.TEXTURETYPE_xxx)
     * @param creationFlags specific flags to use when creating the texture (Constants.TEXTURE_CREATIONFLAG_STORAGE for storage textures, for eg)
     * @param useSRGBBuffer defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU).
     * @param waitDataToBeReady If set to true Rawtexture will wait data to be set in order to be flaged as ready.
     * @param mipLevelCount defines the number of mip levels to allocate for the texture
     */
    constructor(
        data: Nullable<ArrayBufferView>,
        width: number,
        height: number,
        /**
         * Define the format of the data (RGB, RGBA... Engine.TEXTUREFORMAT_xxx)
         */
        public format: number,
        sceneOrEngine: Nullable<Scene | AbstractEngine>,
        generateMipMaps: boolean = true,
        invertY: boolean = false,
        samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
        type: number = Constants.TEXTURETYPE_UNSIGNED_BYTE,
        creationFlags?: number,
        useSRGBBuffer?: boolean,
        waitDataToBeReady?: boolean,
        mipLevelCount?: number
    ) {
        super(null, sceneOrEngine, !generateMipMaps, invertY, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, creationFlags);

        if (!this._engine) {
            return;
        }

        if (!this._engine._caps.textureFloatLinearFiltering && type === Constants.TEXTURETYPE_FLOAT) {
            samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        }
        if (!this._engine._caps.textureHalfFloatLinearFiltering && type === Constants.TEXTURETYPE_HALF_FLOAT) {
            samplingMode = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
        }

        this._texture = this._engine.createRawTexture(
            data,
            width,
            height,
            format,
            generateMipMaps,
            invertY,
            samplingMode,
            null,
            type,
            creationFlags ?? 0,
            useSRGBBuffer ?? false,
            mipLevelCount
        );

        this.wrapU = Texture.CLAMP_ADDRESSMODE;
        this.wrapV = Texture.CLAMP_ADDRESSMODE;
        this._waitingForData = !!waitDataToBeReady && !data;
    }

    /**
     * Updates the texture underlying data.
     * @param data Define the new data of the texture
     */
    public update(data: ArrayBufferView): void {
        this.updateMipLevel(data, 0);
    }

    /**
     * Updates a specific mip level of the texture.
     * @param data The new data for the mip level
     * @param mipLevel The mip level to update (0 is the base level)
     */
    public updateMipLevel(data: ArrayBufferView, mipLevel: number): void {
        this._getEngine()!.updateRawTexture(this._texture, data, this._texture!.format, this._texture!.invertY, null, this._texture!.type, this._texture!._useSRGBBuffer, mipLevel);
        this._waitingForData = false;
    }

    /**
     * Clones the texture.
     * @returns the cloned texture
     */
    public override clone(): Texture {
        if (!this._texture) {
            return super.clone();
        }

        const rawTexture = new RawTexture(
            null,
            this.getSize().width,
            this.getSize().height,
            this.format,
            this.getScene(),
            this._texture.generateMipMaps,
            this._invertY,
            this.samplingMode,
            this._texture.type,
            this._texture._creationFlags,
            this._useSRGBBuffer
        );

        rawTexture._texture = this._texture;
        this._texture.incrementReferences();

        return rawTexture;
    }

    public override isReady(): boolean {
        return super.isReady() && !this._waitingForData;
    }

    /**
     * Creates a luminance texture from some data.
     * @param data Define the texture data
     * @param width Define the width of the texture
     * @param height Define the height of the texture
     * @param sceneOrEngine defines the scene or engine the texture will belong to
     * @param generateMipMaps Define whether or not to create mip maps for the texture
     * @param invertY define if the data should be flipped on Y when uploaded to the GPU
     * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
     * @returns the luminance texture
     */
    public static CreateLuminanceTexture(
        data: Nullable<ArrayBufferView>,
        width: number,
        height: number,
        sceneOrEngine: Nullable<Scene | AbstractEngine>,
        generateMipMaps: boolean = true,
        invertY: boolean = false,
        samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE
    ): RawTexture {
        return new RawTexture(data, width, height, Constants.TEXTUREFORMAT_LUMINANCE, sceneOrEngine, generateMipMaps, invertY, samplingMode);
    }

    /**
     * Creates a luminance alpha texture from some data.
     * @param data Define the texture data
     * @param width Define the width of the texture
     * @param height Define the height of the texture
     * @param sceneOrEngine defines the scene or engine the texture will belong to
     * @param generateMipMaps Define whether or not to create mip maps for the texture
     * @param invertY define if the data should be flipped on Y when uploaded to the GPU
     * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
     * @returns the luminance alpha texture
     */
    public static CreateLuminanceAlphaTexture(
        data: Nullable<ArrayBufferView>,
        width: number,
        height: number,
        sceneOrEngine: Nullable<Scene | AbstractEngine>,
        generateMipMaps: boolean = true,
        invertY: boolean = false,
        samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE
    ): RawTexture {
        return new RawTexture(data, width, height, Constants.TEXTUREFORMAT_LUMINANCE_ALPHA, sceneOrEngine, generateMipMaps, invertY, samplingMode);
    }

    /**
     * Creates an alpha texture from some data.
     * @param data Define the texture data
     * @param width Define the width of the texture
     * @param height Define the height of the texture
     * @param sceneOrEngine defines the scene or engine the texture will belong to
     * @param generateMipMaps Define whether or not to create mip maps for the texture
     * @param invertY define if the data should be flipped on Y when uploaded to the GPU
     * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
     * @returns the alpha texture
     */
    public static CreateAlphaTexture(
        data: Nullable<ArrayBufferView>,
        width: number,
        height: number,
        sceneOrEngine: Nullable<Scene | AbstractEngine>,
        generateMipMaps: boolean = true,
        invertY: boolean = false,
        samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE
    ): RawTexture {
        return new RawTexture(data, width, height, Constants.TEXTUREFORMAT_ALPHA, sceneOrEngine, generateMipMaps, invertY, samplingMode);
    }

    /**
     * Creates a RGB texture from some data.
     * @param data Define the texture data
     * @param width Define the width of the texture
     * @param height Define the height of the texture
     * @param sceneOrEngine defines the scene or engine the texture will belong to
     * @param generateMipMaps Define whether or not to create mip maps for the texture
     * @param invertY define if the data should be flipped on Y when uploaded to the GPU
     * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
     * @param type define the format of the data (int, float... Engine.TEXTURETYPE_xxx)
     * @param creationFlags specific flags to use when creating the texture (Constants.TEXTURE_CREATIONFLAG_STORAGE for storage textures, for eg)
     * @param useSRGBBuffer defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU).
     * @returns the RGB alpha texture
     */
    public static CreateRGBTexture(
        data: Nullable<ArrayBufferView>,
        width: number,
        height: number,
        sceneOrEngine: Nullable<Scene | AbstractEngine>,
        generateMipMaps: boolean = true,
        invertY: boolean = false,
        samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
        type: number = Constants.TEXTURETYPE_UNSIGNED_BYTE,
        creationFlags: number = 0,
        useSRGBBuffer: boolean = false
    ): RawTexture {
        return new RawTexture(data, width, height, Constants.TEXTUREFORMAT_RGB, sceneOrEngine, generateMipMaps, invertY, samplingMode, type, creationFlags, useSRGBBuffer);
    }

    /**
     * Creates a RGBA texture from some data.
     * @param data Define the texture data
     * @param width Define the width of the texture
     * @param height Define the height of the texture
     * @param sceneOrEngine defines the scene or engine the texture will belong to
     * @param generateMipMaps Define whether or not to create mip maps for the texture
     * @param invertY define if the data should be flipped on Y when uploaded to the GPU
     * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
     * @param type define the format of the data (int, float... Engine.TEXTURETYPE_xxx)
     * @param creationFlags specific flags to use when creating the texture (Constants.TEXTURE_CREATIONFLAG_STORAGE for storage textures, for eg)
     * @param useSRGBBuffer defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU).
     * @param waitDataToBeReady if set to true this will force texture to wait for data to be set before it is considered ready.
     * @returns the RGBA texture
     */
    public static CreateRGBATexture(
        data: Nullable<ArrayBufferView>,
        width: number,
        height: number,
        sceneOrEngine: Nullable<Scene | AbstractEngine>,
        generateMipMaps: boolean = true,
        invertY: boolean = false,
        samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
        type: number = Constants.TEXTURETYPE_UNSIGNED_BYTE,
        creationFlags: number = 0,
        useSRGBBuffer: boolean = false,
        waitDataToBeReady: boolean = false
    ): RawTexture {
        return new RawTexture(
            data,
            width,
            height,
            Constants.TEXTUREFORMAT_RGBA,
            sceneOrEngine,
            generateMipMaps,
            invertY,
            samplingMode,
            type,
            creationFlags,
            useSRGBBuffer,
            waitDataToBeReady
        );
    }

    /**
     * Creates a RGBA storage texture from some data.
     * @param data Define the texture data
     * @param width Define the width of the texture
     * @param height Define the height of the texture
     * @param sceneOrEngine defines the scene or engine the texture will belong to
     * @param generateMipMaps Define whether or not to create mip maps for the texture
     * @param invertY define if the data should be flipped on Y when uploaded to the GPU
     * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
     * @param type define the format of the data (int, float... Engine.TEXTURETYPE_xxx)
     * @param useSRGBBuffer defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU).
     * @returns the RGBA texture
     */
    public static CreateRGBAStorageTexture(
        data: Nullable<ArrayBufferView>,
        width: number,
        height: number,
        sceneOrEngine: Nullable<Scene | AbstractEngine>,
        generateMipMaps: boolean = true,
        invertY: boolean = false,
        samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
        type: number = Constants.TEXTURETYPE_UNSIGNED_BYTE,
        useSRGBBuffer: boolean = false
    ): RawTexture {
        return new RawTexture(
            data,
            width,
            height,
            Constants.TEXTUREFORMAT_RGBA,
            sceneOrEngine,
            generateMipMaps,
            invertY,
            samplingMode,
            type,
            Constants.TEXTURE_CREATIONFLAG_STORAGE,
            useSRGBBuffer
        );
    }

    /**
     * Creates a R texture from some data.
     * @param data Define the texture data
     * @param width Define the width of the texture
     * @param height Define the height of the texture
     * @param sceneOrEngine defines the scene or engine the texture will belong to
     * @param generateMipMaps Define whether or not to create mip maps for the texture
     * @param invertY define if the data should be flipped on Y when uploaded to the GPU
     * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
     * @param type define the format of the data (int, float... Engine.TEXTURETYPE_xxx)
     * @returns the R texture
     */
    public static CreateRTexture(
        data: Nullable<ArrayBufferView>,
        width: number,
        height: number,
        sceneOrEngine: Nullable<Scene | AbstractEngine>,
        generateMipMaps: boolean = true,
        invertY: boolean = false,
        samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE,
        type: number = Constants.TEXTURETYPE_FLOAT
    ): RawTexture {
        return new RawTexture(data, width, height, Constants.TEXTUREFORMAT_R, sceneOrEngine, generateMipMaps, invertY, samplingMode, type);
    }

    /**
     * Creates a R storage texture from some data.
     * @param data Define the texture data
     * @param width Define the width of the texture
     * @param height Define the height of the texture
     * @param sceneOrEngine defines the scene or engine the texture will belong to
     * @param generateMipMaps Define whether or not to create mip maps for the texture
     * @param invertY define if the data should be flipped on Y when uploaded to the GPU
     * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
     * @param type define the format of the data (int, float... Engine.TEXTURETYPE_xxx)
     * @returns the R texture
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public static CreateRStorageTexture(
        data: Nullable<ArrayBufferView>,
        width: number,
        height: number,
        sceneOrEngine: Nullable<Scene | AbstractEngine>,
        generateMipMaps: boolean = true,
        invertY: boolean = false,
        samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE,
        type: number = Constants.TEXTURETYPE_FLOAT
    ): RawTexture {
        return new RawTexture(data, width, height, Constants.TEXTUREFORMAT_R, sceneOrEngine, generateMipMaps, invertY, samplingMode, type, Constants.TEXTURE_CREATIONFLAG_STORAGE);
    }
}
