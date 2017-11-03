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
            "left",
            "up",
            "down",
            "front",
            "back"
        ];

        private _useInGammaSpace = false;
        private _generateHarmonics = true;
        private _noMipmap: boolean;
        private _textureMatrix: Matrix;
        private _size: number;
        private _usePMREMGenerator: boolean;
        private _isBABYLONPreprocessed = false;
        private _onLoad: Nullable<() => void> = null;
        private _onError: Nullable<() => void> = null;

        /**
         * The texture URL.
         */
        public url: string;

        /**
         * The texture coordinates mode. As this texture is stored in a cube format, please modify carefully.
         */
        public coordinatesMode = Texture.CUBIC_MODE;

        /**
         * Specifies wether the texture has been generated through the PMREMGenerator tool.
         * This is usefull at run time to apply the good shader.
         */
        public isPMREM = false;

        protected _isBlocking: boolean = true;
        /**
         * Sets wether or not the texture is blocking during loading.
         */
        public set isBlocking(value: boolean) {
            this._isBlocking = value;
        }
        /**
         * Gets wether or not the texture is blocking during loading.
         */
        public get isBlocking(): boolean {
            return this._isBlocking;
        }

        /**
         * Instantiates an HDRTexture from the following parameters.
         * 
         * @param url The location of the HDR raw data (Panorama stored in RGBE format)
         * @param scene The scene the texture will be used in
         * @param size The cubemap desired size (the more it increases the longer the generation will be) If the size is omitted this implies you are using a preprocessed cubemap.
         * @param noMipmap Forces to not generate the mipmap if true
         * @param generateHarmonics Specifies wether you want to extract the polynomial harmonics during the generation process
         * @param useInGammaSpace Specifies if the texture will be use in gamma or linear space (the PBR material requires those texture in linear space, but the standard material would require them in Gamma space)
         * @param usePMREMGenerator Specifies wether or not to generate the CubeMap through CubeMapGen to avoid seams issue at run time.
         */
        constructor(url: string, scene: Scene, size?: number, noMipmap = false, generateHarmonics = true, useInGammaSpace = false, usePMREMGenerator = false, onLoad: Nullable<() => void> = null, onError: Nullable<(message?: string, exception?: any) => void> = null) {
            super(scene);

            if (!url) {
                return;
            }

            this.name = url;
            this.url = url;
            this.hasAlpha = false;
            this.isCube = true;
            this._textureMatrix = Matrix.Identity();
            this._onLoad = onLoad;
            this._onError = onError;
            this.gammaSpace = false;

            let caps = scene.getEngine().getCaps();

            if (size) {
                this._isBABYLONPreprocessed = false;
                this._noMipmap = noMipmap;
                this._size = size;
                this._useInGammaSpace = useInGammaSpace;
                this._usePMREMGenerator = usePMREMGenerator &&
                        caps.textureLOD &&
                        caps.textureFloat &&
                    !this._useInGammaSpace;
            }
            else {
                this._isBABYLONPreprocessed = true;
                this._noMipmap = false;
                this._useInGammaSpace = false;
                this._usePMREMGenerator = caps.textureLOD && caps.textureFloat &&
                    !this._useInGammaSpace;
            }
            this.isPMREM = this._usePMREMGenerator;

            this._texture = this._getFromCache(url, this._noMipmap);

            if (!this._texture) {
                if (!scene.useDelayedTextureLoading) {
                    this.loadTexture();
                } else {
                    this.delayLoadState = Engine.DELAYLOADSTATE_NOTLOADED;
                }
            }
        }

        /**
         * Occurs when the file is a preprocessed .babylon.hdr file.
         */
        private loadBabylonTexture() {

            var mipLevels = 0;
            var floatArrayView: Nullable<Float32Array> = null;
            let scene = this.getScene();

            var mipmapGenerator = (!this._useInGammaSpace && scene && scene.getEngine().getCaps().textureFloat) ? (data: ArrayBufferView[]): Array<Array<Float32Array>> => {
                var mips = new Array<Array<Float32Array>>();

                if (!floatArrayView) {
                    return mips;
                }
                var startIndex = 30;
                for (var level = 0; level < mipLevels; level++) {
                    mips.push([]);
                    // Fill each pixel of the mip level.
                    var faceSize = Math.pow(this._size >> level, 2) * 3;
                    for (var faceIndex = 0; faceIndex < 6; faceIndex++) {

                        var faceData = floatArrayView.subarray(startIndex, startIndex + faceSize);
                        mips[level].push(faceData);

                        startIndex += faceSize;
                    }
                }

                return mips;
            } : null;

            var callback = (buffer: ArrayBuffer) => {
                let scene = this.getScene();

                if (!scene) {
                    return null;
                }
                // Create Native Array Views
                var intArrayView = new Int32Array(buffer);
                floatArrayView = new Float32Array(buffer);

                // Fill header.
                var version = intArrayView[0]; // Version 1. (MAy be use in case of format changes for backward compaibility)
                this._size = intArrayView[1]; // CubeMap max mip face size.

                // Update Texture Information.
                if (!this._texture) {
                    return null;
                }
                this._texture.updateSize(this._size, this._size);

                // Fill polynomial information.
                var sphericalPolynomial = new SphericalPolynomial();
                sphericalPolynomial.x.copyFromFloats(floatArrayView[2], floatArrayView[3], floatArrayView[4]);
                sphericalPolynomial.y.copyFromFloats(floatArrayView[5], floatArrayView[6], floatArrayView[7]);
                sphericalPolynomial.z.copyFromFloats(floatArrayView[8], floatArrayView[9], floatArrayView[10]);
                sphericalPolynomial.xx.copyFromFloats(floatArrayView[11], floatArrayView[12], floatArrayView[13]);
                sphericalPolynomial.yy.copyFromFloats(floatArrayView[14], floatArrayView[15], floatArrayView[16]);
                sphericalPolynomial.zz.copyFromFloats(floatArrayView[17], floatArrayView[18], floatArrayView[19]);
                sphericalPolynomial.xy.copyFromFloats(floatArrayView[20], floatArrayView[21], floatArrayView[22]);
                sphericalPolynomial.yz.copyFromFloats(floatArrayView[23], floatArrayView[24], floatArrayView[25]);
                sphericalPolynomial.zx.copyFromFloats(floatArrayView[26], floatArrayView[27], floatArrayView[28]);
                this.sphericalPolynomial = sphericalPolynomial;

                // Fill pixel data.
                mipLevels = intArrayView[29]; // Number of mip levels.
                var startIndex = 30;
                var data = [];
                var faceSize = Math.pow(this._size, 2) * 3;
                for (var faceIndex = 0; faceIndex < 6; faceIndex++) {
                    data.push(floatArrayView.subarray(startIndex, startIndex + faceSize));
                    startIndex += faceSize;
                }

                var results = [];
                var byteArray: Nullable<Uint8Array> = null;

                // Push each faces.
                for (var k = 0; k < 6; k++) {
                    var dataFace = null;

                    // To be deprecated.
                    if (version === 1) {
                        var j = ([0, 2, 4, 1, 3, 5])[k]; // Transforms +X+Y+Z... to +X-X+Y-Y...
                        dataFace = data[j];
                    }

                    // If special cases.
                    if (!mipmapGenerator && dataFace) {
                        if (!scene.getEngine().getCaps().textureFloat) {
                            // 3 channels of 1 bytes per pixel in bytes.
                            var byteBuffer = new ArrayBuffer(faceSize);
                            byteArray = new Uint8Array(byteBuffer);
                        }

                        for (var i = 0; i < this._size * this._size; i++) {

                            // Put in gamma space if requested.
                            if (this._useInGammaSpace) {
                                dataFace[(i * 3) + 0] = Math.pow(dataFace[(i * 3) + 0], BABYLON.ToGammaSpace);
                                dataFace[(i * 3) + 1] = Math.pow(dataFace[(i * 3) + 1], BABYLON.ToGammaSpace);
                                dataFace[(i * 3) + 2] = Math.pow(dataFace[(i * 3) + 2], BABYLON.ToGammaSpace);
                            }

                            // Convert to int texture for fallback.
                            if (byteArray) {

                                var r = Math.max(dataFace[(i * 3) + 0] * 255, 0);
                                var g = Math.max(dataFace[(i * 3) + 1] * 255, 0);
                                var b = Math.max(dataFace[(i * 3) + 2] * 255, 0);

                                // May use luminance instead if the result is not accurate.
                                var max = Math.max(Math.max(r, g), b);
                                if (max > 255) {
                                    var scale = 255 / max;
                                    r *= scale;
                                    g *= scale;
                                    b *= scale;
                                }

                                byteArray[(i * 3) + 0] = r;
                                byteArray[(i * 3) + 1] = g;
                                byteArray[(i * 3) + 2] = b;
                            }
                        }
                    }

                    // Fill the array accordingly.
                    if (byteArray) {
                        results.push(byteArray);
                    }
                    else {
                        results.push(dataFace);
                    }
                }

                return results;
            }

            if (scene) {
                this._texture = (<any>scene.getEngine()).createRawCubeTextureFromUrl(this.url, scene, this._size,
                    Engine.TEXTUREFORMAT_RGB,
                    scene.getEngine().getCaps().textureFloat ? BABYLON.Engine.TEXTURETYPE_FLOAT : BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT,
                    this._noMipmap,
                    callback,
                    mipmapGenerator, this._onLoad, this._onError);
            }
        }

        /**
         * Occurs when the file is raw .hdr file.
         */
        private loadHDRTexture() {
            var callback = (buffer: ArrayBuffer): Nullable<ArrayBufferView[]> => {
                let scene = this.getScene();

                if (!scene) {
                    return null;
                }
                // Extract the raw linear data.
                var data = BABYLON.Internals.HDRTools.GetCubeMapTextureData(buffer, this._size);

                // Generate harmonics if needed.
                if (this._generateHarmonics) {
                    var sphericalPolynomial = BABYLON.Internals.CubeMapToSphericalPolynomialTools.ConvertCubeMapToSphericalPolynomial(data);
                    this.sphericalPolynomial = sphericalPolynomial;
                }

                var results = [];
                var byteArray: Nullable<Uint8Array> = null;

                // Push each faces.
                for (var j = 0; j < 6; j++) {

                    // Create uintarray fallback.
                    if (!scene.getEngine().getCaps().textureFloat) {
                        // 3 channels of 1 bytes per pixel in bytes.
                        var byteBuffer = new ArrayBuffer(this._size * this._size * 3);
                        byteArray = new Uint8Array(byteBuffer);
                    }

                    var dataFace = <Float32Array>((<any>data)[HDRCubeTexture._facesMapping[j]]);

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
                                var r = Math.max(dataFace[(i * 3) + 0] * 255, 0);
                                var g = Math.max(dataFace[(i * 3) + 1] * 255, 0);
                                var b = Math.max(dataFace[(i * 3) + 2] * 255, 0);

                                // May use luminance instead if the result is not accurate.
                                var max = Math.max(Math.max(r, g), b);
                                if (max > 255) {
                                    var scale = 255 / max;
                                    r *= scale;
                                    g *= scale;
                                    b *= scale;
                                }

                                byteArray[(i * 3) + 0] = r;
                                byteArray[(i * 3) + 1] = g;
                                byteArray[(i * 3) + 2] = b;
                            }
                        }
                    }

                    if (byteArray) {
                        results.push(byteArray);
                    }
                    else {
                        results.push(dataFace);
                    }
                }
                return results;
            }

            var mipmapGenerator = null;

            // TODO. Implement In code PMREM Generator following the LYS toolset generation.
            // if (!this._noMipmap &&
            //     this._usePMREMGenerator) {
            //     mipmapGenerator = (data: ArrayBufferView[]) => {
            //         // Custom setup of the generator matching with the PBR shader values.
            //         var generator = new BABYLON.Internals.PMREMGenerator(data,
            //             this._size,
            //             this._size,
            //             0,
            //             3,
            //             this.getScene().getEngine().getCaps().textureFloat,
            //             2048,
            //             0.25,
            //             false,
            //             true);

            //         return generator.filterCubeMap();
            //     };
            // }
            let scene = this.getScene();

            if (scene) {
                this._texture = scene.getEngine().createRawCubeTextureFromUrl(this.url, scene, this._size,
                    Engine.TEXTUREFORMAT_RGB,
                    scene.getEngine().getCaps().textureFloat ? BABYLON.Engine.TEXTURETYPE_FLOAT : BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT,
                    this._noMipmap,
                    callback,
                    mipmapGenerator, this._onLoad, this._onError);
            }
        }

        /**
         * Starts the loading process of the texture.
         */
        private loadTexture() {
            if (this._isBABYLONPreprocessed) {
                this.loadBabylonTexture();
            }
            else {
                this.loadHDRTexture();
            }
        }

        public clone(): HDRCubeTexture {
            let scene = this.getScene();
            if (!scene) {
                return this;
            }

            var size = <number>(this._isBABYLONPreprocessed ? null : this._size);
            var newTexture = new HDRCubeTexture(this.url, scene, size, this._noMipmap,
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

        public setReflectionTextureMatrix(value: Matrix): void {
            this._textureMatrix = value;
        }

        public static Parse(parsedTexture: any, scene: Scene, rootUrl: string): Nullable<HDRCubeTexture> {
            var texture = null;
            if (parsedTexture.name && !parsedTexture.isRenderTarget) {
                var size = parsedTexture.isBABYLONPreprocessed ? null : parsedTexture.size;
                texture = new BABYLON.HDRCubeTexture(rootUrl + parsedTexture.name, scene, size, parsedTexture.noMipmap,
                    parsedTexture.generateHarmonics, parsedTexture.useInGammaSpace, parsedTexture.usePMREMGenerator);
                texture.name = parsedTexture.name;
                texture.hasAlpha = parsedTexture.hasAlpha;
                texture.level = parsedTexture.level;
                texture.coordinatesMode = parsedTexture.coordinatesMode;
                texture.isBlocking = parsedTexture.isBlocking;
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
            serializationObject.isBABYLONPreprocessed = this._isBABYLONPreprocessed;
            serializationObject.customType = "BABYLON.HDRCubeTexture";
            serializationObject.noMipmap = this._noMipmap;
            serializationObject.isBlocking = this._isBlocking;

            return serializationObject;
        }

        /**
         * Saves as a file the data contained in the texture in a binary format.
         * This can be used to prevent the long loading tie associated with creating the seamless texture as well
         * as the spherical used in the lighting.
         * @param url The HDR file url.
         * @param size The size of the texture data to generate (one of the cubemap face desired width).
         * @param onError Method called if any error happens during download.
         * @return The packed binary data.
         */
        public static generateBabylonHDROnDisk(url: string, size: number, onError: Nullable<(() => void)> = null): void {
            var callback = function (buffer: ArrayBuffer) {
                var data = new Blob([buffer], { type: 'application/octet-stream' });

                // Returns a URL you can use as a href.
                var objUrl = window.URL.createObjectURL(data);

                // Simulates a link to it and click to dowload.
                var a = document.createElement("a");
                document.body.appendChild(a);
                a.style.display = "none";
                a.href = objUrl;
                (<any>a).download = "envmap.babylon.hdr";
                a.click();
            };

            HDRCubeTexture.generateBabylonHDR(url, size, callback, onError);
        }

        /**
         * Serializes the data contained in the texture in a binary format.
         * This can be used to prevent the long loading tie associated with creating the seamless texture as well
         * as the spherical used in the lighting.
         * @param url The HDR file url.
         * @param size The size of the texture data to generate (one of the cubemap face desired width).
         * @param onError Method called if any error happens during download.
         * @return The packed binary data.
         */
        public static generateBabylonHDR(url: string, size: number, callback: ((ArrayBuffer: ArrayBuffer) => void), onError: Nullable<(() => void)> = null): void {
            // Needs the url tho create the texture.
            if (!url) {
                return;
            }

            // Check Power of two size.
            if (!Tools.IsExponentOfTwo(size)) { // Need to check engine.needPOTTextures 
                return;
            }

            // Coming Back in 3.x.
            Tools.Error("Generation of Babylon HDR is coming back in 3.1.");
        }
    }
}
