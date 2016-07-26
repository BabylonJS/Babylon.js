var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var WebVRFreeCamera = (function (_super) {
        __extends(WebVRFreeCamera, _super);
        function WebVRFreeCamera(name, position, scene, compensateDistortion, vrCameraMetrics) {
            if (compensateDistortion === void 0) { compensateDistortion = true; }
            if (vrCameraMetrics === void 0) { vrCameraMetrics = BABYLON.VRCameraMetrics.GetDefault(); }
            _super.call(this, name, position, scene);
            this._hmdDevice = null;
            this._sensorDevice = null;
            this._cacheState = null;
            this._vrEnabled = false;
            vrCameraMetrics.compensateDistortion = compensateDistortion;
            this.setCameraRigMode(BABYLON.Camera.RIG_MODE_VR, { vrCameraMetrics: vrCameraMetrics });
            this._getWebVRDevices = this._getWebVRDevices.bind(this);
            this.rotationQuaternion = new BABYLON.Quaternion();
            this._quaternionCache = new BABYLON.Quaternion();
        }
        WebVRFreeCamera.prototype._getWebVRDevices = function (devices) {
            var size = devices.length;
            var i = 0;
            // Reset devices.
            this._sensorDevice = null;
            this._hmdDevice = null;
            // Search for a HmdDevice.
            while (i < size && this._hmdDevice === null) {
                if (devices[i] instanceof HMDVRDevice) {
                    this._hmdDevice = devices[i];
                }
                i++;
            }
            i = 0;
            while (i < size && this._sensorDevice === null) {
                if (devices[i] instanceof PositionSensorVRDevice && (!this._hmdDevice || devices[i].hardwareUnitId === this._hmdDevice.hardwareUnitId)) {
                    this._sensorDevice = devices[i];
                }
                i++;
            }
            this._vrEnabled = this._sensorDevice && this._hmdDevice ? true : false;
        };
        WebVRFreeCamera.prototype._checkInputs = function () {
            if (this._vrEnabled) {
                this._cacheState = this._sensorDevice.getState();
                this.rotationQuaternion.copyFrom(this._cacheState.orientation);
                //Flip in XY plane
                this.rotationQuaternion.z *= -1;
                this.rotationQuaternion.w *= -1;
                if (this._initialQuaternion) {
                    this._quaternionCache.copyFrom(this.rotationQuaternion);
                    this._initialQuaternion.multiplyToRef(this.rotationQuaternion, this.rotationQuaternion);
                }
            }
            _super.prototype._checkInputs.call(this);
        };
        WebVRFreeCamera.prototype.attachControl = function (element, noPreventDefault) {
            _super.prototype.attachControl.call(this, element, noPreventDefault);
            noPreventDefault = BABYLON.Camera.ForceAttachControlToAlwaysPreventDefault ? false : noPreventDefault;
            if (navigator.getVRDevices) {
                navigator.getVRDevices().then(this._getWebVRDevices);
            }
            else if (navigator.mozGetVRDevices) {
                navigator.mozGetVRDevices(this._getWebVRDevices);
            }
        };
        WebVRFreeCamera.prototype.detachControl = function (element) {
            _super.prototype.detachControl.call(this, element);
            this._vrEnabled = false;
        };
        WebVRFreeCamera.prototype.requestVRFullscreen = function (requestPointerlock) {
            if (!this._hmdDevice)
                return;
            this.getEngine().switchFullscreen(requestPointerlock, { vrDisplay: this._hmdDevice });
        };
        WebVRFreeCamera.prototype.getTypeName = function () {
            return "WebVRFreeCamera";
        };
        WebVRFreeCamera.prototype.resetToCurrentRotation = function (axis) {
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
        return WebVRFreeCamera;
    }(BABYLON.FreeCamera));
    BABYLON.WebVRFreeCamera = WebVRFreeCamera;
})(BABYLON || (BABYLON = {}));
