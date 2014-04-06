"use strict";

var BABYLON = BABYLON || {};

(function () {
    // Common
    var buildCamera = function (that, name) {
        that._leftCamera.isIntermediate = true;

        that.subCameras.push(that._leftCamera);
        that.subCameras.push(that._rightCamera);

        that._leftTexture = new BABYLON.PassPostProcess(name + "_leftTexture", 1.0, that._leftCamera);
        that._anaglyphPostProcess = new BABYLON.AnaglyphPostProcess(name + "_anaglyph", 1.0, that._rightCamera);

        that._anaglyphPostProcess.onApply = function(effect) {
            effect.setTextureFromPostProcess("leftSampler", that._leftTexture);
        };

        that._update();
    };

    // ArcRotate
    BABYLON.AnaglyphArcRotateCamera = function (name, alpha, beta, radius, target, eyeSpace, scene) {
        BABYLON.ArcRotateCamera.call(this, name, alpha, beta, radius, target, scene);

        this._eyeSpace = BABYLON.Tools.ToRadians(eyeSpace);

        this._leftCamera = new BABYLON.ArcRotateCamera(name + "_left", alpha - this._eyeSpace, beta, radius, target, scene);
        this._rightCamera = new BABYLON.ArcRotateCamera(name + "_right", alpha + this._eyeSpace, beta, radius, target, scene);

        buildCamera(this, name);
    };

    BABYLON.AnaglyphArcRotateCamera.prototype = Object.create(BABYLON.ArcRotateCamera.prototype);

    BABYLON.AnaglyphArcRotateCamera.prototype._update = function () {
        this._updateCamera(this._leftCamera);
        this._updateCamera(this._rightCamera);

        this._leftCamera.alpha = this.alpha - this._eyeSpace;
        this._rightCamera.alpha = this.alpha + this._eyeSpace;

        BABYLON.ArcRotateCamera.prototype._update.call(this);
    };

    BABYLON.AnaglyphArcRotateCamera.prototype._updateCamera = function (camera) {
        camera.beta = this.beta;
        camera.radius = this.radius;

        camera.minZ = this.minZ;
        camera.maxZ = this.maxZ;

        camera.fov = this.fov;

        camera.target = this.target;
    };

    // FreeCamera
    BABYLON.AnaglyphFreeCamera = function (name, position, eyeSpace, scene) {
        BABYLON.FreeCamera.call(this, name, position, scene);

        this._eyeSpace = BABYLON.Tools.ToRadians(eyeSpace);
        this._transformMatrix = new BABYLON.Matrix();

        this._leftCamera = new BABYLON.FreeCamera(name + "_left", position, scene);
        this._rightCamera = new BABYLON.FreeCamera(name + "_right", position, scene);

        buildCamera(this, name, eyeSpace);
    };

    BABYLON.AnaglyphFreeCamera.prototype = Object.create(BABYLON.FreeCamera.prototype);

    BABYLON.AnaglyphFreeCamera.prototype._getSubCameraPosition = function(eyeSpace, result) {
        var target = this.getTarget();
        BABYLON.Matrix.Translation(-target.x, -target.y, -target.z).multiplyToRef(BABYLON.Matrix.RotationY(eyeSpace), this._transformMatrix);

        this._transformMatrix = this._transformMatrix.multiply(BABYLON.Matrix.Translation(target.x, target.y, target.z));

        BABYLON.Vector3.TransformCoordinatesToRef(this.position, this._transformMatrix, result);
    };

    BABYLON.AnaglyphFreeCamera.prototype._update = function () {
        this._getSubCameraPosition(-this._eyeSpace, this._leftCamera.position);
        this._getSubCameraPosition(this._eyeSpace, this._rightCamera.position);

        this._updateCamera(this._leftCamera);
        this._updateCamera(this._rightCamera);

        BABYLON.FreeCamera.prototype._update.call(this);
    };

    BABYLON.AnaglyphFreeCamera.prototype._updateCamera = function (camera) {
        camera.minZ = this.minZ;
        camera.maxZ = this.maxZ;

        camera.fov = this.fov;

        camera.setTarget(this.getTarget());
    };
})();