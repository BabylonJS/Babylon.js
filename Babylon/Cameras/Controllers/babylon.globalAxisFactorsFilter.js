"use strict";

var BABYLON = BABYLON || {};

(function () {
	BABYLON.GlobalAxisFactorsFilter = function (scene, target, xFactor, yFactor, zFactor) {
		BABYLON.inputFilter.call(this, scene,target);
		this.xFactor = xFactor;
		this.yFactor = yFactor;
		this.zFactor = zFactor;

		this._globalMovement = new BABYLON.Vector3(0, 0, 0);
	};
	BABYLON.GlobalAxisFactorsFilter.prototype = Object.create(BABYLON.inputFilter.prototype);
	BABYLON.GlobalAxisFactorsFilter.prototype.moveRelative = function (relativeMovement) {
		var orientation = this.getOrientation();
		BABYLON.Vector3.TransformNormalToRef(relativeMovement, this.getOrientationMatrix(), this._globalMovement);
		this._globalMovement.x *= this.xFactor;
		this._globalMovement.y *= this.yFactor;
		this._globalMovement.z *= this.zFactor;
		BABYLON.Vector3.TransformNormalToRef(this._globalMovement, this.getInvertOrientationMatrix(), relativeMovement);
		this.target.moveRelative(relativeMovement);
	};
})();