var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var PassPostProcess = (function (_super) {
        __extends(PassPostProcess, _super);
        function PassPostProcess(name, ratio, camera, samplingMode, engine, reusable) {
            _super.call(this, name, "pass", null, null, ratio, camera, samplingMode, engine, reusable);
        }
        return PassPostProcess;
    })(BABYLON.PostProcess);
    BABYLON.PassPostProcess = PassPostProcess;
})(BABYLON || (BABYLON = {}));
