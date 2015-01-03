var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var WebVRCamera = (function (_super) {
        __extends(WebVRCamera, _super);
        function WebVRCamera(name, position, scene) {
            _super.call(this, name, position, scene);
            this._hmdDevice = null;
            this._sensorDevice = null;
            this._cacheState = null;
            this._cacheQuaternion = new BABYLON.Quaternion();
            this._cacheRotation = BABYLON.Vector3.Zero();
            this._vrEnabled = false;
            this._getWebVRDevices = this._getWebVRDevices.bind(this);
        }
        WebVRCamera.prototype._getWebVRDevices = function (devices) {
            var size = devices.length;
            var i = 0;

            // Reset devices.
            this._sensorDevice = null;
            this._hmdDevice = null;

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

        WebVRCamera.prototype._update = function () {
            if (this._vrEnabled) {
                this._cacheState = this._sensorDevice.getState();
                this._cacheQuaternion.copyFromFloats(this._cacheState.orientation.x, this._cacheState.orientation.y, this._cacheState.orientation.z, this._cacheState.orientation.w);
                this._cacheQuaternion.toEulerAnglesToRef(this._cacheRotation);

                this.rotation.x = -this._cacheRotation.z;
                this.rotation.y = -this._cacheRotation.y;
                this.rotation.z = this._cacheRotation.x;
            }

            _super.prototype._update.call(this);
        };

        WebVRCamera.prototype.attachControl = function (element, noPreventDefault) {
            _super.prototype.attachControl.call(this, element, noPreventDefault);

            if (navigator.getVRDevices) {
                navigator.getVRDevices().then(this._getWebVRDevices);
            } else if (navigator.mozGetVRDevices) {
                navigator.mozGetVRDevices(this._getWebVRDevices);
            }
        };

        WebVRCamera.prototype.detachControl = function (element) {
            _super.prototype.detachControl.call(this, element);
            this._vrEnabled = false;
        };
        return WebVRCamera;
    })(BABYLON.OculusCamera);
    BABYLON.WebVRCamera = WebVRCamera;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.webVRCamera.js.map
