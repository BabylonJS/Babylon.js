"use strict";

var BABYLON = BABYLON || {};

(function () {
    var eventPrefix = BABYLON.Tools.GetPointerPrefix();

    BABYLON.AnaglyphCamera = function (name, alpha, beta, radius, target, eyeSpace, scene) {
        BABYLON.ArcRotateCamera.call(this, name, alpha, beta, radius, target, scene);

        this._eyeSpace = BABYLON.Tools.ToRadians(eyeSpace);

        this._leftCamera = new BABYLON.ArcRotateCamera(name + "_left", alpha - this._eyeSpace, beta, radius, target, scene);
        this._rightCamera = new BABYLON.ArcRotateCamera(name + "_right", alpha + this._eyeSpace, beta, radius, target, scene);
        
        this._leftTexture = new BABYLON.PassPostProcess(name + "_leftTexture", 1.0, this._leftCamera);
        this._rightTexture = new BABYLON.PassPostProcess(name + "_rightTexture", 1.0, this._rightCamera);

        this._anaglyphPostProcess = new BABYLON.AnaglyphPostProcess(name + "_anaglyph", 1.0, this);

        var that = this;
        this._anaglyphPostProcess.onApply = function (effect) {
            effect.setTextureFromPostProcess("leftSampler", that._leftTexture);
            effect.setTextureFromPostProcess("rightSampler", that._rightTexture);
        };

        scene.activeCameras.push(this._leftCamera);
        scene.activeCameras.push(this._rightCamera);
        scene.activeCameras.push(this);
    };

    BABYLON.AnaglyphCamera.prototype = Object.create(BABYLON.ArcRotateCamera.prototype);

    BABYLON.AnaglyphCamera.prototype._update = function () {
        this._updateCamera(this._leftCamera);
        this._updateCamera(this._rightCamera);

        this._leftCamera.alpha = this.alpha - this._eyeSpace;
        this._rightCamera.alpha = this.alpha + this._eyeSpace;

        BABYLON.ArcRotateCamera.prototype._update.call(this);
    };

    BABYLON.AnaglyphCamera.prototype._updateCamera = function (camera) {
        camera.inertialAlphaOffset = this.inertialAlphaOffset;
        camera.inertialBetaOffset = this.inertialBetaOffset;
        camera.inertialRadiusOffset = this.inertialRadiusOffset;
        camera.lowerAlphaLimit = this.lowerAlphaLimit;
        camera.upperAlphaLimit = this.upperAlphaLimit;
        camera.lowerBetaLimit = this.lowerBetaLimit;
        camera.upperBetaLimit = this.upperBetaLimit;
        camera.lowerRadiusLimit = this.lowerRadiusLimit;
        camera.upperRadiusLimit = this.upperRadiusLimit;
        camera.angularSensibility = this.angularSensibility;
        camera.wheelPrecision = this.wheelPrecision;

        camera.minZ = this.minZ;
        camera.maxZ = this.maxZ;

        camera.target = this.target;
    };

    BABYLON.AnaglyphCamera.prototype.attachControl = function (canvas, noPreventDefault) {
        BABYLON.ArcRotateCamera.prototype.attachControl.call(this, canvas);

        this._leftCamera.attachControl(canvas, noPreventDefault);
        this._rightCamera.attachControl(canvas, noPreventDefault);
    };

    BABYLON.AnaglyphCamera.prototype.detachControl = function (canvas) {
        BABYLON.ArcRotateCamera.prototype.detachControl.call(this, canvas);

        this._leftCamera.detachControl(canvas);
        this._rightCamera.detachControl(canvas);
    };
})();