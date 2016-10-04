var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var VRDistortionCorrectionPostProcess = (function (_super) {
        __extends(VRDistortionCorrectionPostProcess, _super);
        //ANY
        function VRDistortionCorrectionPostProcess(name, camera, isRightEye, vrMetrics) {
            var _this = this;
            _super.call(this, name, "vrDistortionCorrection", [
                'LensCenter',
                'Scale',
                'ScaleIn',
                'HmdWarpParam'
            ], null, vrMetrics.postProcessScaleFactor, camera, BABYLON.Texture.BILINEAR_SAMPLINGMODE, null, null);
            this._isRightEye = isRightEye;
            this._distortionFactors = vrMetrics.distortionK;
            this._postProcessScaleFactor = vrMetrics.postProcessScaleFactor;
            this._lensCenterOffset = vrMetrics.lensCenterOffset;
            this.onSizeChangedObservable.add(function () {
                _this.aspectRatio = _this.width * .5 / _this.height;
                _this._scaleIn = new BABYLON.Vector2(2, 2 / _this.aspectRatio);
                _this._scaleFactor = new BABYLON.Vector2(.5 * (1 / _this._postProcessScaleFactor), .5 * (1 / _this._postProcessScaleFactor) * _this.aspectRatio);
                _this._lensCenter = new BABYLON.Vector2(_this._isRightEye ? 0.5 - _this._lensCenterOffset * 0.5 : 0.5 + _this._lensCenterOffset * 0.5, 0.5);
            });
            this.onApplyObservable.add(function (effect) {
                effect.setFloat2("LensCenter", _this._lensCenter.x, _this._lensCenter.y);
                effect.setFloat2("Scale", _this._scaleFactor.x, _this._scaleFactor.y);
                effect.setFloat2("ScaleIn", _this._scaleIn.x, _this._scaleIn.y);
                effect.setFloat4("HmdWarpParam", _this._distortionFactors[0], _this._distortionFactors[1], _this._distortionFactors[2], _this._distortionFactors[3]);
            });
        }
        return VRDistortionCorrectionPostProcess;
    }(BABYLON.PostProcess));
    BABYLON.VRDistortionCorrectionPostProcess = VRDistortionCorrectionPostProcess;
})(BABYLON || (BABYLON = {}));
