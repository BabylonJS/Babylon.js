var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    // We're mainly based on the logic defined into the FreeCamera code
    var DeviceOrientationCamera = (function (_super) {
        __extends(DeviceOrientationCamera, _super);
        function DeviceOrientationCamera(name, position, scene) {
            _super.call(this, name, position, scene);
            this.inputs.addDeviceOrientation();
        }
        DeviceOrientationCamera.prototype.getTypeName = function () {
            return "DeviceOrientationCamera";
        };
        DeviceOrientationCamera.prototype._checkInputs = function () {
            _super.prototype._checkInputs.call(this);
            if (this._initialQuaternion) {
                this._quaternionCache.copyFrom(this.rotationQuaternion);
                this._initialQuaternion.multiplyToRef(this.rotationQuaternion, this.rotationQuaternion);
            }
        };
        DeviceOrientationCamera.prototype.resetToCurrentRotation = function (axis) {
            var _this = this;
            if (axis === void 0) { axis = BABYLON.Axis.Y; }
            //can only work if this camera has a rotation quaternion already.
            if (!this.rotationQuaternion)
                return;
            if (!this._initialQuaternion) {
                this._initialQuaternion = new BABYLON.Quaternion();
            }
            this._initialQuaternion.copyFrom(this._quaternionCache || this.rotationQuaternion);
            ['x', 'y', 'z'].forEach(function (axisName) {
                if (!axis[axisName]) {
                    _this._initialQuaternion[axisName] = 0;
                }
                else {
                    _this._initialQuaternion[axisName] *= -1;
                }
            });
            this._initialQuaternion.normalize();
        };
        return DeviceOrientationCamera;
    })(BABYLON.FreeCamera);
    BABYLON.DeviceOrientationCamera = DeviceOrientationCamera;
})(BABYLON || (BABYLON = {}));
