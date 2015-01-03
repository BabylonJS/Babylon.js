var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var RawTexture = (function (_super) {
        __extends(RawTexture, _super);
        function RawTexture(scene, samplingMode) {
            if (typeof samplingMode === "undefined") { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            _super.call(this, null, scene, false, false);
        }
        return RawTexture;
    })(BABYLON.Texture);
    BABYLON.RawTexture = RawTexture;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.rawTexture.js.map
