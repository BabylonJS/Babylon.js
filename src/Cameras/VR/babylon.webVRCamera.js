var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var WebVRFreeCamera = (function (_super) {
        __extends(WebVRFreeCamera, _super);
        function WebVRFreeCamera(name, position, scene, compensateDistortion, vrCameraMetrics, webVROptions) {
            var _this = this;
            if (compensateDistortion === void 0) { compensateDistortion = true; }
            if (vrCameraMetrics === void 0) { vrCameraMetrics = BABYLON.VRCameraMetrics.GetDefault(); }
            if (webVROptions === void 0) { webVROptions = {}; }
            _super.call(this, name, position, scene);
            this.webVROptions = webVROptions;
            this._vrDevice = null;
            this._cacheState = null;
            this._vrEnabled = false;
            vrCameraMetrics.compensateDistortion = compensateDistortion;
            this.setCameraRigMode(BABYLON.Camera.RIG_MODE_VR, { vrCameraMetrics: vrCameraMetrics });
            //this._getWebVRDevices = this._getWebVRDevices.bind(this);
            if (!this.getEngine().vrDisplaysPromise) {
                BABYLON.Tools.Error("WebVR is not enabled on your browser");
            }
            else {
                //TODO get the metrics updated using the device's eye parameters!
                this.getEngine().vrDisplaysPromise.then(function (devices) {
                    if (devices.length > 0) {
                        _this._vrEnabled = true;
                        if (_this.webVROptions.displayName) {
                            devices.some(function (device) {
                                if (device.displayName === _this.webVROptions.displayName) {
                                    _this._vrDevice = device;
                                    return true;
                                }
                                else {
                                    return false;
                                }
                            });
                        }
                        else {
                            //choose the first one
                            _this._vrDevice = devices[0];
                        }
                    }
                    else {
                        BABYLON.Tools.Error("No WebVR devices found!");
                    }
                });
            }
            this.rotationQuaternion = new BABYLON.Quaternion();
            this._quaternionCache = new BABYLON.Quaternion();
        }
        WebVRFreeCamera.prototype._checkInputs = function () {
            if (this._vrEnabled) {
                this._cacheState = this._vrDevice.getPose();
                this.rotationQuaternion.copyFromFloats(this._cacheState.orientation[0], this._cacheState.orientation[1], this._cacheState.orientation[2], this._cacheState.orientation[3]);
                if (this.webVROptions.trackPosition) {
                    this.position.copyFromFloats(this._cacheState.position[0], this._cacheState.position[1], -this._cacheState.position[2]);
                    this.webVROptions.positionScale && this.position.scaleInPlace(this.webVROptions.positionScale);
                }
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
            if (this._vrEnabled) {
                this.getEngine().enableVR(this._vrDevice);
            }
        };
        WebVRFreeCamera.prototype.detachControl = function (element) {
            _super.prototype.detachControl.call(this, element);
            this._vrEnabled = false;
            this.getEngine().disableVR();
        };
        WebVRFreeCamera.prototype.requestVRFullscreen = function (requestPointerlock) {
            //Backwards comp.
            BABYLON.Tools.Warn("requestVRFullscreen is deprecated. Use engine.switchFullscreen() instead");
            this.getEngine().switchFullscreen(requestPointerlock);
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
