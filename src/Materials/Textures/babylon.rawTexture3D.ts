module BABYLON {
    /**
     * Class used to store 3D textures containing user data
     */
    export class RawTexture3D extends Texture {
        private _engine: Engine;

        /**
         * Create a new RawTexture3D
         * @param data defines the data of the texture
         * @param width defines the width of the texture
         * @param height defines the height of the texture
         * @param depth defines the depth of the texture
         * @param format defines the texture format to use
         * @param scene defines the hosting scene
         * @param generateMipMaps defines a boolean indicating if mip levels should be generated (true by default)
         * @param invertY defines if texture must be stored with Y axis inverted
         * @param samplingMode defines the sampling mode to use (BABYLON.Texture.TRILINEAR_SAMPLINGMODE by default)
         * @param textureType defines the texture Type (Engine.TEXTURETYPE_UNSIGNED_INT, Engine.TEXTURETYPE_FLOAT...)
         */
        constructor(data: ArrayBufferView, width: number, height: number, depth: number,
                    /** Gets or sets the texture format to use */
                    public format: number, scene: Scene,
                    generateMipMaps: boolean = true,
                    invertY: boolean = false,
                    samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE,
                    textureType = Engine.TEXTURETYPE_UNSIGNED_INT) {
            super(null, scene, !generateMipMaps, invertY);
            this._engine = scene.getEngine();

            this._texture = scene.getEngine().createRawTexture3D(
                data,
                width,
                height,
                depth,
                format,
                generateMipMaps,
                invertY,
                samplingMode,
                undefined,
                textureType
            );

            this.is3D = true;
        }

        /**
         * Update the texture with new data
         * @param data defines the data to store in the texture
         */
        public update(data: ArrayBufferView): void {
            if (!this._texture) {
                return;
            }
            this._engine.updateRawTexture3D(this._texture, data, this._texture.format, this._texture!.invertY, undefined, this._texture.type);
        }
    }
}