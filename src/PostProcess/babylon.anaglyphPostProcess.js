var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var AnaglyphPostProcess = (function (_super) {
        __extends(AnaglyphPostProcess, _super);
        function AnaglyphPostProcess(name, ratio, rigCameras, samplingMode, engine, reusable) {
            var _this = this;
            _super.call(this, name, "anaglyph", null, ["leftSampler"], ratio, rigCameras[1], samplingMode, engine, reusable);
            this._passedProcess = rigCameras[0]._rigPostProcess;
            this.onApply = function (effect) {
                effect.setTextureFromPostProcess("leftSampler", _this._passedProcess);
            };
        }
        return AnaglyphPostProcess;
    })(BABYLON.PostProcess);
    BABYLON.AnaglyphPostProcess = AnaglyphPostProcess;
})(BABYLON || (BABYLON = {}));
