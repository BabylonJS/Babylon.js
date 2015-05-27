var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var StereogramInterlacePostProcess = (function (_super) {
        __extends(StereogramInterlacePostProcess, _super);
        function StereogramInterlacePostProcess(name, camB, postProcessA, isStereogramHoriz, samplingMode) {
            var _this = this;
            _super.call(this, name, "stereogramInterlace", ['stepSize'], ['camASampler'], 1, camB, samplingMode, camB.getScene().getEngine(), false, isStereogramHoriz ? "#define IS_STEREOGRAM_HORIZ 1" : undefined);
            this._stepSize = new BABYLON.Vector2(1 / this.width, 1 / this.height);
            this.onSizeChanged = function () {
                _this._stepSize = new BABYLON.Vector2(1 / _this.width, 1 / _this.height);
            };
            this.onApply = function (effect) {
                effect.setTextureFromPostProcess("camASampler", postProcessA);
                effect.setFloat2("stepSize", _this._stepSize.x, _this._stepSize.y);
            };
        }
        return StereogramInterlacePostProcess;
    })(BABYLON.PostProcess);
    BABYLON.StereogramInterlacePostProcess = StereogramInterlacePostProcess;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.stereogramInterlacePostProcess.js.map