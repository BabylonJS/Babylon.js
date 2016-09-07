var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var RawTexture = (function (_super) {
        __extends(RawTexture, _super);
        function RawTexture(data, width, height, format, scene, generateMipMaps, invertY, samplingMode) {
            if (generateMipMaps === void 0) { generateMipMaps = true; }
            if (invertY === void 0) { invertY = false; }
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            _super.call(this, null, scene, !generateMipMaps, invertY);
            this.format = format;
            this._texture = scene.getEngine().createRawTexture(data, width, height, format, generateMipMaps, invertY, samplingMode);
            this.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
        }
        RawTexture.prototype.update = function (data) {
            this.getScene().getEngine().updateRawTexture(this._texture, data, this.format, this._invertY);
        };
        // Statics
        RawTexture.CreateLuminanceTexture = function (data, width, height, scene, generateMipMaps, invertY, samplingMode) {
            if (generateMipMaps === void 0) { generateMipMaps = true; }
            if (invertY === void 0) { invertY = false; }
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            return new RawTexture(data, width, height, BABYLON.Engine.TEXTUREFORMAT_LUMINANCE, scene, generateMipMaps, invertY, samplingMode);
        };
        RawTexture.CreateLuminanceAlphaTexture = function (data, width, height, scene, generateMipMaps, invertY, samplingMode) {
            if (generateMipMaps === void 0) { generateMipMaps = true; }
            if (invertY === void 0) { invertY = false; }
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            return new RawTexture(data, width, height, BABYLON.Engine.TEXTUREFORMAT_LUMINANCE_ALPHA, scene, generateMipMaps, invertY, samplingMode);
        };
        RawTexture.CreateAlphaTexture = function (data, width, height, scene, generateMipMaps, invertY, samplingMode) {
            if (generateMipMaps === void 0) { generateMipMaps = true; }
            if (invertY === void 0) { invertY = false; }
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            return new RawTexture(data, width, height, BABYLON.Engine.TEXTUREFORMAT_ALPHA, scene, generateMipMaps, invertY, samplingMode);
        };
        RawTexture.CreateRGBTexture = function (data, width, height, scene, generateMipMaps, invertY, samplingMode) {
            if (generateMipMaps === void 0) { generateMipMaps = true; }
            if (invertY === void 0) { invertY = false; }
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            return new RawTexture(data, width, height, BABYLON.Engine.TEXTUREFORMAT_RGB, scene, generateMipMaps, invertY, samplingMode);
        };
        RawTexture.CreateRGBATexture = function (data, width, height, scene, generateMipMaps, invertY, samplingMode) {
            if (generateMipMaps === void 0) { generateMipMaps = true; }
            if (invertY === void 0) { invertY = false; }
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            return new RawTexture(data, width, height, BABYLON.Engine.TEXTUREFORMAT_RGBA, scene, generateMipMaps, invertY, samplingMode);
        };
        return RawTexture;
    }(BABYLON.Texture));
    BABYLON.RawTexture = RawTexture;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.rawTexture.js.map