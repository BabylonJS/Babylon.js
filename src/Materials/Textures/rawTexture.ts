import { Scene } from "../../scene";
import { Texture } from "./texture";
import { Constants } from "../../Engines/constants";
import "../../Engines/Extensions/engine.rawTexture";

/**
 * Raw texture can help creating a texture directly from an array of data.
 * This can be super useful if you either get the data from an uncompressed source or
 * if you wish to create your texture pixel by pixel.
 */
export class RawTexture extends Texture {
    /**
     * Instantiates a new RawTexture.
     * Raw texture can help creating a texture directly from an array of data.
     * This can be super useful if you either get the data from an uncompressed source or
     * if you wish to create your texture pixel by pixel.
     * @param data define the array of data to use to create the texture
     * @param width define the width of the texture
     * @param height define the height of the texture
     * @param format define the format of the data (RGB, RGBA... Engine.TEXTUREFORMAT_xxx)
     * @param scene  define the scene the texture belongs to
     * @param generateMipMaps define whether mip maps should be generated or not
     * @param invertY define if the data should be flipped on Y when uploaded to the GPU
     * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
     * @param type define the format of the data (int, float... Engine.TEXTURETYPE_xxx)
     */
    constructor(data: ArrayBufferView, width: number, height: number,
        /**
         * Define the format of the data (RGB, RGBA... Engine.TEXTUREFORMAT_xxx)
         */
        public format: number,
        scene: Scene, generateMipMaps: boolean = true, invertY: boolean = false, samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, type: number = Constants.TEXTURETYPE_UNSIGNED_INT) {
        super(null, scene, !generateMipMaps, invertY);

        this._texture = scene.getEngine().createRawTexture(data, width, height, format, generateMipMaps, invertY, samplingMode, null, type);

        this.wrapU = Texture.CLAMP_ADDRESSMODE;
        this.wrapV = Texture.CLAMP_ADDRESSMODE;
    }

    /**
     * Updates the texture underlying data.
     * @param data Define the new data of the texture
     */
    public update(data: ArrayBufferView): void {
        this._getEngine()!.updateRawTexture(this._texture, data, this._texture!.format, this._texture!.invertY, null, this._texture!.type);
    }

    /**
     * Creates a luminance texture from some data.
     * @param data Define the texture data
     * @param width Define the width of the texture
     * @param height Define the height of the texture
     * @param scene Define the scene the texture belongs to
     * @param generateMipMaps Define whether or not to create mip maps for the texture
     * @param invertY define if the data should be flipped on Y when uploaded to the GPU
     * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
     * @returns the luminance texture
     */
    public static CreateLuminanceTexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps: boolean = true, invertY: boolean = false, samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE): RawTexture {
        return new RawTexture(data, width, height, Constants.TEXTUREFORMAT_LUMINANCE, scene, generateMipMaps, invertY, samplingMode);
    }

    /**
     * Creates a luminance alpha texture from some data.
     * @param data Define the texture data
     * @param width Define the width of the texture
     * @param height Define the height of the texture
     * @param scene Define the scene the texture belongs to
     * @param generateMipMaps Define whether or not to create mip maps for the texture
     * @param invertY define if the data should be flipped on Y when uploaded to the GPU
     * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
     * @returns the luminance alpha texture
     */
    public static CreateLuminanceAlphaTexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps: boolean = true, invertY: boolean = false, samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE): RawTexture {
        return new RawTexture(data, width, height, Constants.TEXTUREFORMAT_LUMINANCE_ALPHA, scene, generateMipMaps, invertY, samplingMode);
    }

    /**
     * Creates an alpha texture from some data.
     * @param data Define the texture data
     * @param width Define the width of the texture
     * @param height Define the height of the texture
     * @param scene Define the scene the texture belongs to
     * @param generateMipMaps Define whether or not to create mip maps for the texture
     * @param invertY define if the data should be flipped on Y when uploaded to the GPU
     * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
     * @returns the alpha texture
     */
    public static CreateAlphaTexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps: boolean = true, invertY: boolean = false, samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE): RawTexture {
        return new RawTexture(data, width, height, Constants.TEXTUREFORMAT_ALPHA, scene, generateMipMaps, invertY, samplingMode);
    }

    /**
     * Creates a RGB texture from some data.
     * @param data Define the texture data
     * @param width Define the width of the texture
     * @param height Define the height of the texture
     * @param scene Define the scene the texture belongs to
     * @param generateMipMaps Define whether or not to create mip maps for the texture
     * @param invertY define if the data should be flipped on Y when uploaded to the GPU
     * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
     * @param type define the format of the data (int, float... Engine.TEXTURETYPE_xxx)
     * @returns the RGB alpha texture
     */
    public static CreateRGBTexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps: boolean = true, invertY: boolean = false, samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, type: number = Constants.TEXTURETYPE_UNSIGNED_INT): RawTexture {
        return new RawTexture(data, width, height, Constants.TEXTUREFORMAT_RGB, scene, generateMipMaps, invertY, samplingMode, type);
    }

    /**
     * Creates a RGBA texture from some data.
     * @param data Define the texture data
     * @param width Define the width of the texture
     * @param height Define the height of the texture
     * @param scene Define the scene the texture belongs to
     * @param generateMipMaps Define whether or not to create mip maps for the texture
     * @param invertY define if the data should be flipped on Y when uploaded to the GPU
     * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
     * @param type define the format of the data (int, float... Engine.TEXTURETYPE_xxx)
     * @returns the RGBA texture
     */
    public static CreateRGBATexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps: boolean = true, invertY: boolean = false, samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, type: number = Constants.TEXTURETYPE_UNSIGNED_INT): RawTexture {
        return new RawTexture(data, width, height, Constants.TEXTUREFORMAT_RGBA, scene, generateMipMaps, invertY, samplingMode, type);
    }

    /**
     * Creates a R texture from some data.
     * @param data Define the texture data
     * @param width Define the width of the texture
     * @param height Define the height of the texture
     * @param scene Define the scene the texture belongs to
     * @param generateMipMaps Define whether or not to create mip maps for the texture
     * @param invertY define if the data should be flipped on Y when uploaded to the GPU
     * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
     * @param type define the format of the data (int, float... Engine.TEXTURETYPE_xxx)
     * @returns the R texture
     */
    public static CreateRTexture(data: ArrayBufferView, width: number, height: number, scene: Scene, generateMipMaps: boolean = true, invertY: boolean = false, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE, type: number = Constants.TEXTURETYPE_FLOAT): RawTexture {
        return new RawTexture(data, width, height, Constants.TEXTUREFORMAT_R, scene, generateMipMaps, invertY, samplingMode, type);
    }
}
