module BABYLON {
    export class RawCubeTexture extends CubeTexture {
        /**
         * Creates a cube texture where the raw buffers are passed in.
         * @param scene defines the scene the texture is attached to
         * @param data defines the array of data to use to create each face
         * @param size defines the size of the textures
         * @param format defines the format of the data
         * @param type defines the type of the data (like BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT)
         * @param generateMipMaps  defines if the engine should generate the mip levels
         * @param invertY defines if data must be stored with Y axis inverted
         * @param samplingMode defines the required sampling mode (like BABYLON.Texture.NEAREST_SAMPLINGMODE)
         * @param compression defines the compression used (null by default)
         * @param onLoad defines an optional callback raised when the texture is loaded
         * @param onError defines an optional callback raised if there is an issue to load the texture
         * @param sphericalPolynomial defines the spherical polynomial for irradiance
         * @param rgbd defines if the data is stored as RGBD
         * @param lodScale defines the scale applied to environment texture. This manages the range of LOD level used for IBL according to the roughness
         * @param lodOffset defines the offset applied to environment texture. This manages first LOD level used for IBL according to the roughness
         */
        constructor(scene: Scene, data: ArrayBufferView[] | ArrayBufferView[][], size: number,
                    format: number = Engine.TEXTUREFORMAT_RGBA, type: number = Engine.TEXTURETYPE_UNSIGNED_INT,
                    generateMipMaps: boolean = false, invertY: boolean = false, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE,
                    compression: Nullable<string> = null, onLoad: Nullable<() => void> = null, onError: Nullable<(message?: string, exception?: any) => void> = null,
                    sphericalPolynomial: Nullable<SphericalPolynomial> = null, rgbd = false, lodScale: number = 0.8, lodOffset: number = 0) {
            super("", scene);

            this._texture = scene.getEngine().createRawCubeTexture(
                data, size, format, type, generateMipMaps, invertY, samplingMode, compression,
                onLoad, onError, sphericalPolynomial, rgbd, lodScale, lodOffset);
        }

        /**
         * Clones the raw cube texture.
         */
        public clone(): CubeTexture {
            return SerializationHelper.Clone(() => {
                const scene = this.getScene()!;
                const texture = this._texture!;
                return new RawCubeTexture(scene, texture._bufferViewArray!, texture.width, texture.format, texture.type,
                    texture.generateMipMaps, texture.invertY, texture.samplingMode, texture._compression, null, null,
                    texture._sphericalPolynomial, texture._sourceIsRGBD, texture._lodGenerationScale, texture._lodGenerationOffset);
            }, this);
        }
    }
}
