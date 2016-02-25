var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    (function (TonemappingOperator) {
        TonemappingOperator[TonemappingOperator["Hable"] = 0] = "Hable";
        TonemappingOperator[TonemappingOperator["Reinhard"] = 1] = "Reinhard";
        TonemappingOperator[TonemappingOperator["HejiDawson"] = 2] = "HejiDawson";
        TonemappingOperator[TonemappingOperator["Photographic"] = 3] = "Photographic";
    })(BABYLON.TonemappingOperator || (BABYLON.TonemappingOperator = {}));
    var TonemappingOperator = BABYLON.TonemappingOperator;
    ;
    var TonemapPostProcess = (function (_super) {
        __extends(TonemapPostProcess, _super);
        function TonemapPostProcess(name, _operator, exposureAdjustment, camera, samplingMode, engine, textureFormat) {
            var _this = this;
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.BILINEAR_SAMPLINGMODE; }
            if (textureFormat === void 0) { textureFormat = BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT; }
            _super.call(this, name, "tonemap", ["_ExposureAdjustment"], null, 1.0, camera, samplingMode, engine, true, defines, textureFormat);
            this._operator = _operator;
            this.exposureAdjustment = exposureAdjustment;
            var defines = "#define ";
            if (this._operator === TonemappingOperator.Hable)
                defines += "HABLE_TONEMAPPING";
            else if (this._operator === TonemappingOperator.Reinhard)
                defines += "REINHARD_TONEMAPPING";
            else if (this._operator === TonemappingOperator.HejiDawson)
                defines += "OPTIMIZED_HEJIDAWSON_TONEMAPPING";
            else if (this._operator === TonemappingOperator.Photographic)
                defines += "PHOTOGRAPHIC_TONEMAPPING";
            //sadly a second call to create the effect.
            this.updateEffect(defines);
            this.onApply = function (effect) {
                effect.setFloat("_ExposureAdjustment", _this.exposureAdjustment);
            };
        }
        return TonemapPostProcess;
    })(BABYLON.PostProcess);
    BABYLON.TonemapPostProcess = TonemapPostProcess;
})(BABYLON || (BABYLON = {}));
