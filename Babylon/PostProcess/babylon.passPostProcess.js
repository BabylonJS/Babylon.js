var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
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
//# sourceMappingURL=babylon.passPostProcess.js.map