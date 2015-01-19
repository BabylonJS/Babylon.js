var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var VRDeviceOrientationCamera = (function (_super) {
        __extends(VRDeviceOrientationCamera, _super);
        function VRDeviceOrientationCamera(name, position, scene) {
            _super.call(this, name, position, scene);
            this._alpha = 0;
            this._beta = 0;
            this._gamma = 0;
        }
        VRDeviceOrientationCamera.prototype._onOrientationEvent = function (evt) {
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
        return VRDeviceOrientationCamera;
    })(BABYLON.OculusCamera);
    BABYLON.VRDeviceOrientationCamera = VRDeviceOrientationCamera;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.vrDeviceOrientationCamera.js.map