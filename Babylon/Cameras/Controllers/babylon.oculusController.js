"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.OculusController = function (scene, target) {
        BABYLON.InputController.call(this, scene, target);
        this._deviceOrientationHandler = this.onOrientationEvent.bind(this);
        this._tempOrientation = { yaw: 0.0, pitch: 0.0, roll: 0.0 };
        this._relativeOrientation = { yaw: 0.0, pitch: 0.0, roll: 0.0 };
        window.addEventListener("deviceorientation", this._deviceOrientationHandler);
    };

    BABYLON.OculusController.prototype = Object.create(BABYLON.InputController.prototype);

    BABYLON.OculusController.prototype.onOrientationEvent = function (ev) {
        this._tempOrientation.yaw = ev.alpha / 180 * Math.PI;
        this._tempOrientation.pitch = ev.beta / 180 * Math.PI;
        this._tempOrientation.roll = ev.gamma / 180 * Math.PI;

        if (!this._lastOrientation) {
            this._lastOrientation = Object.create(this._tempOrientation);
        }
        else {
            this._relativeOrientation.yaw = this._tempOrientation.yaw - this._lastOrientation.yaw;
            this._relativeOrientation.pitch = this._tempOrientation.pitch - this._lastOrientation.pitch;
            this._relativeOrientation.roll = this._tempOrientation.roll - this._lastOrientation.roll;

            var temp = this._tempOrientation;
            this._tempOrientation = this._lastOrientation;
            this._lastOrientation = temp;
            this.target.rotateRelative(this._relativeOrientation);
        }
    };
    BABYLON.OculusController.prototype.dispose = function () {
        window.removeEventListener("deviceorientation", this._deviceOrientationHandler);
    };

    BABYLON.OculusController.CameraSettings_OculusRiftDevKit2013_Metric = {
        HResolution: 1280,
        VResolution: 800,
        HScreenSize: 0.149759993,
        VScreenSize: 0.0935999975,
        VScreenCenter: 0.0467999987,
        EyeToScreenDistance: 0.0410000011,
        LensSeparationDistance: 0.0635000020,
        InterpupillaryDistance: 0.0640000030,
        DistortionK: [1.0, 0.219999999, 0.239999995, 0.0],
        ChromaAbCorrection: [0.995999992, -0.00400000019, 1.01400006, 0.0],
        PostProcessScaleFactor: 1.714605507808412,
        LensCenterOffset: 0.151976421
    };
})();