"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.OculusController = function () {
        this._currentOrientation = { yaw: 0, pitch: 0, roll: 0 };
        this._deviceOrientationHandler = this.onOrientationEvent.bind(this);
        window.addEventListener("deviceorientation", this._deviceOrientationHandler);
    };

    BABYLON.OculusController.prototype.onOrientationEvent = function (ev) {
        var yaw = ev.alpha / 180 * Math.PI;
        if(!this._referenceYaw){
            this._referenceYaw= yaw;
        }
        this._currentOrientation.yaw = yaw - this._referenceYaw;
        this._currentOrientation.pitch = ev.beta / 180 * Math.PI;
        this._currentOrientation.roll = ev.gamma / 180 * Math.PI;
    };
    BABYLON.OculusController.prototype.dispose = function () {
        window.removeEventListener("deviceorientation", this._deviceOrientationHandler);
    };

    BABYLON.OculusController.prototype.getCurrentOrientation = function () {
        return this._currentOrientation;
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

    BABYLON.OculusOrientedCamera = function (name, position, scene, controller, isLeftEye, ovrSettings, neutralOrientation) {
        BABYLON.Camera.call(this, name, position, scene);
        this._controller = controller;
        this._referenceDirection = new BABYLON.Vector3(0, 0, 1);
        this._referenceUp = new BABYLON.Vector3(0, 1, 0);
        this._actualDirection = new BABYLON.Vector3(1, 0, 0);
        this._actualUp = new BABYLON.Vector3(0, 1, 0);
        this._currentTargetPoint = new BABYLON.Vector3(0, 0, 0);
        this._currentOculusOrientation = { yaw: 0.0, pitch: 0.0, roll: 0.0 };
        this._currentViewMatrix = new BABYLON.Matrix();
        this._currentOculusOrientationMatrix = new BABYLON.Matrix();
        this._tempMatrix = new BABYLON.Matrix();
        neutralOrientation = neutralOrientation || { yaw: 0.0, pitch: 0.0, roll: 0.0 };
        this._neutralOrientation = neutralOrientation;
        if (isLeftEye) {
            this.viewport = new BABYLON.Viewport(0, 0, 0.5, 1.0);
        } else {
            this.viewport = new BABYLON.Viewport(0.5, 0, 0.5, 1.0);
        }

        this._aspectRatioAspectRatio = ovrSettings.HResolution / (2 * ovrSettings.VResolution);
        this._aspectRatioFov = (2 * Math.atan((ovrSettings.PostProcessScaleFactor * ovrSettings.VScreenSize) / (2 * ovrSettings.EyeToScreenDistance))) ;
        var hMeters = (ovrSettings.HScreenSize / 4) - (ovrSettings.LensSeparationDistance / 2);
        var h = (4 * hMeters) / ovrSettings.HScreenSize;
        this._hMatrix = BABYLON.Matrix.Translation(isLeftEye ? h : -h, 0, 0);

        this._projectionMatrix = new BABYLON.Matrix();
        this._preViewMatrix = BABYLON.Matrix.Translation(isLeftEye ? .5 * ovrSettings.InterpupillaryDistance : -.5 * ovrSettings.InterpupillaryDistance, 0, 0);
        new BABYLON.oculusDistortionCorrectionPostProcess("Oculus Distortion", this, !isLeftEye, ovrSettings);
    };
    BABYLON.OculusOrientedCamera.buildOculusStereoCamera = function (scene, name, canvas, minZ, maxZ, position, neutralOrientation, useFXAA, controller, ovrSettings) {
        position = position || new BABYLON.Vector2(0, 0);
        neutralOrientation = neutralOrientation || { yaw: 0.0, pitch: 0.0, roll: 0.0 };
        controller = controller || new BABYLON.OculusController();
        ovrSettings = ovrSettings || BABYLON.OculusController.CameraSettings_OculusRiftDevKit2013_Metric;

        var leftCamera = new BABYLON.OculusOrientedCamera(name + "_left", position, scene, controller, true, ovrSettings, neutralOrientation);
        leftCamera.minZ = minZ;
        leftCamera.maxZ = maxZ;
        if (useFXAA) {
            new BABYLON.FxaaPostProcess("fxaa_left", 1.0, leftCamera);
        }

        var rightCamera = new BABYLON.OculusOrientedCamera(name + "_right", position, scene, controller, false, ovrSettings, neutralOrientation);
        rightCamera.minZ = minZ;
        rightCamera.maxZ = maxZ;
        if (useFXAA) {
            new BABYLON.FxaaPostProcess("fxaa_right", 1.0, rightCamera);
        }
        scene.activeCameras = [];
        scene.activeCameras.push(leftCamera);
        scene.activeCameras.push(rightCamera);
        leftCamera.attachControl(canvas);
        rightCamera.attachControl(canvas);
    };
    BABYLON.OculusOrientedCamera.prototype = Object.create(BABYLON.Camera.prototype);

    BABYLON.OculusOrientedCamera.prototype.getViewMatrix = function () {

        BABYLON.Matrix.RotationYawPitchRollToRef(
            this._currentOculusOrientation.yaw + this._neutralOrientation.yaw,
            this._currentOculusOrientation.pitch + this._neutralOrientation.pitch,
            -this._currentOculusOrientation.roll + this._neutralOrientation.roll
            , this._currentOculusOrientationMatrix);

        BABYLON.Vector3.TransformCoordinatesToRef(this._referenceDirection, this._currentOculusOrientationMatrix, this._actualDirection);
        BABYLON.Vector3.TransformCoordinatesToRef(this._referenceUp, this._currentOculusOrientationMatrix, this._actualUp);
        
        BABYLON.Vector3.FromFloatsToRef(this.position.x + this._actualDirection.x, this.position.y + this._actualDirection.y, this.position.z + this._actualDirection.z, this._currentTargetPoint);
        BABYLON.Matrix.LookAtLHToRef(this.position, this._currentTargetPoint, this._actualUp, this._tempMatrix);
        this._tempMatrix.multiplyToRef(this._preViewMatrix, this._currentViewMatrix);
        return this._currentViewMatrix;
    };

    BABYLON.OculusOrientedCamera.prototype._update = function () {
        if (!this._referenceOculusOrientation) {
            this._referenceOculusOrientation = { yaw: this._controller._currentOrientation.yaw, pitch: this._controller._currentOrientation.pitch, roll: this._controller._currentOrientation.roll };
        }
        else {
            this._currentOculusOrientation.yaw = this._controller._currentOrientation.yaw - this._referenceOculusOrientation.yaw;
            this._currentOculusOrientation.pitch = this._controller._currentOrientation.pitch - this._referenceOculusOrientation.pitch;
            this._currentOculusOrientation.roll = this._controller._currentOrientation.roll - this._referenceOculusOrientation.roll;
        }
    };

    BABYLON.OculusOrientedCamera.prototype.getProjectionMatrix = function (force) {
        BABYLON.Matrix.PerspectiveFovLHToRef(this._aspectRatioFov, this._aspectRatioAspectRatio, this.minZ, this.maxZ, this._tempMatrix);
        this._tempMatrix.multiplyToRef(this._hMatrix, this._projectionMatrix);
        return this._projectionMatrix;
    };
})();