var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var HDRCubeTexture = (function (_super) {
        __extends(HDRCubeTexture, _super);
        function HDRCubeTexture(url, scene, size, noMipmap) {
            _super.call(this, scene);
            this.coordinatesMode = BABYLON.Texture.CUBIC_MODE;
            this.sphericalPolynomial = null;
            this.name = url;
            this.url = url;
            this._noMipmap = noMipmap;
            this.hasAlpha = false;
            this._size = size;
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
                var data = BABYLON.Internals.HDRTools.GetCubeMapTextureData(buffer, _this._size);
                _this.sphericalPolynomial = BABYLON.Internals.CubeMapToSphericalPolynomialTools.ConvertCubeMapToSphericalPolynomial(data);
                var mapping = [
                    "left",
                    "down",
                    "front",
                    "right",
                    "up",
                    "back"
                ];
                var results = [];
                for (var j = 0; j < 6; j++) {
                    var dataFace = data[mapping[j]];
                    // TODO. Support Int Textures...
                    //                     // 3 channels of 1 bytes per pixel in bytes.
                    //                     var byteBuffer = new ArrayBuffer(this._size * this._size * 3);
                    //                     var byteArray = new Uint8Array(byteBuffer);
                    // 
                    //                     /* now convert data from buffer into bytes */
                    //                     for(var i = 0; i < this._size * this._size; i++) {
                    //                         byteArray[(i * 3) + 0] = dataFace[(i * 3) + 0] * 255;
                    //                         byteArray[(i * 3) + 1] = dataFace[(i * 3) + 1] * 255;
                    //                         byteArray[(i * 3) + 2] = dataFace[(i * 3) + 2] * 255;
                    //                     }
                    results.push(dataFace);
                }
                return results;
            };
            this._texture = this.getScene().getEngine().createRawCubeTexture(this.url, this.getScene(), this._size, BABYLON.Engine.TEXTUREFORMAT_RGB, BABYLON.Engine.TEXTURETYPE_FLOAT, this._noMipmap, callback);
        };
        HDRCubeTexture.prototype.clone = function () {
            var newTexture = new HDRCubeTexture(this.url, this.getScene(), this._size, this._noMipmap);
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
                texture = new BABYLON.HDRCubeTexture(rootUrl + parsedTexture.name, scene, parsedTexture.size);
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
            return serializationObject;
        };
        return HDRCubeTexture;
    })(BABYLON.BaseTexture);
    BABYLON.HDRCubeTexture = HDRCubeTexture;
})(BABYLON || (BABYLON = {}));
