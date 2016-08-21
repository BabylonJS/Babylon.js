declare var HMDVRDevice;
declare var VRDisplay;

module BABYLON {

    export interface WebVROptions {
        trackPosition?: boolean; //update the camera's position
        positionScale?: number;
        displayName?: string; //if there are more than one VRDisplays.
    }

    export class WebVRFreeCamera extends FreeCamera {
        public _vrDevice = null;
        private _cacheState = null;
        private _vrEnabled = false;

        private _oldSize: BABYLON.Size;
        private _oldHardwareScaleFactor: number;

        private _initialQuaternion: Quaternion;
        private _quaternionCache: Quaternion;

        constructor(name: string, position: Vector3, scene: Scene, compensateDistortion = true, vrCameraMetrics: VRCameraMetrics = VRCameraMetrics.GetDefault(), private webVROptions: WebVROptions = {}) {
            super(name, position, scene);

            vrCameraMetrics.compensateDistortion = compensateDistortion;
            this.setCameraRigMode(Camera.RIG_MODE_VR, { vrCameraMetrics: vrCameraMetrics });

            //enable VR
            this.getEngine().initWebVR();

            if (!this.getEngine().vrDisplaysPromise) {
                Tools.Error("WebVR is not enabled on your browser");
            } else {
                //TODO get the metrics updated using the device's eye parameters!
                //TODO also check that the device has the right capabilities!
                this.getEngine().vrDisplaysPromise.then((devices) => {
                    if (devices.length > 0) {
                        this._vrEnabled = true;
                        if (this.webVROptions.displayName) {
                            var found = devices.some(device => {
                                if (device.displayName === this.webVROptions.displayName) {
                                    this._vrDevice = device;
                                    return true;
                                } else {
                                    return false;
                                }
                            });
                            if (!found) {
                                this._vrDevice = devices[0];
                                Tools.Warn("Display " + this.webVROptions.displayName + " was not found. Using " + this._vrDevice.displayName);
                            }
                        } else {
                            //choose the first one
                            this._vrDevice = devices[0];
                        }
                    } else {
                        Tools.Error("No WebVR devices found!");
                    }
                })
            }

            this.rotationQuaternion = new Quaternion();
            this._quaternionCache = new Quaternion();
        }

        public _checkInputs(): void {
            if (this._vrEnabled) {
                var currentPost = this._vrDevice.getPose();
                //make sure we have data
                if (currentPost && currentPost.orientation) {
                    this._cacheState = currentPost;
                    this.rotationQuaternion.copyFromFloats(this._cacheState.orientation[0], this._cacheState.orientation[1], this._cacheState.orientation[2], this._cacheState.orientation[3]);
                    if (this.webVROptions.trackPosition && this._cacheState.position) {
                        this.position.copyFromFloats(this._cacheState.position[0], this._cacheState.position[1], -this._cacheState.position[2]);
                        this.webVROptions.positionScale && this.position.scaleInPlace(this.webVROptions.positionScale)
                    }
                    //Flip in XY plane
                    this.rotationQuaternion.z *= -1;
                    this.rotationQuaternion.w *= -1;
                    if (this._initialQuaternion) {
                        this._quaternionCache.copyFrom(this.rotationQuaternion);
                        this._initialQuaternion.multiplyToRef(this.rotationQuaternion, this.rotationQuaternion);
                    }
                }

            }

            super._checkInputs();
        }

        public attachControl(element: HTMLElement, noPreventDefault?: boolean): void {
            super.attachControl(element, noPreventDefault);

            noPreventDefault = Camera.ForceAttachControlToAlwaysPreventDefault ? false : noPreventDefault;

            if (this._vrEnabled) {
                this.getEngine().enableVR(this._vrDevice)
            }
        }

        public detachControl(element: HTMLElement): void {
            super.detachControl(element);
            this._vrEnabled = false;
            this.getEngine().disableVR();
        }

        public requestVRFullscreen(requestPointerlock: boolean) {
            //Backwards comp.
            Tools.Warn("requestVRFullscreen is deprecated. Use engine.switchFullscreen() instead")
            this.getEngine().switchFullscreen(requestPointerlock);
        }

        public getTypeName(): string {
            return "WebVRFreeCamera";
        }

        public resetToCurrentRotation(axis: BABYLON.Axis = BABYLON.Axis.Y) {
            //can only work if this camera has a rotation quaternion already.
            if (!this.rotationQuaternion) return;

            if (!this._initialQuaternion) {
                this._initialQuaternion = new BABYLON.Quaternion();
            }

            this._initialQuaternion.copyFrom(this._quaternionCache || this.rotationQuaternion);

            ['x', 'y', 'z'].forEach((axisName) => {
                if (!axis[axisName]) {
                    this._initialQuaternion[axisName] = 0;
                } else {
                    this._initialQuaternion[axisName] *= -1;
                }
            });
            this._initialQuaternion.normalize();
        }
    }
}

