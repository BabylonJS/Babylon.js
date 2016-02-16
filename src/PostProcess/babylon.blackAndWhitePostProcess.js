var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var BlackAndWhitePostProcess = (function (_super) {
        __extends(BlackAndWhitePostProcess, _super);
        function BlackAndWhitePostProcess(name, ratio, camera, samplingMode, engine, reusable) {
            _super.call(this, name, "blackAndWhite", null, null, ratio, camera, samplingMode, engine, reusable);
        }
        return BlackAndWhitePostProcess;
    })(BABYLON.PostProcess);
    BABYLON.BlackAndWhitePostProcess = BlackAndWhitePostProcess;
})(BABYLON || (BABYLON = {}));
