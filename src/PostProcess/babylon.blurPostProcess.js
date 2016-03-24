var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var BlurPostProcess = (function (_super) {
        __extends(BlurPostProcess, _super);
        function BlurPostProcess(name, direction, blurWidth, ratio, camera, samplingMode, engine, reusable) {
            var _this = this;
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.BILINEAR_SAMPLINGMODE; }
            _super.call(this, name, "blur", ["screenSize", "direction", "blurWidth"], null, ratio, camera, samplingMode, engine, reusable);
            this.direction = direction;
            this.blurWidth = blurWidth;
            this.onApply = function (effect) {
                effect.setFloat2("screenSize", _this.width, _this.height);
                effect.setVector2("direction", _this.direction);
                effect.setFloat("blurWidth", _this.blurWidth);
            };
        }
        return BlurPostProcess;
    })(BABYLON.PostProcess);
    BABYLON.BlurPostProcess = BlurPostProcess;
})(BABYLON || (BABYLON = {}));
