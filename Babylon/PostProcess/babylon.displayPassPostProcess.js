var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var DisplayPassPostProcess = (function (_super) {
        __extends(DisplayPassPostProcess, _super);
        function DisplayPassPostProcess(name, ratio, camera, samplingMode, engine, reusable) {
            _super.call(this, name, "displayPass", ["passSampler"], ["passSampler"], ratio, camera, samplingMode, engine, reusable);
        }
        return DisplayPassPostProcess;
    })(BABYLON.PostProcess);
    BABYLON.DisplayPassPostProcess = DisplayPassPostProcess;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.displayPassPostProcess.js.map