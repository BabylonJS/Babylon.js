var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var OculusRiftDevKit2013_Metric = {
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

    var _OculusInnerGamepadCamera = (function (_super) {
        __extends(_OculusInnerGamepadCamera, _super);
        function _OculusInnerGamepadCamera(name, position, scene, isLeftEye) {
            _super.call(this, name, position, scene);
            this._workMatrix = new BABYLON.Matrix();
            this._actualUp = new BABYLON.Vector3(0, 0, 0);

            // Constants
            this._aspectRatioAspectRatio = OculusRiftDevKit2013_Metric.HResolution / (2 * OculusRiftDevKit2013_Metric.VResolution);
            this._aspectRatioFov = (2 * Math.atan((OculusRiftDevKit2013_Metric.PostProcessScaleFactor * OculusRiftDevKit2013_Metric.VScreenSize) / (2 * OculusRiftDevKit2013_Metric.EyeToScreenDistance)));

            var hMeters = (OculusRiftDevKit2013_Metric.HScreenSize / 4) - (OculusRiftDevKit2013_Metric.LensSeparationDistance / 2);
            var h = (4 * hMeters) / OculusRiftDevKit2013_Metric.HScreenSize;

            this._hMatrix = BABYLON.Matrix.Translation(isLeftEye ? h : -h, 0, 0);

            this.viewport = new BABYLON.Viewport(isLeftEye ? 0 : 0.5, 0, 0.5, 1.0);

            this._preViewMatrix = BABYLON.Matrix.Translation(isLeftEye ? .5 * OculusRiftDevKit2013_Metric.InterpupillaryDistance : -.5 * OculusRiftDevKit2013_Metric.InterpupillaryDistance, 0, 0);

            // Postprocess
            var postProcess = new BABYLON.OculusDistortionCorrectionPostProcess("Oculus Distortion", this, !isLeftEye, OculusRiftDevKit2013_Metric);
        }
        _OculusInnerGamepadCamera.prototype.getProjectionMatrix = function () {
            BABYLON.Matrix.PerspectiveFovLHToRef(this._aspectRatioFov, this._aspectRatioAspectRatio, this.minZ, this.maxZ, this._workMatrix);
            this._workMatrix.multiplyToRef(this._hMatrix, this._projectionMatrix);
            return this._projectionMatrix;
        };

        _OculusInnerGamepadCamera.prototype._getViewMatrix = function () {
            BABYLON.Matrix.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, this.rotation.z, this._cameraRotationMatrix);

            BABYLON.Vector3.TransformCoordinatesToRef(this._referencePoint, this._cameraRotationMatrix, this._transformedReferencePoint);
            BABYLON.Vector3.TransformNormalToRef(this.upVector, this._cameraRotationMatrix, this._actualUp);

            // Computing target and final matrix
            this.position.addToRef(this._transformedReferencePoint, this._currentTarget);

            BABYLON.Matrix.LookAtLHToRef(this.position, this._currentTarget, this._actualUp, this._workMatrix);

            this._workMatrix.multiplyToRef(this._preViewMatrix, this._viewMatrix);
            return this._viewMatrix;
        };
        return _OculusInnerGamepadCamera;
    })(BABYLON.FreeCamera);

    var OculusGamepadCamera = (function (_super) {
        __extends(OculusGamepadCamera, _super);
        function OculusGamepadCamera(name, position, scene) {
            var _this = this;
            _super.call(this, name, position, scene);
            this.angularSensibility = 200;
            this.moveSensibility = 75;

            this._leftCamera = new _OculusInnerGamepadCamera(name + "_left", position.clone(), scene, true);
            this._rightCamera = new _OculusInnerGamepadCamera(name + "_right", position.clone(), scene, false);

            this.subCameras.push(this._leftCamera);
            this.subCameras.push(this._rightCamera);

            this._deviceOrientationHandler = this._onOrientationEvent.bind(this);
            this._gamepads = new BABYLON.Gamepads(function (gamepad) {
                _this._onNewGameConnected(gamepad);
            });
        }
        OculusGamepadCamera.prototype._onNewGameConnected = function (gamepad) {
            // Only the first gamepad can control the camera
            if (gamepad.index === 0) {
                this._gamepad = gamepad;
            }
        };

        OculusGamepadCamera.prototype._update = function () {
            this._leftCamera.position.copyFrom(this.position);
            this._rightCamera.position.copyFrom(this.position);

            this._updateCamera(this._leftCamera);
            this._updateCamera(this._rightCamera);

            _super.prototype._update.call(this);
        };

        OculusGamepadCamera.prototype._checkInputs = function () {
            if (!this._gamepad) {
                return;
            }

            var LSValues = this._gamepad.leftStick;
            var normalizedLX = LSValues.x / this.moveSensibility;
            var normalizedLY = LSValues.y / this.moveSensibility;
            LSValues.x = Math.abs(normalizedLX) > 0.005 ? 0 + normalizedLX : 0;
            LSValues.y = Math.abs(normalizedLY) > 0.005 ? 0 + normalizedLY : 0;

            var cameraTransform = BABYLON.Matrix.RotationYawPitchRoll(this.rotation.y, this.rotation.x, 0);
            var deltaTransform = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(LSValues.x, 0, -LSValues.y), cameraTransform);
            this.cameraDirection = this.cameraDirection.add(deltaTransform);
        };

        OculusGamepadCamera.prototype._updateCamera = function (camera) {
            camera.minZ = this.minZ;
            camera.maxZ = this.maxZ;

            camera.rotation.x = this.rotation.x;
            camera.rotation.y = this.rotation.y;
            camera.rotation.z = this.rotation.z;
        };

        // Oculus events
        OculusGamepadCamera.prototype._onOrientationEvent = function (evt) {
            var yaw = evt.alpha / 180 * Math.PI;
            var pitch = evt.beta / 180 * Math.PI;
            var roll = evt.gamma / 180 * Math.PI;

            if (!this._offsetOrientation) {
                this._offsetOrientation = {
                    yaw: yaw,
                    pitch: pitch,
                    roll: roll
                };
                return;
            } else {
                this.rotation.y += yaw - this._offsetOrientation.yaw;
                this.rotation.x += pitch - this._offsetOrientation.pitch;
                this.rotation.z += this._offsetOrientation.roll - roll;

                this._offsetOrientation.yaw = yaw;
                this._offsetOrientation.pitch = pitch;
                this._offsetOrientation.roll = roll;
            }
        };

        OculusGamepadCamera.prototype.attachControl = function (element, noPreventDefault) {
            _super.prototype.attachControl.call(this, element, noPreventDefault);

            window.addEventListener("deviceorientation", this._deviceOrientationHandler);
        };

        OculusGamepadCamera.prototype.detachControl = function (element) {
            _super.prototype.detachControl.call(this, element);

            window.removeEventListener("deviceorientation", this._deviceOrientationHandler);
        };

        OculusGamepadCamera.prototype.dispose = function () {
            this._gamepads.dispose();
            _super.prototype.dispose.call(this);
        };
        return OculusGamepadCamera;
    })(BABYLON.FreeCamera);
    BABYLON.OculusGamepadCamera = OculusGamepadCamera;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.oculusGamepadCamera.js.map
