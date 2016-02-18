var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var VRDeviceOrientationFreeCamera = (function (_super) {
        __extends(VRDeviceOrientationFreeCamera, _super);
        function VRDeviceOrientationFreeCamera(name, position, scene, compensateDistortion) {
            if (compensateDistortion === void 0) { compensateDistortion = true; }
            _super.call(this, name, position, scene);
            this._alpha = 0;
            this._beta = 0;
            this._gamma = 0;
            var metrics = BABYLON.VRCameraMetrics.GetDefault();
            metrics.compensateDistortion = compensateDistortion;
            this.setCameraRigMode(BABYLON.Camera.RIG_MODE_VR, { vrCameraMetrics: metrics });
            this._deviceOrientationHandler = this._onOrientationEvent.bind(this);
        }
        VRDeviceOrientationFreeCamera.prototype._onOrientationEvent = function (evt) {
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
            this.rotation.x = this._gamma / 180.0 * Math.PI;
            this.rotation.y = -this._alpha / 180.0 * Math.PI;
            this.rotation.z = this._beta / 180.0 * Math.PI;
        };
        VRDeviceOrientationFreeCamera.prototype.attachControl = function (element, noPreventDefault) {
            _super.prototype.attachControl.call(this, element, noPreventDefault);
            window.addEventListener("deviceorientation", this._deviceOrientationHandler);
        };
        VRDeviceOrientationFreeCamera.prototype.detachControl = function (element) {
            _super.prototype.detachControl.call(this, element);
            window.removeEventListener("deviceorientation", this._deviceOrientationHandler);
        };
        VRDeviceOrientationFreeCamera.prototype.serialize = function () {
            var serializationObject = _super.prototype.serialize.call(this);
            serializationObject.type = "VRDeviceOrientationFreeCamera";
            return serializationObject;
        };
        return VRDeviceOrientationFreeCamera;
    })(BABYLON.FreeCamera);
    BABYLON.VRDeviceOrientationFreeCamera = VRDeviceOrientationFreeCamera;
})(BABYLON || (BABYLON = {}));
