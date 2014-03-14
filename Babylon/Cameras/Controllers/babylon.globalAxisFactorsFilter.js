"use strict";

var BABYLON = BABYLON || {};

(function () {
	BABYLON.globalAxisFactorsFilter = function (scene, target, xFactor, yFactor, zFactor) {
		BABYLON.inputFilter.call(this, scene,target);
		this.xFactor = xFactor;
		this.yFactor = yFactor;
		this.zFactor = zFactor;

		this._localToGlobalMatrix = new BABYLON.Matrix();
		this._globalToLocalMatrix = new BABYLON.Matrix();
		this._globalMovement = new BABYLON.Vector3(0, 0, 0);
	};
	BABYLON.globalAxisFactorsFilter.prototype = Object.create(BABYLON.inputFilter.prototype);
	BABYLON.globalAxisFactorsFilter.prototype.moveRelative = function (relativeMovement) {
		var orientation = this.getOrientation();
		BABYLON.Matrix.RotationYawPitchRollToRef(orientation.yaw, orientation.pitch, orientation.roll, this._localToGlobalMatrix);
		this._localToGlobalMatrix.invertToRef(this._globalToLocalMatrix);
		BABYLON.Vector3.TransformNormalToRef(relativeMovement, this._localToGlobalMatrix, this._globalMovement);
		this._globalMovement.x *= this.xFactor;
		this._globalMovement.y *= this.yFactor;
		this._globalMovement.z *= this.zFactor;
		BABYLON.Vector3.TransformNormalToRef(this._globalMovement, this._globalToLocalMatrix, relativeMovement);
		this.target.moveRelative(relativeMovement);
	};
})();