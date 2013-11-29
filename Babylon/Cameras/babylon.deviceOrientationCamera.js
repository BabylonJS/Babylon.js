"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.DeviceOrientationCamera = function (name, position, scene) {
        BABYLON.FreeCamera.call(this, name, position, scene);

        // Offset
        this._offsetX = null;
        this._offsetY = null;
        this._orientationGamma = 0;
        this._orientationBeta = 0;
        this._initialOrientationGamma = 0;
        this._initialOrientationBeta = 0;
    };

    BABYLON.DeviceOrientationCamera.prototype = Object.create(BABYLON.FreeCamera.prototype);
    
    // Members
    BABYLON.DeviceOrientationCamera.prototype.angularSensibility = 10000.0;
    BABYLON.DeviceOrientationCamera.prototype.moveSensibility = 50.0;

    // Controls
    BABYLON.DeviceOrientationCamera.prototype.attachControl = function (canvas, noPreventDefault) {
        if (this._attachedCanvas) {
            return;
        }
        this._attachedCanvas = canvas;

        var that = this;
        if (!this._orientationChanged) {
            this._orientationChanged = function (evt) {

                if (!that._initialOrientationGamma) {
                    that._initialOrientationGamma = evt.gamma;
                    that._initialOrientationBeta = evt.beta;
                }

                that._orientationGamma = evt.gamma;
                that._orientationBeta = evt.beta;

                that._offsetY = (that._initialOrientationBeta - that._orientationBeta);
                that._offsetX = (that._initialOrientationGamma - that._orientationGamma);
            };
        }

        window.addEventListener("deviceorientation", this._orientationChanged);
    };

    BABYLON.DeviceOrientationCamera.prototype.detachControl = function (canvas) {
        if (this._attachedCanvas != canvas) {
            return;
        }

        window.removeEventListener("deviceorientation", this._orientationChanged);

        this._attachedCanvas = null;
        this._orientationGamma = 0;
        this._orientationBeta = 0;
        this._initialOrientationGamma = 0;
        this._initialOrientationBeta = 0;
    };

    BABYLON.DeviceOrientationCamera.prototype._checkInputs = function () {
        if (!this._offsetX) {
            return;
        }
        this.cameraRotation.y -= this._offsetX / this.angularSensibility;

        var speed = this._computeLocalCameraSpeed();
        var direction = new BABYLON.Vector3(0, 0, speed * this._offsetY / this.moveSensibility);

        BABYLON.Matrix.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, 0, this._cameraRotationMatrix);
        this.cameraDirection.addInPlace(BABYLON.Vector3.TransformCoordinates(direction, this._cameraRotationMatrix));
    };
})();