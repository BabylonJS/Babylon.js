var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var WebVRFreeCamera = (function (_super) {
        __extends(WebVRFreeCamera, _super);
        function WebVRFreeCamera(name, position, scene, compensateDistortion, webVROptions) {
            var _this = this;
            if (compensateDistortion === void 0) { compensateDistortion = false; }
            if (webVROptions === void 0) { webVROptions = {}; }
            _super.call(this, name, position, scene);
            this.webVROptions = webVROptions;
            this._vrDevice = null;
            this._cacheState = null;
            this._vrEnabled = false;
            //enable VR
            this.getEngine().initWebVR();
            if (!this.getEngine().vrDisplaysPromise) {
                BABYLON.Tools.Error("WebVR is not enabled on your browser");
            }
            else {
                //TODO get the metrics updated using the device's eye parameters!
                //TODO also check that the device has the right capabilities!
                this.getEngine().vrDisplaysPromise.then(function (devices) {
                    if (devices.length > 0) {
                        _this._vrEnabled = true;
                        if (_this.webVROptions.displayName) {
                            var found = devices.some(function (device) {
                                if (device.displayName === _this.webVROptions.displayName) {
                                    _this._vrDevice = device;
                                    return true;
                                }
                                else {
                                    return false;
                                }
                            });
                            if (!found) {
                                _this._vrDevice = devices[0];
                                BABYLON.Tools.Warn("Display " + _this.webVROptions.displayName + " was not found. Using " + _this._vrDevice.displayName);
                            }
                        }
                        else {
                            //choose the first one
                            _this._vrDevice = devices[0];
                        }
                        //reset the rig parameters.
                        _this.setCameraRigMode(BABYLON.Camera.RIG_MODE_WEBVR, { vrDisplay: _this._vrDevice });
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
                var currentPost = this._vrDevice.getPose();
                //make sure we have data
                if (currentPost && currentPost.orientation) {
                    this._cacheState = currentPost;
                    this.rotationQuaternion.copyFromFloats(this._cacheState.orientation[0], this._cacheState.orientation[1], this._cacheState.orientation[2], this._cacheState.orientation[3]);
                    if (this.webVROptions.trackPosition && this._cacheState.position) {
                        this.position.copyFromFloats(this._cacheState.position[0], this._cacheState.position[1], -this._cacheState.position[2]);
                        this.webVROptions.positionScale && this.position.scaleInPlace(this.webVROptions.positionScale);
                    }
                    //Flip in XY plane
                    this.rotationQuaternion.z *= -1;
                    this.rotationQuaternion.w *= -1;
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
            BABYLON.Tools.Warn("requestVRFullscreen is deprecated. call attachControl() to start sending frames to the VR display.");
            //this.getEngine().switchFullscreen(requestPointerlock);
        };
        WebVRFreeCamera.prototype.getTypeName = function () {
            return "WebVRFreeCamera";
        };
        WebVRFreeCamera.prototype.resetToCurrentRotation = function () {
            //uses the vrDisplay's "resetPose()".
            //pitch and roll won't be affected.
            this._vrDevice.resetPose();
        };
        return WebVRFreeCamera;
    }(BABYLON.FreeCamera));
    BABYLON.WebVRFreeCamera = WebVRFreeCamera;
})(BABYLON || (BABYLON = {}));
