"use strict";

var BABYLON = BABYLON || {};

(function () {
	BABYLON.KeyboardMoveController = function (scene, target) {
		BABYLON.InputController.call(this, scene, target);
		this._keys = [];
		this.keysUp = [38];
		this.keysDown = [40];
		this.keysLeft = [37];
		this.keysRight = [39];
		this._currentSpeed = new BABYLON.Vector3(0, 0, 0);
		this._lastFrameSpeed = new BABYLON.Vector3(0, 0, 0);
		this._currentAcceleration = new BABYLON.Vector3(0, 0, 0);
		this._tempSpeed = new BABYLON.Vector3(0, 0, 0);
		this._tempSpeed2 = new BABYLON.Vector3(0, 0, 0);
		this.maxAbsoluteSpeed = 2; // 2 meters per second
		this.maxAbsoluteAcceleration = 5; // 2 meters per second²
		this._targetSpeed = new BABYLON.Vector3(0, 0, 0);
	};
	BABYLON.KeyboardMoveController.prototype = Object.create(BABYLON.InputController.prototype);
	BABYLON.KeyboardMoveController.prototype.attachToCanvas = function (canvas) {
		var that = this;
		this._canvas = canvas;

		this._onKeyDown = function (evt) {
			if (that.keysUp.indexOf(evt.keyCode) !== -1 ||
				that.keysDown.indexOf(evt.keyCode) !== -1 ||
				that.keysLeft.indexOf(evt.keyCode) !== -1 ||
				that.keysRight.indexOf(evt.keyCode) !== -1) {
				var index = that._keys.indexOf(evt.keyCode);

				if (index === -1) {
					that._keys.push(evt.keyCode);
				}
			}
		};

		this._onKeyUp = function (evt) {
			if (that.keysUp.indexOf(evt.keyCode) !== -1 ||
				that.keysDown.indexOf(evt.keyCode) !== -1 ||
				that.keysLeft.indexOf(evt.keyCode) !== -1 ||
				that.keysRight.indexOf(evt.keyCode) !== -1) {
				var index = that._keys.indexOf(evt.keyCode);

				if (index >= 0) {
					that._keys.splice(index, 1);
				}
			}
		};

		this._onLostFocus = function () {
			that._keys = [];
		};

		window.addEventListener("keydown", this._onKeyDown, false);
		window.addEventListener("keyup", this._onKeyUp, false);
		window.addEventListener("blur", this._onLostFocus, false);
	};
	BABYLON.KeyboardMoveController.prototype.detachFromCanvas = function (canvas) {
		window.removeEventListener("keydown", this._onKeyDown, false);
		window.removeEventListener("keyup", this._onKeyUp, false);
		window.removeEventListener("blur", this._onLostFocus, false);
	};
	BABYLON.KeyboardMoveController.prototype.updateCurrentSpeed = function () {
		this._lastFrameSpeed.x = this._currentSpeed.x;
		this._lastFrameSpeed.y = this._currentSpeed.y;
		this._lastFrameSpeed.z = this._currentSpeed.z;
		if (this._currentSpeed.equals(this._targetSpeed)) {
			this._currentAcceleration.x = 0;
			this._currentAcceleration.y = 0;
			this._currentAcceleration.z = 0;
			return;
		}
		var dt = BABYLON.Tools.GetDeltaTime()/1000.0;
		
		var dv = this._tempSpeed;
		this._targetSpeed.subtractToRef(this._lastFrameSpeed, dv);
		var absoluteAccToTarget = dv.length() / dt;
		if (absoluteAccToTarget < this.maxAbsoluteAcceleration) {
			this._currentSpeed.x = this._targetSpeed.x;
			this._currentSpeed.y = this._targetSpeed.y;
			this._currentSpeed.z = this._targetSpeed.z;
			dv.normalize();
			dv.scaleToRef(absoluteAccToTarget, this._currentAcceleration);
		} else {
			dv.normalize();
			dv.scaleToRef(this.maxAbsoluteAcceleration, this._currentAcceleration);
			dv.scaleInPlace(this.maxAbsoluteAcceleration * dt);
		
			this._currentSpeed.addInPlace(dv);
		}
	};
	BABYLON.KeyboardMoveController.prototype.update = function () {
		this._targetSpeed.x = 0;
		this._targetSpeed.y = 0;
		this._targetSpeed.z = 0;
		// update target speed from input
		for (var index = 0; index < this._keys.length; index++) {
			var keyCode = this._keys[index];
			if (this.keysLeft.indexOf(keyCode) !== -1) {
				this._targetSpeed.x -= 1;
			} else if (this.keysUp.indexOf(keyCode) !== -1) {
				this._targetSpeed.z += 1;
			} else if (this.keysRight.indexOf(keyCode) !== -1) {
				this._targetSpeed.x += 1;
			} else if (this.keysDown.indexOf(keyCode) !== -1) {
				this._targetSpeed.z -= 1;
			}
		}
		if (this._targetSpeed.x != 0 || this._targetSpeed.z != 0) {
			this._targetSpeed.normalize();
			this._targetSpeed.scaleInPlace(this.maxAbsoluteSpeed);
		}

		this.updateCurrentSpeed();

		if (this._lastFrameSpeed.x == 0 && this._lastFrameSpeed.z == 0 && this._currentAcceleration.x == 0 && this._currentAcceleration.z == 0) {
			return;
		}

		// dv = (dt * v0) + 1/2 * dt² * a

		var dt = BABYLON.Tools.GetDeltaTime() / 1000.0;
		this._lastFrameSpeed.scaleToRef(dt, this._tempSpeed);
		this._currentAcceleration.scaleToRef(dt * dt * 0.5, this._tempSpeed2);
		this._tempSpeed.addInPlace(this._tempSpeed2);
		if (this._tempSpeed.x != 0 || this._tempSpeed.z != 0) {
			this.target.moveRelative(this._tempSpeed);
		}
	};
})();