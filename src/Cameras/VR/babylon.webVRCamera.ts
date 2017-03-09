declare var HMDVRDevice;
declare var VRDisplay;
declare var VRFrameData;

module BABYLON {

    /**
     * This is a copy of VRPose.
     * IMPORTANT!! The data is right-hand data.
     * @export
     * @interface DevicePose
     */
    export interface DevicePose {
        readonly position?: Float32Array;
        readonly linearVelocity?: Float32Array;
        readonly linearAcceleration?: Float32Array;

        readonly orientation?: Float32Array;
        readonly angularVelocity?: Float32Array;
        readonly angularAcceleration?: Float32Array;
    }

    export interface PoseControlled {
        position: Vector3;
        rotationQuaternion: Quaternion;
        devicePosition?: Vector3;
        deviceRotationQuaternion: Quaternion;
        rawPose: DevicePose;
        deviceScaleFactor: number;
        updateFromDevice(poseData: DevicePose);
    }

    export interface WebVROptions {
        trackPosition?: boolean; //update the camera's position
        positionScale?: number;
        displayName?: string; //if there are more than one VRDisplays.
    }

    export class WebVRFreeCamera extends FreeCamera implements PoseControlled {
        public _vrDevice = null;
        public rawPose: DevicePose = null;
        private _vrEnabled = false;
        private _attached: boolean = false;

        private _oldSize: BABYLON.Size;
        private _oldHardwareScaleFactor: number;

        private _frameData;

        private _quaternionCache: Quaternion;

        private _positionOffset: Vector3 = Vector3.Zero();

        public devicePosition = Vector3.Zero();
        public deviceRotationQuaternion;
        public deviceScaleFactor: number = 1;

        public controllers: Array<WebVRController> = [];
        public onControllersAttached: (controllers: Array<WebVRController>) => void;

