var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    /**
     * This represents a color grading texture. This acts as a lookup table LUT, useful during post process
     * It can help converting any input color in a desired output one. This can then be used to create effects
     * from sepia, black and white to sixties or futuristic rendering...
     *
     * The only supported format is currently 3dl.
     * More information on LUT: https://en.wikipedia.org/wiki/3D_lookup_table/
     */
    var ColorGradingTexture = (function (_super) {
        __extends(ColorGradingTexture, _super);
        /**
         * Instantiates a ColorGradingTexture from the following parameters.
         *
         * @param url The location of the color gradind data (currently only supporting 3dl)
         * @param scene The scene the texture will be used in
         */
        function ColorGradingTexture(url, scene) {
            _super.call(this, scene);
            if (!url) {
                return;
            }
            this._textureMatrix = BABYLON.Matrix.Identity();
            this.name = url;
            this.url = url;
            this.hasAlpha = false;
            this.isCube = false;
            this.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this.anisotropicFilteringLevel = 1;
            this._texture = this._getFromCache(url, true);
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
         * Returns the texture matrix used in most of the material.
         * This is not used in color grading but keep for troubleshooting purpose (easily swap diffuse by colorgrading to look in).
         */
        ColorGradingTexture.prototype.getTextureMatrix = function () {
            return this._textureMatrix;
        };
        /**
         * Occurs when the file being loaded is a .3dl LUT file.
         */
        ColorGradingTexture.prototype.load3dlTexture = function () {
            var _this = this;
            var mipLevels = 0;
            var floatArrayView = null;
            var texture = this.getScene().getEngine().createRawTexture(null, 1, 1, BABYLON.Engine.TEXTUREFORMAT_RGBA, false, false, BABYLON.Texture.BILINEAR_SAMPLINGMODE);
            this._texture = texture;
            var callback = function (text) {
                var data;
                var tempData;
                var line;
                var lines = text.split('\n');
                var size = 0, pixelIndexW = 0, pixelIndexH = 0, pixelIndexSlice = 0;
                var maxColor = 0;
                for (var i = 0; i < lines.length; i++) {
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
                for (var i = 0; i < tempData.length; i++) {
                    var value = tempData[i];
                    data[i] = (value / maxColor * 255);
                }
                _this.getScene().getEngine().updateTextureSize(texture, size * size, size);
                _this.getScene().getEngine().updateRawTexture(texture, data, BABYLON.Engine.TEXTUREFORMAT_RGBA, false);
            };
            BABYLON.Tools.LoadFile(this.url, callback);
            return this._texture;
        };
        /**
         * Starts the loading process of the texture.
         */
        ColorGradingTexture.prototype.loadTexture = function () {
            if (this.url && this.url.toLocaleLowerCase().indexOf(".3dl") == (this.url.length - 4)) {
                this.load3dlTexture();
            }
        };
        /**
         * Clones the color gradind texture.
         */
        ColorGradingTexture.prototype.clone = function () {
            var newTexture = new ColorGradingTexture(this.url, this.getScene());
            // Base texture
            newTexture.level = this.level;
            return newTexture;
        };
        /**
         * Called during delayed load for textures.
         */
        ColorGradingTexture.prototype.delayLoad = function () {
            if (this.delayLoadState !== BABYLON.Engine.DELAYLOADSTATE_NOTLOADED) {
                return;
            }
            this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_LOADED;
            this._texture = this._getFromCache(this.url, true);
            if (!this._texture) {
                this.loadTexture();
            }
        };
        /**
        * Binds the color grading to the shader.
        * @param colorGrading The texture to bind
        * @param effect The effect to bind to
        */
        ColorGradingTexture.Bind = function (colorGrading, effect) {
            effect.setTexture("cameraColorGrading2DSampler", colorGrading);
            var x = colorGrading.level; // Texture Level
            var y = colorGrading.getSize().height; // Texture Size example with 8
            var z = y - 1.0; // SizeMinusOne 8 - 1
            var w = 1 / y; // Space of 1 slice 1 / 8
            effect.setFloat4("vCameraColorGradingInfos", x, y, z, w);
            var slicePixelSizeU = w / y; // Space of 1 pixel in U direction, e.g. 1/64
            var slicePixelSizeV = w; // Space of 1 pixel in V direction, e.g. 1/8					    // Space of 1 pixel in V direction, e.g. 1/8
            var x2 = z * slicePixelSizeU; // Extent of lookup range in U for a single slice so that range corresponds to (size-1) texels, for example 7/64
            var y2 = z / y; // Extent of lookup range in V for a single slice so that range corresponds to (size-1) texels, for example 7/8
            var z2 = 0.5 * slicePixelSizeU; // Offset of lookup range in U to align sample position with texel centre, for example 0.5/64 
            var w2 = 0.5 * slicePixelSizeV; // Offset of lookup range in V to align sample position with texel centre, for example 0.5/8
            effect.setFloat4("vCameraColorGradingScaleOffset", x2, y2, z2, w2);
        };
        /**
         * Prepare the list of uniforms associated with the ColorGrading effects.
         * @param uniformsList The list of uniforms used in the effect
         * @param samplersList The list of samplers used in the effect
         */
        ColorGradingTexture.PrepareUniformsAndSamplers = function (uniformsList, samplersList) {
            uniformsList.push("vCameraColorGradingInfos", "vCameraColorGradingScaleOffset");
            samplersList.push("cameraColorGrading2DSampler");
        };
        /**
         * Parses a color grading texture serialized by Babylon.
         * @param parsedTexture The texture information being parsedTexture
         * @param scene The scene to load the texture in
         * @param rootUrl The root url of the data assets to load
         * @return A color gradind texture
         */
        ColorGradingTexture.Parse = function (parsedTexture, scene, rootUrl) {
            var texture = null;
            if (parsedTexture.name && !parsedTexture.isRenderTarget) {
                texture = new BABYLON.ColorGradingTexture(parsedTexture.name, scene);
                texture.name = parsedTexture.name;
                texture.level = parsedTexture.level;
            }
            return texture;
        };
        /**
         * Serializes the LUT texture to json format.
         */
        ColorGradingTexture.prototype.serialize = function () {
            if (!this.name) {
                return null;
            }
            var serializationObject = {};
            serializationObject.name = this.name;
            serializationObject.level = this.level;
            return serializationObject;
        };
        /**
         * Empty line regex stored for GC.
         */
        ColorGradingTexture._noneEmptyLineRegex = /\S+/;
        return ColorGradingTexture;
    }(BABYLON.BaseTexture));
    BABYLON.ColorGradingTexture = ColorGradingTexture;
})(BABYLON || (BABYLON = {}));
