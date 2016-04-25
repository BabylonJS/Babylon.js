var BABYLON;
(function (BABYLON) {
    var FreeCameraVRDeviceOrientationInput = (function () {
        function FreeCameraVRDeviceOrientationInput() {
            this.alphaCorrection = 1;
            this.betaCorrection = 1;
            this.gammaCorrection = 1;
            this._alpha = 0;
            this._beta = 0;
            this._gamma = 0;
            this._dirty = false;
            this._deviceOrientationHandler = this._onOrientationEvent.bind(this);
        }
        FreeCameraVRDeviceOrientationInput.prototype.attachControl = function (element, noPreventDefault) {
            window.addEventListener("deviceorientation", this._deviceOrientationHandler);
        };
        FreeCameraVRDeviceOrientationInput.prototype._onOrientationEvent = function (evt) {
            var camera = this.camera;
            this._alpha = +evt.alpha | 0;
            this._beta = +evt.beta | 0;
            this._gamma = +evt.gamma | 0;
            this._dirty = true;
        };
        FreeCameraVRDeviceOrientationInput.prototype.checkInputs = function () {
            if (this._dirty) {
                this._dirty = false;
                var rotationX = this._gamma;
                if (rotationX < 0) {
                    rotationX = 90 + rotationX;
                }
                else {
                    // Incline it in the correct angle.
                    rotationX = 270 - rotationX;
                }
                var rotationZ = this._beta;
                if (this._gamma < 0) {
                    // Correct Z rotation when looking down towards ground.
                    rotationZ = -rotationZ;
                }
                this.camera.rotation.x = this.gammaCorrection * rotationX / 180.0 * Math.PI;
                this.camera.rotation.y = this.alphaCorrection * -this._alpha / 180.0 * Math.PI;
                this.camera.rotation.z = this.betaCorrection * rotationZ / 180.0 * Math.PI;
            }
        };
        FreeCameraVRDeviceOrientationInput.prototype.detachControl = function (element) {
            window.removeEventListener("deviceorientation", this._deviceOrientationHandler);
        };
        FreeCameraVRDeviceOrientationInput.prototype.getTypeName = function () {
            return "FreeCameraVRDeviceOrientationInput";
        };
        FreeCameraVRDeviceOrientationInput.prototype.getSimpleName = function () {
            return "VRDeviceOrientation";
        };
        return FreeCameraVRDeviceOrientationInput;
    })();
    BABYLON.FreeCameraVRDeviceOrientationInput = FreeCameraVRDeviceOrientationInput;
    BABYLON.CameraInputTypes["FreeCameraVRDeviceOrientationInput"] = FreeCameraVRDeviceOrientationInput;
})(BABYLON || (BABYLON = {}));
