var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var FilterPostProcess = (function (_super) {
        __extends(FilterPostProcess, _super);
        function FilterPostProcess(name, kernelMatrix, ratio, camera, samplingMode, engine, reusable) {
            var _this = this;
            _super.call(this, name, "filter", ["kernelMatrix"], null, ratio, camera, samplingMode, engine, reusable);
            this.kernelMatrix = kernelMatrix;
            this.onApply = function (effect) {
                effect.setMatrix("kernelMatrix", _this.kernelMatrix);
            };
        }
        return FilterPostProcess;
    }(BABYLON.PostProcess));
    BABYLON.FilterPostProcess = FilterPostProcess;
})(BABYLON || (BABYLON = {}));
