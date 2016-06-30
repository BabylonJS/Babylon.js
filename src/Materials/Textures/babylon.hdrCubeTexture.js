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
         * @param size The cubemap desired size (the more it increases the longer the generation will be) If the size is omitted this implies you are using a preprocessed cubemap.
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
            this._isBABYLONPreprocessed = false;
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
            if (!url) {
                return;
            }
            this.name = url;
            this.url = url;
            this.hasAlpha = false;
            this.isCube = true;
            this._textureMatrix = BABYLON.Matrix.Identity();
            if (size) {
                this._isBABYLONPreprocessed = false;
                this._noMipmap = noMipmap;
                this._size = size;
                this._useInGammaSpace = useInGammaSpace;
                this._usePMREMGenerator = usePMREMGenerator &&
                    scene.getEngine().getCaps().textureLOD &&
                    this.getScene().getEngine().getCaps().textureFloat &&
                    !this._useInGammaSpace;
            }
            else {
                this._isBABYLONPreprocessed = true;
                this._noMipmap = false;
                this._useInGammaSpace = false;
                this._usePMREMGenerator = scene.getEngine().getCaps().textureLOD &&
                    this.getScene().getEngine().getCaps().textureFloat &&
                    !this._useInGammaSpace;
            }
            this.isPMREM = this._usePMREMGenerator;
            this._texture = this._getFromCache(url, this._noMipmap);
            if (!this._texture) {
                if (!scene.useDelayedTextureLoading) {
                    this.loadTexture();
                }
                else {
                    this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_NOTLOADED;
                }
            }
        }
        /**
         * Occurs when the file is a preprocessed .babylon.hdr file.
         */
        HDRCubeTexture.prototype.loadBabylonTexture = function () {
            var _this = this;
            var mipLevels = 0;
            var floatArrayView = null;
            var mipmapGenerator = (!this._useInGammaSpace && this.getScene().getEngine().getCaps().textureFloat) ? function (data) {
                var mips = [];
                var startIndex = 30;
                for (var level = 0; level < mipLevels; level++) {
                    mips.push([]);
                    // Fill each pixel of the mip level.
                    var faceSize = Math.pow(_this._size >> level, 2) * 3;
                    for (var faceIndex = 0; faceIndex < 6; faceIndex++) {
                        var faceData = floatArrayView.subarray(startIndex, startIndex + faceSize);
                        mips[level].push(faceData);
                        startIndex += faceSize;
                    }
                }
                return mips;
            } : null;
            var callback = function (buffer) {
                // Create Native Array Views
                var intArrayView = new Int32Array(buffer);
                floatArrayView = new Float32Array(buffer);
                // Fill header.
                var version = intArrayView[0]; // Version 1. (MAy be use in case of format changes for backward compaibility)
                _this._size = intArrayView[1]; // CubeMap max mip face size.
                // Update Texture Information.
                _this.getScene().getEngine().updateTextureSize(_this._texture, _this._size, _this._size);
                // Fill polynomial information.
                _this.sphericalPolynomial = new BABYLON.SphericalPolynomial();
                _this.sphericalPolynomial.x.copyFromFloats(floatArrayView[2], floatArrayView[3], floatArrayView[4]);
                _this.sphericalPolynomial.y.copyFromFloats(floatArrayView[5], floatArrayView[6], floatArrayView[7]);
                _this.sphericalPolynomial.z.copyFromFloats(floatArrayView[8], floatArrayView[9], floatArrayView[10]);
                _this.sphericalPolynomial.xx.copyFromFloats(floatArrayView[11], floatArrayView[12], floatArrayView[13]);
                _this.sphericalPolynomial.yy.copyFromFloats(floatArrayView[14], floatArrayView[15], floatArrayView[16]);
                _this.sphericalPolynomial.zz.copyFromFloats(floatArrayView[17], floatArrayView[18], floatArrayView[19]);
                _this.sphericalPolynomial.xy.copyFromFloats(floatArrayView[20], floatArrayView[21], floatArrayView[22]);
                _this.sphericalPolynomial.yz.copyFromFloats(floatArrayView[23], floatArrayView[24], floatArrayView[25]);
                _this.sphericalPolynomial.zx.copyFromFloats(floatArrayView[26], floatArrayView[27], floatArrayView[28]);
                // Fill pixel data.
                mipLevels = intArrayView[29]; // Number of mip levels.
                var startIndex = 30;
                var data = [];
                var faceSize = Math.pow(_this._size, 2) * 3;
                for (var faceIndex = 0; faceIndex < 6; faceIndex++) {
                    data.push(floatArrayView.subarray(startIndex, startIndex + faceSize));
                    startIndex += faceSize;
                }
                var results = [];
                var byteArray = null;
                // Push each faces.
                for (var k = 0; k < 6; k++) {
                    var dataFace = null;
                    // If special cases.
                    if (!mipmapGenerator) {
                        var j = ([0, 2, 4, 1, 3, 5])[k]; // Transforms +X+Y+Z... to +X-X+Y-Y... if no mipmapgenerator...
                        dataFace = data[j];
                        if (!_this.getScene().getEngine().getCaps().textureFloat) {
                            // 3 channels of 1 bytes per pixel in bytes.
                            var byteBuffer = new ArrayBuffer(faceSize);
                            byteArray = new Uint8Array(byteBuffer);
                        }
                        for (var i = 0; i < _this._size * _this._size; i++) {
                            // Put in gamma space if requested.
                            if (_this._useInGammaSpace) {
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
                    else {
                        dataFace = data[k];
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
            };
            this._texture = this.getScene().getEngine().createRawCubeTexture(this.url, this.getScene(), this._size, BABYLON.Engine.TEXTUREFORMAT_RGB, this.getScene().getEngine().getCaps().textureFloat ? BABYLON.Engine.TEXTURETYPE_FLOAT : BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT, this._noMipmap, callback, mipmapGenerator);
        };
        /**
         * Occurs when the file is raw .hdr file.
         */
        HDRCubeTexture.prototype.loadHDRTexture = function () {
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
                // Push each faces.
                for (var j = 0; j < 6; j++) {
                    // Create uintarray fallback.
                    if (!_this.getScene().getEngine().getCaps().textureFloat) {
                        // 3 channels of 1 bytes per pixel in bytes.
                        var byteBuffer = new ArrayBuffer(_this._size * _this._size * 3);
                        byteArray = new Uint8Array(byteBuffer);
                    }
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
            var mipmapGenerator = null;
            if (!this._noMipmap &&
                this._usePMREMGenerator) {
                mipmapGenerator = function (data) {
                    // Custom setup of the generator matching with the PBR shader values.
                    var generator = new BABYLON.Internals.PMREMGenerator(data, _this._size, _this._size, 0, 3, _this.getScene().getEngine().getCaps().textureFloat, 2048, 0.25, false, true);
                    return generator.filterCubeMap();
                };
            }
            this._texture = this.getScene().getEngine().createRawCubeTexture(this.url, this.getScene(), this._size, BABYLON.Engine.TEXTUREFORMAT_RGB, this.getScene().getEngine().getCaps().textureFloat ? BABYLON.Engine.TEXTURETYPE_FLOAT : BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT, this._noMipmap, callback, mipmapGenerator);
        };
        /**
         * Starts the loading process of the texture.
         */
        HDRCubeTexture.prototype.loadTexture = function () {
            if (this._isBABYLONPreprocessed) {
                this.loadBabylonTexture();
            }
            else {
                this.loadHDRTexture();
            }
        };
        HDRCubeTexture.prototype.clone = function () {
            var size = this._isBABYLONPreprocessed ? null : this._size;
            var newTexture = new HDRCubeTexture(this.url, this.getScene(), size, this._noMipmap, this._generateHarmonics, this._useInGammaSpace, this._usePMREMGenerator);
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
                var size = parsedTexture.isBABYLONPreprocessed ? null : parsedTexture.size;
                texture = new BABYLON.HDRCubeTexture(rootUrl + parsedTexture.name, scene, size, texture.generateHarmonics, texture.useInGammaSpace, texture.usePMREMGenerator);
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
            serializationObject.isBABYLONPreprocessed = this._isBABYLONPreprocessed;
            return serializationObject;
        };
        /**
         * Saves as a file the data contained in the texture in a binary format.
         * This can be used to prevent the long loading tie associated with creating the seamless texture as well
         * as the spherical used in the lighting.
         * @param url The HDR file url.
         * @param size The size of the texture data to generate (one of the cubemap face desired width).
         * @param onError Method called if any error happens during download.
         * @return The packed binary data.
         */
        HDRCubeTexture.generateBabylonHDROnDisk = function (url, size, onError) {
            if (onError === void 0) { onError = null; }
            var callback = function (buffer) {
                var data = new Blob([buffer], { type: 'application/octet-stream' });
                // Returns a URL you can use as a href.
                var objUrl = window.URL.createObjectURL(data);
                // Simulates a link to it and click to dowload.
                var a = document.createElement("a");
                document.body.appendChild(a);
                a.style.display = "none";
                a.href = objUrl;
                a.download = "envmap.babylon.hdr";
                a.click();
            };
            HDRCubeTexture.generateBabylonHDR(url, size, callback, onError);
        };
        /**
         * Serializes the data contained in the texture in a binary format.
         * This can be used to prevent the long loading tie associated with creating the seamless texture as well
         * as the spherical used in the lighting.
         * @param url The HDR file url.
         * @param size The size of the texture data to generate (one of the cubemap face desired width).
         * @param onError Method called if any error happens during download.
         * @return The packed binary data.
         */
        HDRCubeTexture.generateBabylonHDR = function (url, size, callback, onError) {
            if (onError === void 0) { onError = null; }
            // Needs the url tho create the texture.
            if (!url) {
                return null;
            }
            // Check Power of two size.
            if (!BABYLON.Tools.IsExponentOfTwo(size)) {
                return null;
            }
            var getDataCallback = function (dataBuffer) {
                // Extract the raw linear data.
                var cubeData = BABYLON.Internals.HDRTools.GetCubeMapTextureData(dataBuffer, size);
                // Generate harmonics if needed.
                var sphericalPolynomial = BABYLON.Internals.CubeMapToSphericalPolynomialTools.ConvertCubeMapToSphericalPolynomial(cubeData);
                // Generate seamless faces
                var mipGeneratorArray = [];
                // Data are known to be in +X +Y +Z -X -Y -Z
                // mipmmapGenerator data is expected to be order in +X -X +Y -Y +Z -Z
                mipGeneratorArray.push(cubeData.right); // +X
                mipGeneratorArray.push(cubeData.left); // -X
                mipGeneratorArray.push(cubeData.up); // +Y
                mipGeneratorArray.push(cubeData.down); // -Y
                mipGeneratorArray.push(cubeData.front); // +Z
                mipGeneratorArray.push(cubeData.back); // -Z
                // Custom setup of the generator matching with the PBR shader values.
                var generator = new BABYLON.Internals.PMREMGenerator(mipGeneratorArray, size, size, 0, 3, true, 2048, 0.25, false, true);
                var mippedData = generator.filterCubeMap();
                // Compute required byte length.
                var byteLength = 1 * 4; // Raw Data Version int32.
                byteLength += 4; // CubeMap max mip face size int32.
                byteLength += (9 * 3 * 4); // Spherical polynomial byte length 9 Vector 3 of floats.
                // Add data size.
                byteLength += 4; // Number of mip levels int32.
                for (var level = 0; level < mippedData.length; level++) {
                    var mipSize = size >> level;
                    byteLength += (6 * mipSize * mipSize * 3 * 4); // 6 faces of size squared rgb float pixels.
                }
                // Prepare binary structure.
                var buffer = new ArrayBuffer(byteLength);
                var intArrayView = new Int32Array(buffer);
                var floatArrayView = new Float32Array(buffer);
                // Fill header.
                intArrayView[0] = 1; // Version 1.
                intArrayView[1] = size; // CubeMap max mip face size.
                // Fill polynomial information.
                sphericalPolynomial.x.toArray(floatArrayView, 2);
                sphericalPolynomial.y.toArray(floatArrayView, 5);
                sphericalPolynomial.z.toArray(floatArrayView, 8);
                sphericalPolynomial.xx.toArray(floatArrayView, 11);
                sphericalPolynomial.yy.toArray(floatArrayView, 14);
                sphericalPolynomial.zz.toArray(floatArrayView, 17);
                sphericalPolynomial.xy.toArray(floatArrayView, 20);
                sphericalPolynomial.yz.toArray(floatArrayView, 23);
                sphericalPolynomial.zx.toArray(floatArrayView, 26);
                // Fill pixel data.
                intArrayView[29] = mippedData.length; // Number of mip levels.
                var startIndex = 30;
                for (var level = 0; level < mippedData.length; level++) {
                    // Fill each pixel of the mip level.
                    var faceSize = Math.pow(size >> level, 2) * 3;
                    for (var faceIndex = 0; faceIndex < 6; faceIndex++) {
                        floatArrayView.set(mippedData[level][faceIndex], startIndex);
                        startIndex += faceSize;
                    }
                }
                // Callback.
                callback(buffer);
            };
            // Download and process.
            BABYLON.Tools.LoadFile(url, function (data) {
                getDataCallback(data);
            }, null, null, true, onError);
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
