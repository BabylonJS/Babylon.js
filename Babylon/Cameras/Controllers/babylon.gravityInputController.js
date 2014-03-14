"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.GravityInputController = function (scene, target) {
        BABYLON.inputController.call(this, scene, target);
        this._fallSpeed = 1; // 1 meters per second
        this._moveVectorGlobal = new BABYLON.Vector3(0, 0, 0);
        this._moveVectorLocal = new BABYLON.Vector3(0, 0, 0);
        this._invertMatrix = new BABYLON.Matrix();
    };
    BABYLON.GravityInputController.prototype = Object.create(BABYLON.inputController.prototype);
    BABYLON.GravityInputController.prototype.update = function () {
        var orientation = this.target.getOrientation();
        BABYLON.Matrix.RotationYawPitchRollToRef(orientation.yaw, orientation.pitch, orientation.roll, this._invertMatrix);
        this._invertMatrix.invert();
        this._moveVectorGlobal.x = 0;
        this._moveVectorGlobal.y = -this._fallSpeed * BABYLON.Tools.GetDeltaTime() / 1000.0;
        this._moveVectorGlobal.z = 0;
        BABYLON.Vector3.TransformNormalToRef(this._moveVectorGlobal,this._invertMatrix, this._moveVectorLocal);
        this.target.moveRelative(this._moveVectorLocal);
    };
})();