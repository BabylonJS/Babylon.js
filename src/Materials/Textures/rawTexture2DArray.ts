import { Texture } from "./texture";
import { Constants } from "../../Engines/constants";
import "../../Engines/Extensions/engine.rawTexture";

declare type Scene = import("../../scene").Scene;

/**
 * Class used to store 2D array textures containing user data
 */
export class RawTexture2DArray extends Texture {
    private _depth: number;

    /**
     * Gets the number of layers of the texture
     */
    public get depth() {
        return this._depth;
    }

    /**
     * Create a new RawTexture2DArray
     * @param data defines the data of the texture
     * @param width defines the width of the texture
     * @param height defines the height of the texture
     * @param depth defines the number of layers of the texture
     * @param format defines the texture format to use
     * @param scene defines the hosting scene
     * @param generateMipMaps defines a boolean indicating if mip levels should be generated (true by default)
     * @param invertY defines if texture must be stored with Y axis inverted
     * @param samplingMode defines the sampling mode to use (Texture.TRILINEAR_SAMPLINGMODE by default)
     * @param textureType defines the texture Type (Engine.TEXTURETYPE_UNSIGNED_INT, Engine.TEXTURETYPE_FLOAT...)
     */
    constructor(data: ArrayBufferView, width: number, height: number, depth: number,
        /** Gets or sets the texture format to use */
        public format: number, scene: Scene,
        generateMipMaps: boolean = true,
        invertY: boolean = false,
        samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE,
        textureType = Constants.TEXTURETYPE_UNSIGNED_INT) {
        super(null, scene, !generateMipMaps, invertY);

        this._texture = scene.getEngine().createRawTexture2DArray(
            data,
            width,
            height,
            depth,
            format,
            generateMipMaps,
            invertY,
            samplingMode,
            null,
            textureType
        );

        this._depth = depth;
        this.is2DArray = true;
    }

    /**
     * Update the texture with new data
     * @param data defines the data to store in the texture
     */
    public update(data: ArrayBufferView): void {
        if (!this._texture) {
            return;
        }
        this._getEngine()!.updateRawTexture2DArray(this._texture, data, this._texture.format, this._texture!.invertY, null, this._texture.type);
    }

    /**
     * Creates a RGBA texture from some data.
     * @param data Define the texture data
     * @param width Define the width of the texture
     * @param height Define the height of the texture
     * @param depth defines the number of layers of the texture
     * @param scene defines the scene the texture will belong to
     * @param generateMipMaps Define whether or not to create mip maps for the texture
     * @param invertY define if the data should be flipped on Y when uploaded to the GPU
     * @param samplingMode define the texture sampling mode (Texture.xxx_SAMPLINGMODE)
     * @param type define the format of the data (int, float... Engine.TEXTURETYPE_xxx)
     * @returns the RGBA texture
     */
    public static CreateRGBATexture(data: ArrayBufferView, width: number, height: number, depth: number, scene: Scene, generateMipMaps: boolean = true, invertY: boolean = false, samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE, type: number = Constants.TEXTURETYPE_UNSIGNED_INT): RawTexture2DArray {
        return new RawTexture2DArray(data, width, height, depth, Constants.TEXTUREFORMAT_RGBA, scene, generateMipMaps, invertY, samplingMode, type);
    }
}
