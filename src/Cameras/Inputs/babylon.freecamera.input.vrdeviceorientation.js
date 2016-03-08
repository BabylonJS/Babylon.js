var BABYLON;
(function (BABYLON) {
    var FreeCameraVRDeviceOrientationInput = (function () {
        function FreeCameraVRDeviceOrientationInput() {
            this._alpha = 0;
            this._beta = 0;
            this._gamma = 0;
            this._deviceOrientationHandler = this._onOrientationEvent.bind(this);
        }
        FreeCameraVRDeviceOrientationInput.prototype.attachCamera = function (camera) {
            this.camera = camera;
            window.addEventListener("deviceorientation", this._deviceOrientationHandler);
        };
        FreeCameraVRDeviceOrientationInput.prototype._onOrientationEvent = function (evt) {
            var camera = this.camera;
            this._alpha = +evt.alpha | 0;
            this._beta = +evt.beta | 0;
            this._gamma = +evt.gamma | 0;
            if (this._gamma < 0) {
                this._gamma = 90 + this._gamma;
            }
            else {
                // Incline it in the correct angle.
                this._gamma = 270 - this._gamma;
            }
            camera.rotation.x = this._gamma / 180.0 * Math.PI;
            camera.rotation.y = -this._alpha / 180.0 * Math.PI;
            camera.rotation.z = this._beta / 180.0 * Math.PI;
        };
        FreeCameraVRDeviceOrientationInput.prototype.detach = function () {
            window.removeEventListener("deviceorientation", this._deviceOrientationHandler);
        };
        FreeCameraVRDeviceOrientationInput.prototype.getTypeName = function () {
            return "FreeCameraVRDeviceOrientationInput";
        };
        FreeCameraVRDeviceOrientationInput.prototype.getSimpleName = function () {
            return "VRDeviceOrientation";
        };
        return FreeCameraVRDeviceOrientationInput;
    }());
    BABYLON.FreeCameraVRDeviceOrientationInput = FreeCameraVRDeviceOrientationInput;
    BABYLON.CameraInputTypes["FreeCameraVRDeviceOrientationInput"] = FreeCameraVRDeviceOrientationInput;
})(BABYLON || (BABYLON = {}));
