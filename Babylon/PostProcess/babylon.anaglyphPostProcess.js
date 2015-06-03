var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var AnaglyphPostProcess = (function (_super) {
        __extends(AnaglyphPostProcess, _super);
        function AnaglyphPostProcess(name, ratio, camera, samplingMode, engine, reusable) {
            _super.call(this, name, "anaglyph", null, ["leftSampler"], ratio, camera, samplingMode, engine, reusable);
        }
        return AnaglyphPostProcess;
    })(BABYLON.PostProcess);
    BABYLON.AnaglyphPostProcess = AnaglyphPostProcess;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.anaglyphPostProcess.js.map