        constructor(name: string, position: Vector3, scene: Scene, compensateDistortion = false, private webVROptions: WebVROptions = {}) {
            super(name, position, scene);

            this.rotationQuaternion = new Quaternion();
            this.deviceRotationQuaternion = new Quaternion();

            if (this.webVROptions && this.webVROptions.positionScale) {
                this.deviceScaleFactor = this.webVROptions.positionScale;
            }

            //enable VR
            this.getEngine().initWebVR();

            if (!this.getEngine().vrDisplaysPromise) {
                Tools.Error("WebVR is not enabled on your browser");
            } else {
                this._frameData = new VRFrameData();
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

                        //reset the rig parameters.
                        this.setCameraRigMode(Camera.RIG_MODE_WEBVR, { parentCamera: this, vrDisplay: this._vrDevice, frameData: this._frameData });

                        if (this._attached) {
                            this.getEngine().enableVR(this._vrDevice)
                        }
                    } else {
                        Tools.Error("No WebVR devices found!");
                    }
                });
            }

            // try to attach the controllers, if found.
            this.initControllers();
        }

        public _checkInputs(): void {
            if (this._vrEnabled && this._vrDevice.getFrameData(this._frameData)) {
                var currentPose = this._frameData.pose;
                this.updateFromDevice(currentPose);
            }

            super._checkInputs();
        }

        updateFromDevice(poseData: DevicePose) {
            if (poseData && poseData.orientation) {
                this.rawPose = poseData;
                this.deviceRotationQuaternion.copyFromFloats(this.rawPose.orientation[0], this.rawPose.orientation[1], -this.rawPose.orientation[2], -this.rawPose.orientation[3]);

                if (this.getScene().useRightHandedSystem) {
                    this.deviceRotationQuaternion.z *= -1;
                    this.deviceRotationQuaternion.w *= -1;
                }
                if (this.webVROptions.trackPosition && this.rawPose.position) {
                    this.devicePosition.copyFromFloats(this.rawPose.position[0], this.rawPose.position[1], -this.rawPose.position[2]);
                    if (this.getScene().useRightHandedSystem) {
                        this.devicePosition.z *= -1;
                    }
                }
            }
        }


        /**
         * WebVR's attach control will start broadcasting frames to the device.
         * Note that in certain browsers (chrome for example) this function must be called
         * within a user-interaction callback. Example:
         * <pre> scene.onPointerDown = function() { camera.attachControl(canvas); }</pre>
         * 
         * @param {HTMLElement} element 
         * @param {boolean} [noPreventDefault] 
         * 
         * @memberOf WebVRFreeCamera
         */
        public attachControl(element: HTMLElement, noPreventDefault?: boolean): void {
            super.attachControl(element, noPreventDefault);
            this._attached = true;

            noPreventDefault = Camera.ForceAttachControlToAlwaysPreventDefault ? false : noPreventDefault;

            if (this._vrEnabled) {
                this.getEngine().enableVR(this._vrDevice)
            }
        }

        public detachControl(element: HTMLElement): void {
            super.detachControl(element);
            this._vrEnabled = false;
            this._attached = false;
            this.getEngine().disableVR();
        }

        public getClassName(): string {
            return "WebVRFreeCamera";
        }

        public resetToCurrentRotation() {
            //uses the vrDisplay's "resetPose()".
            //pitch and roll won't be affected.
            this._vrDevice.resetPose();
        }

        /**
         * This function is called by the two RIG cameras.
         * 'this' is the left or right camera (and NOT (!!!) the WebVRFreeCamera instance)
         */
        protected _getWebVRViewMatrix(): Matrix {
            var viewArray = this._cameraRigParams["left"] ? this._cameraRigParams["frameData"].leftViewMatrix : this._cameraRigParams["frameData"].rightViewMatrix;

            if (!this.getScene().useRightHandedSystem) {
                [2, 6, 8, 9, 14].forEach(function (num) {
                    viewArray[num] *= -1;
                });
            }
            Matrix.FromArrayToRef(viewArray, 0, this._webvrViewMatrix);

            let parentCamera: WebVRFreeCamera = this._cameraRigParams["parentCamera"];

            // should the view matrix be updated with scale and position offset?
            if (parentCamera.position.lengthSquared() || parentCamera.deviceScaleFactor !== 1) {
                this._webvrViewMatrix.invert();
                // scale the position, if set
                if (parentCamera.deviceScaleFactor) {
                    this._webvrViewMatrix.m[12] *= parentCamera.deviceScaleFactor;
                    this._webvrViewMatrix.m[13] *= parentCamera.deviceScaleFactor;
                    this._webvrViewMatrix.m[14] *= parentCamera.deviceScaleFactor;
                }
                // change the position (for "teleporting");
                this._webvrViewMatrix.m[12] += parentCamera.position.x;
                this._webvrViewMatrix.m[13] += parentCamera.position.y;
                this._webvrViewMatrix.m[14] += parentCamera.position.z;
                this._webvrViewMatrix.invert();
            }
            // is rotation offset set? 
            if (!Quaternion.IsIdentity(this.rotationQuaternion)) {
                this.rotationQuaternion.toRotationMatrix(this._tempMatrix);
                this._tempMatrix.multiplyToRef(this._webvrViewMatrix, this._webvrViewMatrix);
            }

            this._updateCameraRotationMatrix();
            Vector3.TransformCoordinatesToRef(this._referencePoint, this._cameraRotationMatrix, this._transformedReferencePoint);

            // Computing target for getTarget()
            this._webvrViewMatrix.getTranslationToRef(this._positionOffset);
            this._positionOffset.addToRef(this._transformedReferencePoint, this._currentTarget);

            return this._webvrViewMatrix;
        }

        protected _updateCameraRotationMatrix() {
            this._webvrViewMatrix.getRotationMatrixToRef(this._cameraRotationMatrix);
        }

        public _isSynchronizedViewMatrix() {
            return false;
        }

        protected _getWebVRProjectionMatrix(): Matrix {
            var projectionArray = this._cameraRigParams["left"] ? this._cameraRigParams["frameData"].leftProjectionMatrix : this._cameraRigParams["frameData"].rightProjectionMatrix;
            //babylon compatible matrix
            if (!this.getScene().useRightHandedSystem) {
                [8, 9, 10, 11].forEach(function (num) {
                    projectionArray[num] *= -1;
                });
            }
            Matrix.FromArrayToRef(projectionArray, 0, this._projectionMatrix);
            return this._projectionMatrix;
        }

        public initControllers() {
            this.controllers = [];
            new BABYLON.Gamepads((gp) => {
                if (gp.type === BABYLON.Gamepad.POSE_ENABLED) {
                    let webVrController: WebVRController = <WebVRController>gp;
                    webVrController.attachToPoseControlledCamera(this);

                    // since this is async - sanity check. Is the controller already stored?
                    if (this.controllers.indexOf(webVrController) === -1) {
                        //add to the controllers array
                        this.controllers.push(webVrController);

                        //did we find enough controllers? Great! let the developer know.
                        if (this.onControllersAttached && this.controllers.length === 2) {
                            this.onControllersAttached(this.controllers);
                        }
                    }
                }
            });
        }
    }
}

