var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var StereoscopicInterlacePostProcess = (function (_super) {
        __extends(StereoscopicInterlacePostProcess, _super);
        function StereoscopicInterlacePostProcess(name, camB, postProcessA, isStereoscopicHoriz, samplingMode) {
            var _this = this;
            _super.call(this, name, "stereoscopicInterlace", ['stepSize'], ['camASampler'], 1, camB, samplingMode, camB.getScene().getEngine(), false, isStereoscopicHoriz ? "#define IS_STEREOSCOPIC_HORIZ 1" : undefined);
            this._stepSize = new BABYLON.Vector2(1 / this.width, 1 / this.height);
            this.onSizeChanged = function () {
                _this._stepSize = new BABYLON.Vector2(1 / _this.width, 1 / _this.height);
            };
            this.onApply = function (effect) {
                effect.setTextureFromPostProcess("camASampler", postProcessA);
                effect.setFloat2("stepSize", _this._stepSize.x, _this._stepSize.y);
            };
        }
        return StereoscopicInterlacePostProcess;
    }(BABYLON.PostProcess));
    BABYLON.StereoscopicInterlacePostProcess = StereoscopicInterlacePostProcess;
})(BABYLON || (BABYLON = {}));
