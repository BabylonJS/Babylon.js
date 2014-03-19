"use strict";

var BABYLON = BABYLON || {};

(function () {

	BABYLON.InputControllerTarget = function () {
		this._position = new BABYLON.Vector3(0, 0, 0);
		this._orientation = { yaw: 0.0, pitch: 0.0, roll: 0.0 };
	};

	BABYLON.InputControllerTarget.prototype.getPosition = function () {
		return this._position;
	};
	BABYLON.InputControllerTarget.prototype.getOrientation = function () {
		return this._orientation;
	};
	BABYLON.InputControllerTarget.prototype.moveRelative = function (movementVector) {

	};
	
	BABYLON.InputControllerTarget.prototype.rotateRelative = function (relativeOrientation) {

	};
	BABYLON.InputControllerTarget.prototype.getOrientationMatrix = function () { return new BABYLON.Matrix(); };
	BABYLON.InputControllerTarget.prototype.getInvertOrientationMatrix = function () { return new BABYLON.Matrix(); };

	BABYLON.InputControllerMultiTarget = function (targets) {
	    this.targets = targets;
	    var mainTarget = this.targets[0];
	    if (!mainTarget.controllers) {
	        mainTarget.controllers = [this];
	    } else {
	        mainTarget.controllers.push(this);
	    }
	};

	BABYLON.InputControllerMultiTarget.prototype.getPosition = function () {
		return this.targets[0].getPosition();
	};
	BABYLON.InputControllerMultiTarget.prototype.getOrientation = function () {
		return this.targets[0].getOrientation();
	};


	BABYLON.InputControllerMultiTarget.prototype.getOrientationMatrix = function () { return this.targets[0].getOrientationMatrix(); };
	BABYLON.InputControllerMultiTarget.prototype.getInvertOrientationMatrix = function () { return this.targets[0].getInvertOrientationMatrix(); };

	BABYLON.InputControllerMultiTarget.prototype.moveRelative = function (movementVector) {
		for (var i = 0; i < this.targets.length; ++i) {
			this.targets[i].moveRelative(movementVector);
		}
	};

	BABYLON.InputControllerMultiTarget.prototype.rotateRelative = function (relativeOrientation) {
		for (var i = 0; i < this.targets.length; ++i) {
			this.targets[i].rotateRelative(relativeOrientation);
		}
	};

	BABYLON.InputControllerMultiTarget.prototype.update = function () {
		if (this.controllers) {
			for (var i = 0; i < this.controllers.length; ++i) {
				this.controllers[i].update();
			}
		}
	};
	
	BABYLON.InputController = function (scene, target) {
		this.scene = scene;
		this.target = target;
		if (!this.target.controllers) {
			this.target.controllers = [this];
		} else {
			this.target.controllers.push(this);
		}
	};
	BABYLON.InputController.prototype.attachToCanvas = function (canvas) {

	};
	BABYLON.InputController.prototype.detachFromCanvas = function (canvas) {

	};
	BABYLON.InputController.prototype.update = function () {

	};

	BABYLON.InputController.prototype.dispose = function () {

	};

	BABYLON.inputFilter = function (scene, target) {
	    BABYLON.InputController.call(this, scene, target);
	};
	BABYLON.inputFilter.prototype = Object.create(BABYLON.InputController.prototype);
	BABYLON.inputFilter.prototype.update = function () {
	    if (this.controllers) {
	        for (var i = 0; i < this.controllers.length; ++i) {
	            this.controllers[i].update();
	        }
	    }
	};

	BABYLON.inputFilter.prototype.getPosition = function () {
	    return this.target.getPosition();
	};
	BABYLON.inputFilter.prototype.getOrientation = function () {
	    return this.target.getOrientation();
	};
	BABYLON.inputFilter.prototype.getOrientationMatrix = function () { return this.target.getOrientationMatrix(); };
	BABYLON.inputFilter.prototype.getInvertOrientationMatrix = function () { return this.target.getInvertOrientationMatrix(); };
	BABYLON.inputFilter.prototype.moveRelative = function (movementVector) {
	    this.target.moveRelative(movementVector);
	};

	BABYLON.inputFilter.prototype.rotateRelative = function (relativeOrientation) {
	    this.target.rotateRelative(relativeOrientation);
	};
})();