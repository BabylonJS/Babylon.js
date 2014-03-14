"use strict";

var BABYLON = BABYLON || {};

(function () {

	BABYLON.inputControllerTarget = function () {
		this._position = new BABYLON.Vector3(0, 0, 0);
		this._orientation = { yaw: 0.0, pitch: 0.0, roll: 0.0 };
	};

	BABYLON.inputControllerTarget.prototype.getPosition = function () {
		return this._position;
	};
	BABYLON.inputControllerTarget.prototype.getOrientation = function () {
		return this._orientation;
	};
	BABYLON.inputControllerTarget.prototype.moveRelative = function (movementVector) {

	};
	
	BABYLON.inputControllerTarget.prototype.rotateRelative = function (relativeOrientation) {

	};

	BABYLON.inputControllerMultiTarget = function (targets) {
	    this.targets = targets;
	    var mainTarget = this.targets[0];
	    if (!mainTarget.controllers) {
	        mainTarget.controllers = [this];
	    } else {
	        mainTarget.controllers.push(this);
	    }
	};

	BABYLON.inputControllerMultiTarget.prototype.getPosition = function () {
		return this.targets[0].getPosition();
	};
	BABYLON.inputControllerMultiTarget.prototype.getOrientation = function () {
		return this.targets[0].getOrientation();
	};
	BABYLON.inputControllerMultiTarget.prototype.moveRelative = function (movementVector) {
		for (var i = 0; i < this.targets.length; ++i) {
			this.targets[i].moveRelative(movementVector);
		}
	};

	BABYLON.inputControllerMultiTarget.prototype.rotateRelative = function (relativeOrientation) {
		for (var i = 0; i < this.targets.length; ++i) {
			this.targets[i].rotateRelative(relativeOrientation);
		}
	};

	BABYLON.inputControllerMultiTarget.prototype.update = function () {
		if (this.controllers) {
			for (var i = 0; i < this.controllers.length; ++i) {
				this.controllers[i].update();
			}
		}
	};
	
	BABYLON.inputController = function (scene, target) {
		this.scene = scene;
		this.target = target;
		if (!this.target.controllers) {
			this.target.controllers = [this];
		} else {
			this.target.controllers.push(this);
		}
	};
	BABYLON.inputController.prototype.attachToCanvas = function (canvas) {

	};
	BABYLON.inputController.prototype.detachFromCanvas = function (canvas) {

	};
	BABYLON.inputController.prototype.update = function () {

	};

	BABYLON.inputController.prototype.dispose = function () {

	};

})();