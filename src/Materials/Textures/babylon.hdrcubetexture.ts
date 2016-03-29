module BABYLON {
    
    /**
     * This represents a texture coming from an HDR input.
     * 
     * The only supported format is currently panorama picture stored in RGBE format.
     * Example of such files can be found on HDRLib: http://hdrlib.com/
     */
    export class HDRCubeTexture extends BaseTexture {

        private static _facesMapping = [
            "right",
            "up",
            "front",
            "left",
            "down",
            "back"
        ];

        private _useInGammaSpace = false;
        private _generateHarmonics = true;
        private _noMipmap: boolean;
        private _extensions: string[];
        private _textureMatrix: Matrix;
        private _size: number;
        private _usePMREMGenerator: boolean;
        
        /**
         * The texture URL.
         */
        public url: string;
        
        /**
         * The texture coordinates mode. As this texture is stored in a cube format, please modify carefully.
         */
        public coordinatesMode = Texture.CUBIC_MODE;

        /**
         * The spherical polynomial data extracted from the texture.
         */
        public sphericalPolynomial: SphericalPolynomial = null;

        /**
         * Specifies wether the texture has been generated through the PMREMGenerator tool.
         * This is usefull at run time to apply the good shader.
         */
        public isPMREM = false;

        /**
         * Instantiates an HDRTexture from the following parameters.
         * 
         * @param url The location of the HDR raw data (Panorama stored in RGBE format)
         * @param scene The scene the texture will be used in
         * @param size The cubemap desired size (the more it increases the longer the generation will be)
         * @param noMipmap Forces to not generate the mipmap if true
         * @param generateHarmonics Specifies wether you want to extract the polynomial harmonics during the generation process
         * @param useInGammaSpace Specifies if the texture will be use in gamma or linear space (the PBR material requires those texture in linear space, but the standard material would require them in Gamma space)
         * @param usePMREMGenerator Specifies wether or not to generate the CubeMap through CubeMapGen to avoid seams issue at run time.
         */
        constructor(url: string, scene: Scene, size: number, noMipmap = false, generateHarmonics = true, useInGammaSpace = false, usePMREMGenerator = false) {
            super(scene);

            this.name = url;
            this.url = url;
            this._noMipmap = noMipmap;
            this.hasAlpha = false;
            this._size = size;
            this._useInGammaSpace = useInGammaSpace;
            this._usePMREMGenerator = usePMREMGenerator && scene.getEngine().getCaps().textureLOD;
            this.isPMREM = this._usePMREMGenerator;

            if (!url) {
                return;
            }

            this._texture = this._getFromCache(url, noMipmap);

            if (!this._texture) {
                if (!scene.useDelayedTextureLoading) {
                    this.loadTexture();
                } else {
                    this.delayLoadState = Engine.DELAYLOADSTATE_NOTLOADED;
                }
            }

            this.isCube = true;

            this._textureMatrix = Matrix.Identity();
        }

        private loadTexture() {
            var callback = (buffer: ArrayBuffer) => {
                // Extract the raw linear data.
                var data = BABYLON.Internals.HDRTools.GetCubeMapTextureData(buffer, this._size);
                
                // Generate harmonics if needed.
                if (this._generateHarmonics) {
                    this.sphericalPolynomial = BABYLON.Internals.CubeMapToSphericalPolynomialTools.ConvertCubeMapToSphericalPolynomial(data);
                }

                var results = [];
                var byteArray: Uint8Array = null;
                
                // Create uintarray fallback.
                if (!this.getScene().getEngine().getCaps().textureFloat) {
                    // 3 channels of 1 bytes per pixel in bytes.
                    var byteBuffer = new ArrayBuffer(this._size * this._size * 3);
                    byteArray = new Uint8Array(byteBuffer);
                }
                
                // Push each faces.
                for (var j = 0; j < 6; j++) {
                    var dataFace = <Float32Array>data[HDRCubeTexture._facesMapping[j]];
                    
                    // If special cases.
                    if (this._useInGammaSpace || byteArray) {
                        for (var i = 0; i < this._size * this._size; i++) {
                             
                            // Put in gamma space if requested.
                            if (this._useInGammaSpace) {
                                dataFace[(i * 3) + 0] = Math.pow(dataFace[(i * 3) + 0], BABYLON.ToGammaSpace);
                                dataFace[(i * 3) + 1] = Math.pow(dataFace[(i * 3) + 1], BABYLON.ToGammaSpace);
                                dataFace[(i * 3) + 2] = Math.pow(dataFace[(i * 3) + 2], BABYLON.ToGammaSpace);
                            }
                             
                            // Convert to int texture for fallback.
                            if (byteArray) {
                                // R
                                byteArray[(i * 3) + 0] = dataFace[(i * 3) + 0] * 255;
                                byteArray[(i * 3) + 0] = Math.min(255, byteArray[(i * 3) + 0]);
                                // G
                                byteArray[(i * 3) + 1] = dataFace[(i * 3) + 1] * 255;
                                byteArray[(i * 3) + 1] = Math.min(255, byteArray[(i * 3) + 1]);
                                // B
                                byteArray[(i * 3) + 2] = dataFace[(i * 3) + 2] * 255;
                                byteArray[(i * 3) + 2] = Math.min(255, byteArray[(i * 3) + 2]);
                            }
                        }
                    }

                    results.push(dataFace);
                }
                return results;
            }

            var mipmapGenerator = null;
            if (!this._noMipmap && this._usePMREMGenerator) {
                mipmapGenerator = (data: ArrayBufferView[]) => {
                    // Custom setup of the generator matching with the PBR shader values.
                    var generator = new BABYLON.Internals.PMREMGenerator(data,
                        this._size,
                        this._size,
                        0,
                        3,
                        this.getScene().getEngine().getCaps().textureFloat,
                        2048,
                        0.25,
                        false,
                        true);

                    return generator.filterCubeMap();
                };
            }

            this._texture = (<any>this.getScene().getEngine()).createRawCubeTexture(this.url, this.getScene(), this._size, Engine.TEXTUREFORMAT_RGB, Engine.TEXTURETYPE_FLOAT, this._noMipmap, callback, mipmapGenerator);
        }

        public clone(): HDRCubeTexture {
            var newTexture = new HDRCubeTexture(this.url, this.getScene(), this._size, this._noMipmap,
                this._generateHarmonics, this._useInGammaSpace, this._usePMREMGenerator);

            // Base texture
            newTexture.level = this.level;
            newTexture.wrapU = this.wrapU;
            newTexture.wrapV = this.wrapV;
            newTexture.coordinatesIndex = this.coordinatesIndex;
            newTexture.coordinatesMode = this.coordinatesMode;

            return newTexture;
        }

        // Methods
        public delayLoad(): void {
            if (this.delayLoadState !== Engine.DELAYLOADSTATE_NOTLOADED) {
                return;
            }

            this.delayLoadState = Engine.DELAYLOADSTATE_LOADED;
            this._texture = this._getFromCache(this.url, this._noMipmap);

            if (!this._texture) {
                this.loadTexture();
            }
        }

        public getReflectionTextureMatrix(): Matrix {
            return this._textureMatrix;
        }

        public static Parse(parsedTexture: any, scene: Scene, rootUrl: string): HDRCubeTexture {
            var texture = null;
            if (parsedTexture.name && !parsedTexture.isRenderTarget) {
                texture = new BABYLON.HDRCubeTexture(rootUrl + parsedTexture.name, scene, parsedTexture.size,
                    texture.generateHarmonics, texture.useInGammaSpace, texture.usePMREMGenerator);
                texture.name = parsedTexture.name;
                texture.hasAlpha = parsedTexture.hasAlpha;
                texture.level = parsedTexture.level;
                texture.coordinatesMode = parsedTexture.coordinatesMode;
            }
            return texture;
        }

        public serialize(): any {
            if (!this.name) {
                return null;
            }

            var serializationObject: any = {};
            serializationObject.name = this.name;
            serializationObject.hasAlpha = this.hasAlpha;
            serializationObject.isCube = true;
            serializationObject.level = this.level;
            serializationObject.size = this._size;
            serializationObject.coordinatesMode = this.coordinatesMode;
            serializationObject.useInGammaSpace = this._useInGammaSpace;
            serializationObject.generateHarmonics = this._generateHarmonics;
            serializationObject.usePMREMGenerator = this._usePMREMGenerator;

            return serializationObject;
        }
    }
} 

