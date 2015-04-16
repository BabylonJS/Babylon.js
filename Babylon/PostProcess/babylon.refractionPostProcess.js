var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var RefractionPostProcess = (function (_super) {
        __extends(RefractionPostProcess, _super);
        function RefractionPostProcess(name, refractionTextureUrl, color, depth, colorLevel, ratio, camera, samplingMode, engine, reusable) {
            var _this = this;
            _super.call(this, name, "refraction", ["baseColor", "depth", "colorLevel"], ["refractionSampler"], ratio, camera, samplingMode, engine, reusable);
            this.color = color;
            this.depth = depth;
            this.colorLevel = colorLevel;
            this.onActivate = function (cam) {
                _this._refRexture = _this._refRexture || new BABYLON.Texture(refractionTextureUrl, cam.getScene());
            };
            this.onApply = function (effect) {
                effect.setColor3("baseColor", _this.color);
                effect.setFloat("depth", _this.depth);
                effect.setFloat("colorLevel", _this.colorLevel);
                effect.setTexture("refractionSampler", _this._refRexture);
            };
        }
        // Methods
        RefractionPostProcess.prototype.dispose = function (camera) {
            if (this._refRexture) {
                this._refRexture.dispose();
            }
            _super.prototype.dispose.call(this, camera);
        };
        return RefractionPostProcess;
    })(BABYLON.PostProcess);
    BABYLON.RefractionPostProcess = RefractionPostProcess;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.refractionPostProcess.js.map