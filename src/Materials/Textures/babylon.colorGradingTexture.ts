module BABYLON {

    /**
     * This represents a color grading texture. This acts as a lookup table LUT, useful during post process
     * It can help converting any input color in a desired output one. This can then be used to create effects
     * from sepia, black and white to sixties or futuristic rendering...
     * 
     * The only supported format is currently 3dl.
     * More information on LUT: https://en.wikipedia.org/wiki/3D_lookup_table/
     */
    export class ColorGradingTexture extends BaseTexture {

        /**
         * The current internal texture size.
         */
        private _size: number;

        /**
         * The current texture matrix. (will always be identity in color grading texture)
         */
        private _textureMatrix: Matrix;

        /**
         * The texture URL.
         */
        public url: string;

        /**
         * Empty line regex stored for GC.
         */
        private static _noneEmptyLineRegex = /\S+/;

        /**
         * Instantiates a ColorGradingTexture from the following parameters.
         * 
         * @param url The location of the color gradind data (currently only supporting 3dl)
         * @param scene The scene the texture will be used in
         */
        constructor(url: string, scene: Scene) {
            super(scene);

            if (!url) {
                return;
            }

            this._textureMatrix = Matrix.Identity();
            this.name = url;
            this.url = url;
            this.hasAlpha = false;
            this.isCube = false;
            this.wrapU = Texture.CLAMP_ADDRESSMODE;
            this.wrapV = Texture.CLAMP_ADDRESSMODE;
            this.anisotropicFilteringLevel = 1;

            this._texture = this._getFromCache(url, true);

            if (!this._texture) {
                if (!scene.useDelayedTextureLoading) {
                    this.loadTexture();
                } else {
                    this.delayLoadState = Engine.DELAYLOADSTATE_NOTLOADED;
                }
            }
        }

        /**
         * Returns the texture matrix used in most of the material.
         * This is not used in color grading but keep for troubleshooting purpose (easily swap diffuse by colorgrading to look in).
         */
        public getTextureMatrix(): Matrix {
            return this._textureMatrix;
        }

        /**
         * Occurs when the file being loaded is a .3dl LUT file.
         */
        private load3dlTexture() {

            var mipLevels = 0;
            var floatArrayView: Float32Array = null;
            var texture = this.getScene().getEngine().createRawTexture(null, 1, 1, BABYLON.Engine.TEXTUREFORMAT_RGBA, false, false, Texture.BILINEAR_SAMPLINGMODE);
            this._texture = texture;

            var callback = (text: string) => {
                var data: Uint8Array;
                var tempData: Float32Array;

                var line: string;
                var lines = text.split('\n');
                var size = 0, pixelIndexW = 0, pixelIndexH = 0, pixelIndexSlice = 0;
                var maxColor = 0;

                for (let i = 0; i < lines.length; i++) {
                    line = lines[i];

                    if (!ColorGradingTexture._noneEmptyLineRegex.test(line))
                        continue;

                    if (line.indexOf('#') === 0)
                        continue;

                    var words = line.split(" ");
                    if (size === 0) {
                        // Number of space + one
                        size = words.length;
                        data = new Uint8Array(size * size * size * 4); // volume texture of side size and rgb 8
                        tempData = new Float32Array(size * size * size * 4);
                        continue;
                    }

                    if (size != 0) {
                        var r = Math.max(parseInt(words[0]), 0);
                        var g = Math.max(parseInt(words[1]), 0);
                        var b = Math.max(parseInt(words[2]), 0);

                        maxColor = Math.max(r, maxColor);
                        maxColor = Math.max(g, maxColor);
                        maxColor = Math.max(b, maxColor);

                        var pixelStorageIndex = (pixelIndexW + pixelIndexSlice * size + pixelIndexH * size * size) * 4;

                        tempData[pixelStorageIndex + 0] = r;
                        tempData[pixelStorageIndex + 1] = g;
                        tempData[pixelStorageIndex + 2] = b;
                        tempData[pixelStorageIndex + 3] = 0;

                        pixelIndexSlice++;
                        if (pixelIndexSlice % size == 0) {
                            pixelIndexH++;
                            pixelIndexSlice = 0;
                            if (pixelIndexH % size == 0) {
                                pixelIndexW++;
                                pixelIndexH = 0;
                            }
                        }
                    }
                }

                for (let i = 0; i < tempData.length; i++) {
                    var value = tempData[i];
                    data[i] = (value / maxColor * 255);
                }

                this.getScene().getEngine().updateTextureSize(texture, size * size, size);
                this.getScene().getEngine().updateRawTexture(texture, data, BABYLON.Engine.TEXTUREFORMAT_RGBA, false);
            }

            Tools.LoadFile(this.url, callback);
            return this._texture;
        }

        /**
         * Starts the loading process of the texture.
         */
        private loadTexture() {
            if (this.url && this.url.toLocaleLowerCase().indexOf(".3dl") == (this.url.length - 4)) {
                this.load3dlTexture();
            }
        }

        /**
         * Clones the color gradind texture.
         */
        public clone(): ColorGradingTexture {
            var newTexture = new ColorGradingTexture(this.url, this.getScene());

            // Base texture
            newTexture.level = this.level;

            return newTexture;
        }

        /**
         * Called during delayed load for textures.
         */
        public delayLoad(): void {
            if (this.delayLoadState !== Engine.DELAYLOADSTATE_NOTLOADED) {
                return;
            }

            this.delayLoadState = Engine.DELAYLOADSTATE_LOADED;
            this._texture = this._getFromCache(this.url, true);

            if (!this._texture) {
                this.loadTexture();
            }
        }

         /**
         * Binds the color grading to the shader.
         * @param colorGrading The texture to bind
         * @param effect The effect to bind to
         */
        public static Bind(colorGrading: BaseTexture, effect: Effect) : void {
            effect.setTexture("cameraColorGrading2DSampler", colorGrading);
                        
     	    let x = colorGrading.level;                 // Texture Level
            let y = colorGrading.getSize().height;      // Texture Size example with 8
            let z = y - 1.0;                    // SizeMinusOne 8 - 1
            let w = 1 / y;                      // Space of 1 slice 1 / 8
            
            effect.setFloat4("vCameraColorGradingInfos", x, y, z, w);
            
            let slicePixelSizeU = w / y;    // Space of 1 pixel in U direction, e.g. 1/64
            let slicePixelSizeV = w;		// Space of 1 pixel in V direction, e.g. 1/8					    // Space of 1 pixel in V direction, e.g. 1/8
            
            let x2 = z * slicePixelSizeU;   // Extent of lookup range in U for a single slice so that range corresponds to (size-1) texels, for example 7/64
            let y2 = z / y;	                // Extent of lookup range in V for a single slice so that range corresponds to (size-1) texels, for example 7/8
            let z2 = 0.5 * slicePixelSizeU;	// Offset of lookup range in U to align sample position with texel centre, for example 0.5/64 
            let w2 = 0.5 * slicePixelSizeV;	// Offset of lookup range in V to align sample position with texel centre, for example 0.5/8
            
            effect.setFloat4("vCameraColorGradingScaleOffset", x2, y2, z2, w2);
        }
        
        /**
         * Prepare the list of uniforms associated with the ColorGrading effects.
         * @param uniformsList The list of uniforms used in the effect
         * @param samplersList The list of samplers used in the effect
         */
        public static PrepareUniformsAndSamplers(uniformsList: string[], samplersList: string[]): void {
            uniformsList.push(
                "vCameraColorGradingInfos", 
                "vCameraColorGradingScaleOffset"
            );

            samplersList.push(
                "cameraColorGrading2DSampler"
            );
        }

        /**
         * Parses a color grading texture serialized by Babylon.
         * @param parsedTexture The texture information being parsedTexture
         * @param scene The scene to load the texture in
         * @param rootUrl The root url of the data assets to load
         * @return A color gradind texture
         */
        public static Parse(parsedTexture: any, scene: Scene, rootUrl: string): ColorGradingTexture {
            var texture = null;
            if (parsedTexture.name && !parsedTexture.isRenderTarget) {
                texture = new BABYLON.ColorGradingTexture(parsedTexture.name, scene);
                texture.name = parsedTexture.name;
                texture.level = parsedTexture.level;
            }
            return texture;
        }

        /**
         * Serializes the LUT texture to json format.
         */
        public serialize(): any {
            if (!this.name) {
                return null;
            }

            var serializationObject: any = {};
            serializationObject.name = this.name;
            serializationObject.level = this.level;

            return serializationObject;
        }
    }
}