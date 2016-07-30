var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var StereoscopicInterlacePostProcess = (function (_super) {
        __extends(StereoscopicInterlacePostProcess, _super);
        function StereoscopicInterlacePostProcess(name, rigCameras, isStereoscopicHoriz, samplingMode, engine, reusable) {
            var _this = this;
            _super.call(this, name, "stereoscopicInterlace", ['stepSize'], ['camASampler'], 1, rigCameras[1], samplingMode, engine, reusable, isStereoscopicHoriz ? "#define IS_STEREOSCOPIC_HORIZ 1" : undefined);
            this._passedProcess = rigCameras[0]._rigPostProcess;
            this._stepSize = new BABYLON.Vector2(1 / this.width, 1 / this.height);
            this.onSizeChangedObservable.add(function () {
                _this._stepSize = new BABYLON.Vector2(1 / _this.width, 1 / _this.height);
            });
            this.onApplyObservable.add(function (effect) {
                effect.setTextureFromPostProcess("camASampler", _this._passedProcess);
                effect.setFloat2("stepSize", _this._stepSize.x, _this._stepSize.y);
            });
        }
        return StereoscopicInterlacePostProcess;
    })(BABYLON.PostProcess);
    BABYLON.StereoscopicInterlacePostProcess = StereoscopicInterlacePostProcess;
})(BABYLON || (BABYLON = {}));
