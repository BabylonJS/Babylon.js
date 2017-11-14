declare var HMDVRDevice: any;
declare var VRDisplay: any;
declare var VRFrameData: any;

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
        rawPose: Nullable<DevicePose>;
        deviceScaleFactor: number;
        updateFromDevice(poseData: DevicePose): void;
    }

    export interface WebVROptions {
        trackPosition?: boolean; //for the sake of your users - set it to true.
        positionScale?: number;
        displayName?: string; //if there are more than one VRDisplays.
        controllerMeshes?: boolean; // should the native controller meshes be initialized
        defaultLightingOnControllers?: boolean; // creating a default HemiLight only on controllers
        useCustomVRButton?: boolean; // if you don't want to use the default VR button of the helper
        customVRButton?: HTMLButtonElement; //if you'd like to provide your own button to the VRHelper
    }

    export class WebVRFreeCamera extends FreeCamera implements PoseControlled {
        public _vrDevice: any = null;
        public rawPose: Nullable<DevicePose> = null;
        private _onVREnabled: (success: boolean) => void;
        private _specsVersion: string = "1.1";
        private _attached: boolean = false;

        private _frameData: any;

        protected _descendants: Array<Node> = [];

        public devicePosition = Vector3.Zero();
        public deviceRotationQuaternion: Quaternion;
        public deviceScaleFactor: number = 1;

        public controllers: Array<WebVRController> = [];
        public onControllersAttachedObservable = new Observable<Array<WebVRController>>();
        public onControllerMeshLoadedObservable = new Observable<WebVRController>();

        public rigParenting: boolean = true; // should the rig cameras be used as parent instead of this camera.

        private _lightOnControllers: BABYLON.HemisphericLight;

        constructor(name: string, position: Vector3, scene: Scene, private webVROptions: WebVROptions = {}) {
            super(name, position, scene);

            this.minZ = 0.1;

            //legacy support - the compensation boolean was removed.
            if (arguments.length === 5) {
                this.webVROptions = arguments[4];
            }

            // default webVR options
            if (this.webVROptions.trackPosition == undefined) {
                this.webVROptions.trackPosition = true;
            }
            if (this.webVROptions.controllerMeshes == undefined) {
                this.webVROptions.controllerMeshes = true;
            }
            if (this.webVROptions.defaultLightingOnControllers == undefined) {
                this.webVROptions.defaultLightingOnControllers = true;
            }

            this.rotationQuaternion = new Quaternion();
            this.deviceRotationQuaternion = new Quaternion();

            if (this.webVROptions && this.webVROptions.positionScale) {
                this.deviceScaleFactor = this.webVROptions.positionScale;
            }

            //enable VR
            var engine = this.getEngine();
            this._onVREnabled = (success: boolean) => { if (success) { this.initControllers(); } };
            engine.onVRRequestPresentComplete.add(this._onVREnabled);
            engine.initWebVR().add((event: IDisplayChangedEventArgs) => {
                if (!event.vrDisplay || this._vrDevice === event.vrDisplay) {
                    return;
                }

                this._vrDevice = event.vrDisplay;

                //reset the rig parameters.
                this.setCameraRigMode(Camera.RIG_MODE_WEBVR, { parentCamera: this, vrDisplay: this._vrDevice, frameData: this._frameData, specs: this._specsVersion });

                if (this._attached) {
                    this.getEngine().enableVR();
                }
            });

            if (typeof(VRFrameData) !== "undefined")
                this._frameData = new VRFrameData();

            /**
             * The idea behind the following lines:
             * objects that have the camera as parent should actually have the rig cameras as a parent.
             * BUT, each of those cameras has a different view matrix, which means that if we set the parent to the first rig camera,
             * the second will not show it correctly.
             * 
             * To solve this - each object that has the camera as parent will be added to a protected array.
             * When the rig camera renders, it will take this array and set all of those to be its children.
             * This way, the right camera will be used as a parent, and the mesh will be rendered correctly.
             * Amazing!
             */
            scene.onBeforeCameraRenderObservable.add((camera) => {
                if (camera.parent === this && this.rigParenting) {
                    this._descendants = this.getDescendants(true, (n) => {
                        // don't take the cameras or the controllers!
                        let isController = this.controllers.some(controller => { return controller._mesh === n });
                        let isRigCamera = this._rigCameras.indexOf(<Camera>n) !== -1
                        return !isController && !isRigCamera;
                    });
                    this._descendants.forEach(node => {
                        node.parent = camera;
                    });
                }
            });

            scene.onAfterCameraRenderObservable.add((camera) => {
                if (camera.parent === this && this.rigParenting) {
                    this._descendants.forEach(node => {
                        node.parent = this;
                    });
                }
            });
        }

        public dispose(): void {
            this.getEngine().onVRRequestPresentComplete.removeCallback(this._onVREnabled);
            super.dispose();
        }

        public getControllerByName(name: string): Nullable<WebVRController> {
            for (var gp of this.controllers) {
                if (gp.hand === name) {
                    return gp;
                }
            }

            return null;
        }

        private _leftController: Nullable<WebVRController>;
        public get leftController(): Nullable<WebVRController> {
            if (!this._leftController) {
                this._leftController = this.getControllerByName("left");
            }

            return this._leftController;
        };

        private _rightController: Nullable<WebVRController>;
        public get rightController(): Nullable<WebVRController> {
            if (!this._rightController) {
                this._rightController = this.getControllerByName("right");
            }

            return this._rightController;
        };

        public getForwardRay(length = 100): Ray {
            if (this.leftCamera) {
                return super.getForwardRay(length, this.leftCamera.getWorldMatrix(), this.position.add(this.devicePosition)); // Need the actual rendered camera
            }
            else {
                return super.getForwardRay(length);
            }
        }

        public _checkInputs(): void {
            if (this._vrDevice && this._vrDevice.isPresenting) {
                this._vrDevice.getFrameData(this._frameData);

                this.updateFromDevice(this._frameData.pose);
            }

            super._checkInputs();
        }

        updateFromDevice(poseData: DevicePose) {
            if (poseData && poseData.orientation) {
                this.rawPose = poseData;
                this.deviceRotationQuaternion.copyFromFloats(poseData.orientation[0], poseData.orientation[1], -poseData.orientation[2], -poseData.orientation[3]);

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

            if (this._vrDevice) {
                this.getEngine().enableVR();
            }
        }

        public detachControl(element: HTMLElement): void {
            this.getScene().gamepadManager.onGamepadConnectedObservable.remove(this._onGamepadConnectedObserver);
            this.getScene().gamepadManager.onGamepadDisconnectedObservable.remove(this._onGamepadDisconnectedObserver);

            super.detachControl(element);
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

        public _updateRigCameras() {
            var camLeft = <TargetCamera>this._rigCameras[0];
            var camRight = <TargetCamera>this._rigCameras[1];
            camLeft.rotationQuaternion.copyFrom(this.deviceRotationQuaternion);
            camRight.rotationQuaternion.copyFrom(this.deviceRotationQuaternion);

            camLeft.position.copyFrom(this.devicePosition);
            camRight.position.copyFrom(this.devicePosition);
        }

        /**
         * This function is called by the two RIG cameras.
         * 'this' is the left or right camera (and NOT (!!!) the WebVRFreeCamera instance)
         */
        protected _getWebVRViewMatrix(): Matrix {
            //WebVR 1.1
            var viewArray = this._cameraRigParams["left"] ? this._cameraRigParams["frameData"].leftViewMatrix : this._cameraRigParams["frameData"].rightViewMatrix;

            Matrix.FromArrayToRef(viewArray, 0, this._webvrViewMatrix);

            if (!this.getScene().useRightHandedSystem) {
                [2, 6, 8, 9, 14].forEach((num) => {
                    this._webvrViewMatrix.m[num] *= -1;
                });
            }

            // update the camera rotation matrix
            this._webvrViewMatrix.getRotationMatrixToRef(this._cameraRotationMatrix);
            Vector3.TransformCoordinatesToRef(this._referencePoint, this._cameraRotationMatrix, this._transformedReferencePoint);

            // Computing target and final matrix
            this.position.addToRef(this._transformedReferencePoint, this._currentTarget);

            let parentCamera: WebVRFreeCamera = this._cameraRigParams["parentCamera"];

            // should the view matrix be updated with scale and position offset?
            if (parentCamera.deviceScaleFactor !== 1) {
                this._webvrViewMatrix.invert();
                // scale the position, if set
                if (parentCamera.deviceScaleFactor) {
                    this._webvrViewMatrix.m[12] *= parentCamera.deviceScaleFactor;
                    this._webvrViewMatrix.m[13] *= parentCamera.deviceScaleFactor;
                    this._webvrViewMatrix.m[14] *= parentCamera.deviceScaleFactor;
                }

                this._webvrViewMatrix.invert();
            }

            return this._webvrViewMatrix;
        }

        protected _getWebVRProjectionMatrix(): Matrix {

            let parentCamera = <WebVRFreeCamera>this.parent;

            parentCamera._vrDevice.depthNear = parentCamera.minZ;
            parentCamera._vrDevice.depthFar = parentCamera.maxZ;

            var projectionArray = this._cameraRigParams["left"] ? this._cameraRigParams["frameData"].leftProjectionMatrix : this._cameraRigParams["frameData"].rightProjectionMatrix;
            Matrix.FromArrayToRef(projectionArray, 0, this._projectionMatrix);

            //babylon compatible matrix
            if (!this.getScene().useRightHandedSystem) {
                [8, 9, 10, 11].forEach((num) => {
                    this._projectionMatrix.m[num] *= -1;
                });
            }

            return this._projectionMatrix;
        }

        private _onGamepadConnectedObserver: Nullable<Observer<Gamepad>>;
        private _onGamepadDisconnectedObserver: Nullable<Observer<Gamepad>>;

        public initControllers() {
            this.controllers = [];

            let manager = this.getScene().gamepadManager;
            this._onGamepadDisconnectedObserver = manager.onGamepadDisconnectedObservable.add((gamepad) => {
                if (gamepad.type === BABYLON.Gamepad.POSE_ENABLED) {
                    let webVrController: WebVRController = <WebVRController>gamepad;

                    if (webVrController.defaultModel) {
                        webVrController.defaultModel.setEnabled(false);
                    }
                }
            });

            this._onGamepadConnectedObserver = manager.onGamepadConnectedObservable.add((gamepad) => {
                if (gamepad.type === BABYLON.Gamepad.POSE_ENABLED) {
                    let webVrController: WebVRController = <WebVRController>gamepad;

                    if (this.webVROptions.controllerMeshes) {
                        if (webVrController.defaultModel) {
                            webVrController.defaultModel.setEnabled(true);
                        } else {
                            // Load the meshes
                            webVrController.initControllerMesh(this.getScene(), (loadedMesh) => {
                                this.onControllerMeshLoadedObservable.notifyObservers(webVrController);
                                if (this.webVROptions.defaultLightingOnControllers) {
                                    if (!this._lightOnControllers) {
                                        this._lightOnControllers = new BABYLON.HemisphericLight("vrControllersLight", new BABYLON.Vector3(0, 1, 0), this.getScene());
                                    }
                                    let activateLightOnSubMeshes = function (mesh: AbstractMesh, light: HemisphericLight) {
                                        let children = mesh.getChildren();
                                        if (children.length !== 0) {
                                            children.forEach((mesh) => {
                                                light.includedOnlyMeshes.push(<AbstractMesh>mesh);
                                                activateLightOnSubMeshes(<AbstractMesh>mesh, light);
                                            });
                                        }
                                    }
                                    this._lightOnControllers.includedOnlyMeshes.push(loadedMesh);
                                    activateLightOnSubMeshes(loadedMesh, this._lightOnControllers);
                                }
                            });
                        }
                    }
                    webVrController.attachToPoseControlledCamera(this);

                    // since this is async - sanity check. Is the controller already stored?
                    if (this.controllers.indexOf(webVrController) === -1) {
                        //add to the controllers array
                        this.controllers.push(webVrController);

                        //did we find enough controllers? Great! let the developer know.
                        if (this.controllers.length >= 2) {
                            // Forced to add some control code for Vive as it doesn't always fill properly the "hand" property
                            // Sometimes, both controllers are set correctly (left and right), sometimes none, sometimes only one of them...
                            // So we're overriding setting left & right manually to be sure
                            let firstViveWandDetected = false;

                            for (let i = 0; i < this.controllers.length; i++) {
                                if (this.controllers[i].controllerType === PoseEnabledControllerType.VIVE) {
                                    if (!firstViveWandDetected) {
                                        firstViveWandDetected = true;
                                        this.controllers[i].hand = "left";
                                    }
                                    else {
                                        this.controllers[i].hand = "right";
                                    }
                                }
                            }

                            this.onControllersAttachedObservable.notifyObservers(this.controllers);
                        }
                    }
                }
            });
        }
    }
}

