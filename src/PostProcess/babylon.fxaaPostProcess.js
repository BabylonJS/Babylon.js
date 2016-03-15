var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var FxaaPostProcess = (function (_super) {
        __extends(FxaaPostProcess, _super);
        function FxaaPostProcess(name, ratio, camera, samplingMode, engine, reusable) {
            var _this = this;
            _super.call(this, name, "fxaa", ["texelSize"], null, ratio, camera, samplingMode, engine, reusable);
            this.onSizeChanged = function () {
                _this.texelWidth = 1.0 / _this.width;
                _this.texelHeight = 1.0 / _this.height;
            };
            this.onApply = function (effect) {
                effect.setFloat2("texelSize", _this.texelWidth, _this.texelHeight);
            };
        }
        return FxaaPostProcess;
    })(BABYLON.PostProcess);
    BABYLON.FxaaPostProcess = FxaaPostProcess;
})(BABYLON || (BABYLON = {}));
