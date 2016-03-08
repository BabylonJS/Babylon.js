var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    /**
     * This represents a texture coming from an HDR input.
     *
     * The only supported format is currently panorama picture stored in RGBE format.
     * Example of such files can be found on HDRLib: http://hdrlib.com/
     */
    var HDRCubeTexture = (function (_super) {
        __extends(HDRCubeTexture, _super);
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
        function HDRCubeTexture(url, scene, size, noMipmap, generateHarmonics, useInGammaSpace, usePMREMGenerator) {
            if (noMipmap === void 0) { noMipmap = false; }
            if (generateHarmonics === void 0) { generateHarmonics = true; }
            if (useInGammaSpace === void 0) { useInGammaSpace = false; }
            if (usePMREMGenerator === void 0) { usePMREMGenerator = false; }
            _super.call(this, scene);
            this._useInGammaSpace = false;
            this._generateHarmonics = true;
            /**
             * The texture coordinates mode. As this texture is stored in a cube format, please modify carefully.
             */
            this.coordinatesMode = BABYLON.Texture.CUBIC_MODE;
            /**
             * The spherical polynomial data extracted from the texture.
             */
            this.sphericalPolynomial = null;
            /**
             * Specifies wether the texture has been generated through the PMREMGenerator tool.
             * This is usefull at run time to apply the good shader.
             */
            this.isPMREM = false;
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
                }
                else {
                    this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_NOTLOADED;
                }
            }
            this.isCube = true;
            this._textureMatrix = BABYLON.Matrix.Identity();
        }
        HDRCubeTexture.prototype.loadTexture = function () {
            var _this = this;
            var callback = function (buffer) {
                // Extract the raw linear data.
                var data = BABYLON.Internals.HDRTools.GetCubeMapTextureData(buffer, _this._size);
                // Generate harmonics if needed.
                if (_this._generateHarmonics) {
                    _this.sphericalPolynomial = BABYLON.Internals.CubeMapToSphericalPolynomialTools.ConvertCubeMapToSphericalPolynomial(data);
                }
                var results = [];
                var byteArray = null;
                // Create uintarray fallback.
                if (!_this.getScene().getEngine().getCaps().textureFloat) {
                    // 3 channels of 1 bytes per pixel in bytes.
                    var byteBuffer = new ArrayBuffer(_this._size * _this._size * 3);
                    byteArray = new Uint8Array(byteBuffer);
                }
                // Push each faces.
                for (var j = 0; j < 6; j++) {
                    var dataFace = data[HDRCubeTexture._facesMapping[j]];
                    // If special cases.
                    if (_this._useInGammaSpace || byteArray) {
                        for (var i = 0; i < _this._size * _this._size; i++) {
                            // Put in gamma space if requested.
                            if (_this._useInGammaSpace) {
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
            };
            var mipmapGenerator = null;
            if (!this._noMipmap && this._usePMREMGenerator) {
                mipmapGenerator = function (data) {
                    // Custom setup of the generator matching with the PBR shader values.
                    var generator = new BABYLON.Internals.PMREMGenerator(data, _this._size, _this._size, 0, 3, _this.getScene().getEngine().getCaps().textureFloat, 2048, 0.25, false, true);
                    return generator.filterCubeMap();
                };
            }
            this._texture = this.getScene().getEngine().createRawCubeTexture(this.url, this.getScene(), this._size, BABYLON.Engine.TEXTUREFORMAT_RGB, BABYLON.Engine.TEXTURETYPE_FLOAT, this._noMipmap, callback, mipmapGenerator);
        };
        HDRCubeTexture.prototype.clone = function () {
            var newTexture = new HDRCubeTexture(this.url, this.getScene(), this._size, this._noMipmap, this._generateHarmonics, this._useInGammaSpace, this._usePMREMGenerator);
            // Base texture
            newTexture.level = this.level;
            newTexture.wrapU = this.wrapU;
            newTexture.wrapV = this.wrapV;
            newTexture.coordinatesIndex = this.coordinatesIndex;
            newTexture.coordinatesMode = this.coordinatesMode;
            return newTexture;
        };
        // Methods
        HDRCubeTexture.prototype.delayLoad = function () {
            if (this.delayLoadState !== BABYLON.Engine.DELAYLOADSTATE_NOTLOADED) {
                return;
            }
            this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_LOADED;
            this._texture = this._getFromCache(this.url, this._noMipmap);
            if (!this._texture) {
                this.loadTexture();
            }
        };
        HDRCubeTexture.prototype.getReflectionTextureMatrix = function () {
            return this._textureMatrix;
        };
        HDRCubeTexture.Parse = function (parsedTexture, scene, rootUrl) {
            var texture = null;
            if (parsedTexture.name && !parsedTexture.isRenderTarget) {
                texture = new BABYLON.HDRCubeTexture(rootUrl + parsedTexture.name, scene, parsedTexture.size, texture.generateHarmonics, texture.useInGammaSpace, texture.usePMREMGenerator);
                texture.name = parsedTexture.name;
                texture.hasAlpha = parsedTexture.hasAlpha;
                texture.level = parsedTexture.level;
                texture.coordinatesMode = parsedTexture.coordinatesMode;
            }
            return texture;
        };
        HDRCubeTexture.prototype.serialize = function () {
            if (!this.name) {
                return null;
            }
            var serializationObject = {};
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
        };
        HDRCubeTexture._facesMapping = [
            "right",
            "up",
            "front",
            "left",
            "down",
            "back"
        ];
        return HDRCubeTexture;
    }(BABYLON.BaseTexture));
    BABYLON.HDRCubeTexture = HDRCubeTexture;
})(BABYLON || (BABYLON = {}));
