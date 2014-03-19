"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.OculusDistortionCorrectionPostProcess = function (name, camera, isRightEye, cameraSettings) {
        BABYLON.PostProcess.call(this, name, "oculusDistortionCorrection", [
			'LensCenter',
		    'Scale',
		    'ScaleIn',
		    'HmdWarpParam'
        ], null, cameraSettings.PostProcessScaleFactor, camera, BABYLON.Texture.BILINEAR_SAMPLINGMODE, null, null);
        this._isRightEye = isRightEye;
        this._distortionFactors = cameraSettings.DistortionK;
        this._postProcessScaleFactor = cameraSettings.PostProcessScaleFactor;
        this._lensCenterOffset = cameraSettings.LensCenterOffset;
    };

    BABYLON.OculusDistortionCorrectionPostProcess.prototype = Object.create(BABYLON.PostProcess.prototype);
    BABYLON.OculusDistortionCorrectionPostProcess.prototype.onSizeChanged = function () {
        this.aspectRatio = this.width * .5 / this.height;
        this._scaleIn = new BABYLON.Vector2(2, 2 / this.aspectRatio);
        this._scaleFactor = new BABYLON.Vector2(.5 * (1/this._postProcessScaleFactor), .5 * (1/this._postProcessScaleFactor) * this.aspectRatio);
        this._lensCenter = new BABYLON.Vector2(this._isRightEye ? 0.5 - this._lensCenterOffset * 0.5 : 0.5 + this._lensCenterOffset * 0.5, 0.5);
    };
    BABYLON.OculusDistortionCorrectionPostProcess.prototype.onApply = function (effect) {
        effect.setFloat2("LensCenter", this._lensCenter.x, this._lensCenter.y);
        effect.setFloat2("Scale", this._scaleFactor.x, this._scaleFactor.y);
        effect.setFloat2("ScaleIn", this._scaleIn.x, this._scaleIn.y);
        effect.setFloat4("HmdWarpParam", this._distortionFactors[0], this._distortionFactors[1], this._distortionFactors[2], this._distortionFactors[3]);
    };
})();