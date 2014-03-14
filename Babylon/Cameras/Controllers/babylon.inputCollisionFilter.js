"use strict";

var BABYLON = BABYLON || {};

(function () {
	BABYLON.inputCollisionFilter = function (scene, target, ellipsoid) {
		BABYLON.inputFilter.call(this, scene, target);
		this._orientationMatrix = new BABYLON.Matrix();
		this._orientationMatrixInvert = new BABYLON.Matrix();
		this._transformedDirection = new BABYLON.Vector3();
		this._tempNewPosition = new BABYLON.Vector3();
		this._tempNewPosition2 = new BABYLON.Vector3();
		this._ellipsoid = ellipsoid || new BABYLON.Vector3(.5,.5,.5);
		this._collider = new BABYLON.Collider();
		this._collidedPosition = new BABYLON.Vector3(0, 0, 0);
		this._cameraHeight = 1.7;
		this._positionBottom = new BABYLON.Vector3(0, 0, 0);
	};
	BABYLON.inputCollisionFilter.prototype = Object.create(BABYLON.inputFilter.prototype);
	BABYLON.inputCollisionFilter.prototype.moveRelative = function (relativeMovement) {
		var rotation = this.getOrientation();
		BABYLON.Matrix.RotationYawPitchRollToRef(rotation.yaw, rotation.pitch, rotation.roll, this._orientationMatrix);
		BABYLON.Vector3.TransformNormalToRef(relativeMovement, this._orientationMatrix, this._transformedDirection);
		this.getPosition().addToRef(this._transformedDirection, this._tempNewPosition);
		//this._tempNewPosition.y -= this._ellipsoid.y;
		this._collider.radius = this._ellipsoid;
		var p = this.getPosition();
		this._positionBottom.x = p.x;
		this._positionBottom.y = p.y;
		this._positionBottom.z = p.z;
		this._positionBottom.y +=  this._ellipsoid.y - this._cameraHeight;

		this.scene._getNewPosition(this._positionBottom, this._transformedDirection, this._collider, 3, this._collidedPosition);


		this._collidedPosition.subtractToRef(this._positionBottom, this._tempNewPosition2);

		if (this._tempNewPosition2.length() > BABYLON.Engine.collisionsEpsilon) {

		    this._orientationMatrix.invertToRef(this._orientationMatrixInvert);
		    BABYLON.Vector3.TransformNormalToRef(this._tempNewPosition2, this._orientationMatrixInvert, this._tempNewPosition);

		    this.target.moveRelative(this._tempNewPosition);
		}

	};
})();