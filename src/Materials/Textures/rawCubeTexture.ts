import { SerializationHelper } from "../../Misc/decorators";
import { EnvironmentTextureTools } from "../../Misc/environmentTextureTools";
import { Nullable } from "../../types";
import { Scene } from "../../scene";
import { SphericalPolynomial } from "../../Maths/sphericalPolynomial";
import { InternalTexture, InternalTextureSource } from "./internalTexture";
import { CubeTexture } from "./cubeTexture";
import { Constants } from "../../Engines/constants";
import "../../Engines/Extensions/engine.rawTexture";
import { Engine } from '../../Engines/engine';

/**
 * Raw cube texture where the raw buffers are passed in
 */
export class RawCubeTexture extends CubeTexture {
    /**
     * Creates a cube texture where the raw buffers are passed in.
     * @param scene defines the scene the texture is attached to
     * @param data defines the array of data to use to create each face
     * @param size defines the size of the textures
     * @param format defines the format of the data
     * @param type defines the type of the data (like Engine.TEXTURETYPE_UNSIGNED_INT)
     * @param generateMipMaps  defines if the engine should generate the mip levels
     * @param invertY defines if data must be stored with Y axis inverted
     * @param samplingMode defines the required sampling mode (like Texture.NEAREST_SAMPLINGMODE)
     * @param compression defines the compression used (null by default)
     */
    constructor(scene: Scene, data: Nullable<ArrayBufferView[]>, size: number,
        format: number = Constants.TEXTUREFORMAT_RGBA, type: number = Constants.TEXTURETYPE_UNSIGNED_INT,
        generateMipMaps: boolean = false, invertY: boolean = false, samplingMode: number = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE,
        compression: Nullable<string> = null) {
        super("", scene);

        this._texture = scene.getEngine().createRawCubeTexture(data, size, format, type, generateMipMaps, invertY, samplingMode, compression);
    }

    /**
     * Updates the raw cube texture.
     * @param data defines the data to store
     * @param format defines the data format
     * @param type defines the type fo the data (Engine.TEXTURETYPE_UNSIGNED_INT by default)
     * @param invertY defines if data must be stored with Y axis inverted
     * @param compression defines the compression used (null by default)
     * @param level defines which level of the texture to update
     */
    public update(data: ArrayBufferView[], format: number, type: number, invertY: boolean, compression: Nullable<string> = null): void {
        (this._texture!.getEngine() as Engine).updateRawCubeTexture(this._texture!, data, format, type, invertY, compression);
    }

    /**
     * Updates a raw cube texture with RGBD encoded data.
     * @param data defines the array of data [mipmap][face] to use to create each face
     * @param sphericalPolynomial defines the spherical polynomial for irradiance
     * @param lodScale defines the scale applied to environment texture. This manages the range of LOD level used for IBL according to the roughness
     * @param lodOffset defines the offset applied to environment texture. This manages first LOD level used for IBL according to the roughness
     * @returns a promise that resolves when the operation is complete
     */
    public updateRGBDAsync(data: ArrayBufferView[][], sphericalPolynomial: Nullable<SphericalPolynomial> = null, lodScale: number = 0.8, lodOffset: number = 0): Promise<void> {
        return RawCubeTexture._UpdateRGBDAsync(this._texture!, data, sphericalPolynomial, lodScale, lodOffset);
    }

    /**
     * Clones the raw cube texture.
     * @return a new cube texture
     */
    public clone(): CubeTexture {
        return SerializationHelper.Clone(() => {
            const scene = this.getScene()!;
            const internalTexture = this._texture!;

            const texture = new RawCubeTexture(scene, internalTexture._bufferViewArray!, internalTexture.width, internalTexture.format, internalTexture.type,
                internalTexture.generateMipMaps, internalTexture.invertY, internalTexture.samplingMode, internalTexture._compression);

            if (internalTexture.source === InternalTextureSource.CubeRawRGBD) {
                texture.updateRGBDAsync(internalTexture._bufferViewArrayArray!, internalTexture._sphericalPolynomial, internalTexture._lodGenerationScale, internalTexture._lodGenerationOffset);
            }

            return texture;
        }, this);
    }

    /** @hidden */
    public static _UpdateRGBDAsync(internalTexture: InternalTexture, data: ArrayBufferView[][], sphericalPolynomial: Nullable<SphericalPolynomial>, lodScale: number, lodOffset: number): Promise<void> {
        internalTexture._source = InternalTextureSource.CubeRawRGBD;
        internalTexture._bufferViewArrayArray = data;
        internalTexture._lodGenerationScale = lodScale;
        internalTexture._lodGenerationOffset = lodOffset;
        internalTexture._sphericalPolynomial = sphericalPolynomial;

        return EnvironmentTextureTools.UploadLevelsAsync(internalTexture, data).then(() => {
            internalTexture.isReady = true;
        });
    }
}
