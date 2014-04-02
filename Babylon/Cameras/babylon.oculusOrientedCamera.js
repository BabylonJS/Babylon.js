"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.OculusOrientedCamera = function (name, position, scene, isLeftEye, ovrSettings, neutralOrientation) {
        BABYLON.Camera.call(this, name, position, scene);
        this._referenceDirection = new BABYLON.Vector3(0, 0, 1);
        this._referenceUp = new BABYLON.Vector3(0, 1, 0);
        this._actualDirection = new BABYLON.Vector3(1, 0, 0);
        this._actualUp = new BABYLON.Vector3(0, 1, 0);
        this._currentTargetPoint = new BABYLON.Vector3(0, 0, 0);
        this._currentOrientation = Object.create(neutralOrientation || { yaw: 0.0, pitch: 0.0, roll: 0.0 });
        this._currentViewMatrix = new BABYLON.Matrix();
        this._currentOrientationMatrix = new BABYLON.Matrix();
        this._currentInvertOrientationMatrix = new BABYLON.Matrix();
        this._tempMatrix = new BABYLON.Matrix();
        
        if (isLeftEye) {
            this.viewport = new BABYLON.Viewport(0, 0, 0.5, 1.0);
        } else {
            this.viewport = new BABYLON.Viewport(0.5, 0, 0.5, 1.0);
        }

        this._aspectRatioAspectRatio = ovrSettings.HResolution / (2 * ovrSettings.VResolution);
        this._aspectRatioFov = (2 * Math.atan((ovrSettings.PostProcessScaleFactor * ovrSettings.VScreenSize) / (2 * ovrSettings.EyeToScreenDistance)));
        var hMeters = (ovrSettings.HScreenSize / 4) - (ovrSettings.LensSeparationDistance / 2);
        var h = (4 * hMeters) / ovrSettings.HScreenSize;
        this._hMatrix = BABYLON.Matrix.Translation(isLeftEye ? h : -h, 0, 0);

        this._projectionMatrix = new BABYLON.Matrix();
        this._preViewMatrix = BABYLON.Matrix.Translation(isLeftEye ? .5 * ovrSettings.InterpupillaryDistance : -.5 * ovrSettings.InterpupillaryDistance, 0, 0);
        new BABYLON.OculusDistortionCorrectionPostProcess("Oculus Distortion", this, !isLeftEye, ovrSettings);
        this.resetProjectionMatrix();
        this.resetViewMatrix();
    };
    
    BABYLON.OculusOrientedCamera.BuildOculusStereoCamera = function (scene, name, minZ, maxZ, position, neutralOrientation, useFXAA, disableGravity, disableCollisions, collisionEllipsoid, ovrSettings) {
        var canvas = scene.getEngine().getRenderingCanvas();
        position = position || BABYLON.Vector3.Zero(0, 0, 0);
        neutralOrientation = neutralOrientation || { yaw: 0.0, pitch: 0.0, roll: 0.0 };
        //var controller =  new BABYLON.OculusController();
        ovrSettings = ovrSettings || BABYLON.OculusController.CameraSettings_OculusRiftDevKit2013_Metric;

        var leftCamera = new BABYLON.OculusOrientedCamera(name + "_left", position, scene, true, ovrSettings, neutralOrientation);
        leftCamera.minZ = minZ;
        leftCamera.maxZ = maxZ;
        if (useFXAA) {
            new BABYLON.FxaaPostProcess("fxaa_left", 1.0, leftCamera);
        }

        var rightCamera = new BABYLON.OculusOrientedCamera(name + "_right", position, scene, false, ovrSettings, neutralOrientation);
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
        var multiTarget = new BABYLON.InputControllerMultiTarget([leftCamera, rightCamera]);
        var controller = new BABYLON.OculusController(scene, multiTarget);
        var moveTarget = multiTarget;
        if (!disableCollisions) {
            var collisionFilter = new BABYLON.InputCollisionFilter(scene, multiTarget, collisionEllipsoid);
            moveTarget = collisionFilter;
        }
        if (!disableGravity) {

            var globalAxisFactorFilter = new BABYLON.GlobalAxisFactorsFilter(scene, moveTarget, 1, 0, 1);
            var gravityController = new BABYLON.GravityInputController(scene, moveTarget);
            moveTarget = globalAxisFactorFilter;
        }
        var moveController = new BABYLON.KeyboardMoveController(scene, moveTarget);
        moveController.attachToCanvas(canvas);
        var result = {
            leftCamera: leftCamera, rightCamera: rightCamera, intermediateControllerTarget: multiTarget,
            oculusController: controller,
            keyboardController: moveController
        };
        result.dispose = function () {
            this.leftCamera.detachControl(canvas);
            this.rightCamera.detachControl(canvas);
            this.leftCamera.dispose();
            this.rightCamera.dispose();
            this.oculusController.dispose();
            this.keyboardController.detachFromCanvas(canvas);
            this.keyboardController.dispose();
        }.bind(result);
        return result;
    };
    
    BABYLON.OculusOrientedCamera.prototype = Object.create(BABYLON.Camera.prototype);

    BABYLON.OculusOrientedCamera.prototype.resetViewMatrix = function () {
        BABYLON.Matrix.RotationYawPitchRollToRef(
            this._currentOrientation.yaw,
            this._currentOrientation.pitch,
            -this._currentOrientation.roll
            , this._currentOrientationMatrix);
        this._currentOrientationMatrix.invertToRef(this._currentInvertOrientationMatrix);

        BABYLON.Vector3.TransformNormalToRef(this._referenceDirection, this._currentOrientationMatrix, this._actualDirection);
        BABYLON.Vector3.TransformNormalToRef(this._referenceUp, this._currentOrientationMatrix, this._actualUp);

        BABYLON.Vector3.FromFloatsToRef(this.position.x + this._actualDirection.x, this.position.y + this._actualDirection.y, this.position.z + this._actualDirection.z, this._currentTargetPoint);
        BABYLON.Matrix.LookAtLHToRef(this.position, this._currentTargetPoint, this._actualUp, this._tempMatrix);
        this._tempMatrix.multiplyToRef(this._preViewMatrix, this._currentViewMatrix);
        return this._currentViewMatrix;
    };
    BABYLON.OculusOrientedCamera.prototype.getViewMatrix = function () {

        return this._currentViewMatrix;
    };

    BABYLON.OculusOrientedCamera.prototype._update = function () {
        if (this.controllers) {
            for (var i = 0; i < this.controllers.length; ++i) {
                this.controllers[i].update();
            }
        }
    };

    BABYLON.OculusOrientedCamera.prototype.getOrientationMatrix = function () {
        return this._currentOrientationMatrix;
    };

    BABYLON.OculusOrientedCamera.prototype.getInvertOrientationMatrix = function () {
        return this._currentInvertOrientationMatrix;
    };

    BABYLON.OculusOrientedCamera.prototype.resetProjectionMatrix = function () {
        BABYLON.Matrix.PerspectiveFovLHToRef(this._aspectRatioFov, this._aspectRatioAspectRatio, this.minZ, this.maxZ, this._tempMatrix);
        this._tempMatrix.multiplyToRef(this._hMatrix, this._projectionMatrix);
        return this._projectionMatrix;
    };

    BABYLON.OculusOrientedCamera.prototype.getProjectionMatrix = function (force) {
        return this._projectionMatrix;
    };

    // implementation of InputControllerTarget
    BABYLON.OculusOrientedCamera.prototype.getOrientation = function () {
        return this._currentOrientation;
    };
    BABYLON.OculusOrientedCamera.prototype.getPosition = function () {
        return this.position;
    };
    BABYLON.OculusOrientedCamera.prototype.moveRelative = function (movementVector) {
        if (!this._tempMoveVector) {
            this._tempMoveVector = new BABYLON.Vector3(0, 0, 0);
        }
        BABYLON.Vector3.TransformNormalToRef(movementVector, this._currentOrientationMatrix, this._tempMoveVector);
        this.position.addInPlace(this._tempMoveVector);
        this.resetViewMatrix();
    };
    BABYLON.OculusOrientedCamera.prototype.rotateRelative = function (rotation) {
        this._currentOrientation.yaw += rotation.yaw;
        this._currentOrientation.pitch += rotation.pitch;
        this._currentOrientation.roll += rotation.roll;
        this.resetViewMatrix();
    };
})();