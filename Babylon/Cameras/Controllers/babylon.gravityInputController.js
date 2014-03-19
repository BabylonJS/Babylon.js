"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.GravityInputController = function (scene, target) {
        BABYLON.InputController.call(this, scene, target);
        this._moveVectorGlobal = new BABYLON.Vector3(0, 0, 0);
        this._moveVectorLocal = new BABYLON.Vector3(0, 0, 0);
        this._fallSpeed = .6;
    };
    BABYLON.GravityInputController.prototype = Object.create(BABYLON.InputController.prototype);
    BABYLON.GravityInputController.prototype.update = function () {
        this._moveVectorGlobal.x = 0;
        this._moveVectorGlobal.y = -this._fallSpeed * BABYLON.Tools.GetDeltaTime() / 1000.0;
        this._moveVectorGlobal.z = 0;
        BABYLON.Vector3.TransformNormalToRef(this._moveVectorGlobal, this.target.getInvertOrientationMatrix(), this._moveVectorLocal);
        this.target.moveRelative(this._moveVectorLocal);
    };
})();