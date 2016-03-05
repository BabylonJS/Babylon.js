var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BABYLON;
(function (BABYLON) {
    var ComposableCameraDeviceOrientationInput = (function () {
        function ComposableCameraDeviceOrientationInput() {
            this._offsetX = null;
            this._offsetY = null;
            this._orientationGamma = 0;
            this._orientationBeta = 0;
            this._initialOrientationGamma = 0;
            this._initialOrientationBeta = 0;
            this.angularSensibility = 10000.0;
            this.moveSensibility = 50.0;
            this._resetOrientationGamma = this.resetOrientationGamma.bind(this);
            this._orientationChanged = this.orientationChanged.bind(this);
        }
        ComposableCameraDeviceOrientationInput.prototype.attachCamera = function (camera) {
            this.camera = camera;
            window.addEventListener("resize", this._resetOrientationGamma, false);
            window.addEventListener("deviceorientation", this._orientationChanged);
        };
        ComposableCameraDeviceOrientationInput.prototype.resetOrientationGamma = function () {
            this._initialOrientationGamma = null;
        };
        ComposableCameraDeviceOrientationInput.prototype.orientationChanged = function (evt) {
            if (!this._initialOrientationGamma) {
                this._initialOrientationGamma = evt.gamma;
                this._initialOrientationBeta = evt.beta;
            }
            this._orientationGamma = evt.gamma;
            this._orientationBeta = evt.beta;
            this._offsetY = (this._initialOrientationBeta - this._orientationBeta);
            this._offsetX = (this._initialOrientationGamma - this._orientationGamma);
        };
        ComposableCameraDeviceOrientationInput.prototype.detach = function () {
            window.removeEventListener("resize", this._resetOrientationGamma);
            window.removeEventListener("deviceorientation", this._orientationChanged);
            this._orientationGamma = 0;
            this._orientationBeta = 0;
            this._initialOrientationGamma = 0;
            this._initialOrientationBeta = 0;
        };
        ComposableCameraDeviceOrientationInput.prototype.checkInputs = function () {
            if (!this._offsetX) {
                return;
            }
            var camera = this.camera;
            camera.cameraRotation.y -= this._offsetX / this.angularSensibility;
            var speed = camera._computeLocalCameraSpeed();
            var direction = new BABYLON.Vector3(0, 0, speed * this._offsetY / this.moveSensibility);
            BABYLON.Matrix.RotationYawPitchRollToRef(camera.rotation.y, camera.rotation.x, 0, camera._cameraRotationMatrix);
            camera.cameraDirection.addInPlace(BABYLON.Vector3.TransformCoordinates(direction, camera._cameraRotationMatrix));
        };
        ComposableCameraDeviceOrientationInput.prototype.getTypeName = function () {
            return "deviceorientation";
        };
        __decorate([
            BABYLON.serialize()
        ], ComposableCameraDeviceOrientationInput.prototype, "angularSensibility", void 0);
        __decorate([
            BABYLON.serialize()
        ], ComposableCameraDeviceOrientationInput.prototype, "moveSensibility", void 0);
        return ComposableCameraDeviceOrientationInput;
    }());
    BABYLON.ComposableCameraDeviceOrientationInput = ComposableCameraDeviceOrientationInput;
})(BABYLON || (BABYLON = {}));
