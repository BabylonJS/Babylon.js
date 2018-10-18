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

        private _generateHarmonics = true;
        private _noMipmap: boolean;
        private _textureMatrix: Matrix;
        private _size: number;
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

        protected _rotationY: number = 0;
        /**
         * Sets texture matrix rotation angle around Y axis in radians.
         */
        public set rotationY(value: number) {
            this._rotationY = value;
            this.setReflectionTextureMatrix(BABYLON.Matrix.RotationY(this._rotationY));
        }
        /**
         * Gets texture matrix rotation angle around Y axis radians.
         */
        public get rotationY(): number {
            return this._rotationY;
        }

        /**
         * Gets or sets the center of the bounding box associated with the cube texture
         * It must define where the camera used to render the texture was set
         */
        public boundingBoxPosition = Vector3.Zero();

        private _boundingBoxSize: Vector3;

        /**
         * Gets or sets the size of the bounding box associated with the cube texture
         * When defined, the cubemap will switch to local mode
         * @see https://community.arm.com/graphics/b/blog/posts/reflections-based-on-local-cubemaps-in-unity
         * @example https://www.babylonjs-playground.com/#RNASML
         */
        public set boundingBoxSize(value: Vector3) {
            if (this._boundingBoxSize && this._boundingBoxSize.equals(value)) {
                return;
            }
            this._boundingBoxSize = value;
            let scene = this.getScene();
            if (scene) {
                scene.markAllMaterialsAsDirty(Material.TextureDirtyFlag);
            }
        }
        public get boundingBoxSize(): Vector3 {
            return this._boundingBoxSize;
        }

        /**
         * Instantiates an HDRTexture from the following parameters.
         *
         * @param url The location of the HDR raw data (Panorama stored in RGBE format)
         * @param scene The scene the texture will be used in
         * @param size The cubemap desired size (the more it increases the longer the generation will be)
         * @param noMipmap Forces to not generate the mipmap if true
         * @param generateHarmonics Specifies whether you want to extract the polynomial harmonics during the generation process
         * @param gammaSpace Specifies if the texture will be use in gamma or linear space (the PBR material requires those texture in linear space, but the standard material would require them in Gamma space)
         * @param reserved Reserved flag for internal use.
         */
        constructor(url: string, scene: Scene, size: number, noMipmap = false, generateHarmonics = true, gammaSpace = false, reserved = false, onLoad: Nullable<() => void> = null, onError: Nullable<(message?: string, exception?: any) => void> = null) {
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
            this.gammaSpace = gammaSpace;

            this._noMipmap = noMipmap;
            this._size = size;

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
         * Occurs when the file is raw .hdr file.
         */
        private loadTexture() {
            var callback = (buffer: ArrayBuffer): Nullable<ArrayBufferView[]> => {

                this.lodGenerationOffset = 0.0;
                this.lodGenerationScale = 0.8;

                let scene = this.getScene();

                if (!scene) {
                    return null;
                }
                // Extract the raw linear data.
                var data = HDRTools.GetCubeMapTextureData(buffer, this._size);

                // Generate harmonics if needed.
                if (this._generateHarmonics) {
                    var sphericalPolynomial = CubeMapToSphericalPolynomialTools.ConvertCubeMapToSphericalPolynomial(data);
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
                    if (this.gammaSpace || byteArray) {
                        for (var i = 0; i < this._size * this._size; i++) {

                            // Put in gamma space if requested.
                            if (this.gammaSpace) {
                                dataFace[(i * 3) + 0] = Math.pow(dataFace[(i * 3) + 0], ToGammaSpace);
                                dataFace[(i * 3) + 1] = Math.pow(dataFace[(i * 3) + 1], ToGammaSpace);
                                dataFace[(i * 3) + 2] = Math.pow(dataFace[(i * 3) + 2], ToGammaSpace);
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
            };

            let scene = this.getScene();
            if (scene) {
                this._texture = scene.getEngine().createRawCubeTextureFromUrl(this.url, scene, this._size,
                    Engine.TEXTUREFORMAT_RGB,
                    scene.getEngine().getCaps().textureFloat ? Engine.TEXTURETYPE_FLOAT : Engine.TEXTURETYPE_UNSIGNED_INT,
                    this._noMipmap,
                    callback,
                    null, this._onLoad, this._onError);
            }
        }

        public clone(): HDRCubeTexture {
            let scene = this.getScene();
            if (!scene) {
                return this;
            }

            var newTexture = new HDRCubeTexture(this.url, scene, this._size, this._noMipmap,
                this._generateHarmonics, this.gammaSpace);

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

        /**
         * Get the texture reflection matrix used to rotate/transform the reflection.
         * @returns the reflection matrix
         */
        public getReflectionTextureMatrix(): Matrix {
            return this._textureMatrix;
        }

        /**
         * Set the texture reflection matrix used to rotate/transform the reflection.
         * @param value Define the reflection matrix to set
         */
        public setReflectionTextureMatrix(value: Matrix): void {
            this._textureMatrix = value;
        }

        /**
         * Parses a JSON representation of an HDR Texture in order to create the texture
         * @param parsedTexture Define the JSON representation
         * @param scene Define the scene the texture should be created in
         * @param rootUrl Define the root url in case we need to load relative dependencies
         * @returns the newly created texture after parsing
         */
        public static Parse(parsedTexture: any, scene: Scene, rootUrl: string): Nullable<HDRCubeTexture> {
            var texture = null;
            if (parsedTexture.name && !parsedTexture.isRenderTarget) {
                texture = new HDRCubeTexture(rootUrl + parsedTexture.name, scene, parsedTexture.size, parsedTexture.noMipmap,
                    parsedTexture.generateHarmonics, parsedTexture.useInGammaSpace);
                texture.name = parsedTexture.name;
                texture.hasAlpha = parsedTexture.hasAlpha;
                texture.level = parsedTexture.level;
                texture.coordinatesMode = parsedTexture.coordinatesMode;
                texture.isBlocking = parsedTexture.isBlocking;
            }
            if (texture) {
                if (parsedTexture.boundingBoxPosition) {
                    (<any>texture).boundingBoxPosition = Vector3.FromArray(parsedTexture.boundingBoxPosition);
                }
                if (parsedTexture.boundingBoxSize) {
                    (<any>texture).boundingBoxSize = Vector3.FromArray(parsedTexture.boundingBoxSize);
                }
                if (parsedTexture.rotationY) {
                    (<any>texture).rotationY = parsedTexture.rotationY;
                }
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
            serializationObject.useInGammaSpace = this.gammaSpace;
            serializationObject.generateHarmonics = this._generateHarmonics;
            serializationObject.customType = "BABYLON.HDRCubeTexture";
            serializationObject.noMipmap = this._noMipmap;
            serializationObject.isBlocking = this._isBlocking;
            serializationObject.rotationY = this._rotationY;

            return serializationObject;
        }
    }
}
