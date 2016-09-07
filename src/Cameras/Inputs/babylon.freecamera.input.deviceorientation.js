var BABYLON;
(function (BABYLON) {
    var FreeCameraDeviceOrientationInput = (function () {
        function FreeCameraDeviceOrientationInput() {
            var _this = this;
            this._screenOrientationAngle = 0;
            this._screenQuaternion = new BABYLON.Quaternion();
            this._alpha = 0;
            this._beta = 0;
            this._gamma = 0;
            this._orientationChanged = function () {
                _this._screenOrientationAngle = (window.orientation !== undefined ? +window.orientation : (window.screen.orientation && window.screen.orientation['angle'] ? window.screen.orientation.angle : 0));
                _this._screenOrientationAngle = -BABYLON.Tools.ToRadians(_this._screenOrientationAngle / 2);
                _this._screenQuaternion.copyFromFloats(0, Math.sin(_this._screenOrientationAngle), 0, Math.cos(_this._screenOrientationAngle));
            };
            this._deviceOrientation = function (evt) {
                _this._alpha = evt.alpha;
                _this._beta = evt.beta;
                _this._gamma = evt.gamma;
            };
            this._constantTranform = new BABYLON.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
            this._orientationChanged();
        }
        Object.defineProperty(FreeCameraDeviceOrientationInput.prototype, "camera", {
            get: function () {
                return this._camera;
            },
            set: function (camera) {
                this._camera = camera;
                if (!this._camera.rotationQuaternion)
                    this._camera.rotationQuaternion = new BABYLON.Quaternion();
            },
            enumerable: true,
            configurable: true
        });
        FreeCameraDeviceOrientationInput.prototype.attachControl = function (element, noPreventDefault) {
            window.addEventListener("orientationchange", this._orientationChanged);
            window.addEventListener("deviceorientation", this._deviceOrientation);
            //In certain cases, the attach control is called AFTER orientation was changed,
            //So this is needed.
            this._orientationChanged();
        };
        FreeCameraDeviceOrientationInput.prototype.detachControl = function (element) {
            window.removeEventListener("orientationchange", this._orientationChanged);
            window.removeEventListener("deviceorientation", this._deviceOrientation);
        };
        FreeCameraDeviceOrientationInput.prototype.checkInputs = function () {
            BABYLON.Quaternion.RotationYawPitchRollToRef(BABYLON.Tools.ToRadians(this._alpha), BABYLON.Tools.ToRadians(this._beta), -BABYLON.Tools.ToRadians(this._gamma), this.camera.rotationQuaternion);
            this._camera.rotationQuaternion.multiplyInPlace(this._screenQuaternion);
            this._camera.rotationQuaternion.multiplyInPlace(this._constantTranform);
            //Mirror on XY Plane
            this._camera.rotationQuaternion.z *= -1;
            this._camera.rotationQuaternion.w *= -1;
        };
        FreeCameraDeviceOrientationInput.prototype.getTypeName = function () {
            return "FreeCameraDeviceOrientationInput";
        };
        FreeCameraDeviceOrientationInput.prototype.getSimpleName = function () {
            return "deviceOrientation";
        };
        return FreeCameraDeviceOrientationInput;
    }());
    BABYLON.FreeCameraDeviceOrientationInput = FreeCameraDeviceOrientationInput;
    BABYLON.CameraInputTypes["FreeCameraDeviceOrientationInput"] = FreeCameraDeviceOrientationInput;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.freecamera.input.deviceorientation.js.map