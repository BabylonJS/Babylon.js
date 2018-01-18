module BABYLON {
    export interface VRTeleportationOptions {
        floorMeshName?: string; // If you'd like to provide a mesh acting as the floor
        floorMeshes?: Mesh[];
    }

    export interface VRExperienceHelperOptions extends WebVROptions {
        createDeviceOrientationCamera?: boolean; // Create a DeviceOrientationCamera to be used as your out of vr camera.
        createFallbackVRDeviceOrientationFreeCamera?: boolean; // Create a VRDeviceOrientationFreeCamera to be used for VR when no external HMD is found
    }

    export class VRExperienceHelper {
        private _scene: Scene;
        private _position: Vector3;
        private _btnVR: HTMLButtonElement;
        private _btnVRDisplayed: boolean;

        // Can the system support WebVR, even if a headset isn't plugged in?
        private _webVRsupported = false;
        // If WebVR is supported, is a headset plugged in and are we ready to present?
        private _webVRready = false;
        // Are we waiting for the requestPresent callback to complete?
        private _webVRrequesting = false;
        // Are we presenting to the headset right now?
        private _webVRpresenting = false;

        // Are we presenting in the fullscreen fallback?
        private _fullscreenVRpresenting = false;

        private _canvas: Nullable<HTMLCanvasElement>;
        private _webVRCamera: WebVRFreeCamera;
        private _vrDeviceOrientationCamera: Nullable<VRDeviceOrientationFreeCamera>;
        private _deviceOrientationCamera: Nullable<DeviceOrientationCamera>;
        private _existingCamera: Camera;

        private _onKeyDown: (event: KeyboardEvent) => void;
        private _onVrDisplayPresentChange: any;
        private _onVRDisplayChanged: (eventArgs: IDisplayChangedEventArgs) => void;
        private _onVRRequestPresentStart: () => void;
        private _onVRRequestPresentComplete: (success: boolean) => void;

        /**
         * Observable raised when entering VR.
         */
        public onEnteringVRObservable = new Observable<VRExperienceHelper>();


        /**
         * Observable raised when exiting VR.
         */
        public onExitingVRObservable = new Observable<VRExperienceHelper>();


        /**
         * Observable raised when controller mesh is loaded.
         */
        public onControllerMeshLoadedObservable = new Observable<WebVRController>();

        /** Return this.onEnteringVRObservable
         * Note: This one is for backward compatibility. Please use onEnteringVRObservable directly
         */
        public get onEnteringVR(): Observable<VRExperienceHelper> {
            return this.onEnteringVRObservable;
        }

        /** Return this.onExitingVRObservable
         * Note: This one is for backward compatibility. Please use onExitingVRObservable directly
         */
        public get onExitingVR(): Observable<VRExperienceHelper> {
            return this.onExitingVRObservable;
        }

        /** Return this.onControllerMeshLoadedObservable
         * Note: This one is for backward compatibility. Please use onControllerMeshLoadedObservable directly
         */
        public get onControllerMeshLoaded(): Observable<WebVRController> {
            return this.onControllerMeshLoadedObservable;
        }

        private _rayLength: number;
        private _useCustomVRButton: boolean = false;
        private _teleportationRequested: boolean = false;
        private _teleportationEnabledOnLeftController: boolean = false;
        private _teleportationEnabledOnRightController: boolean = false;
        private _interactionsEnabledOnLeftController: boolean = false;
        private _interactionsEnabledOnRightController: boolean = false;
        private _leftControllerReady: boolean = false;
        private _rightControllerReady: boolean = false;
        private _floorMeshName: string;
        private _floorMeshesCollection: Mesh[] = [];
        private _teleportationAllowed: boolean = false;
        private _rotationAllowed: boolean = true;
        private _teleportationRequestInitiated = false;
        private _teleportationBackRequestInitiated = false;
        private teleportBackwardsVector = new Vector3(0, -1, -1);
        private _rotationRightAsked = false;
        private _rotationLeftAsked = false;
        private _teleportationTarget: Mesh;
        private _isDefaultTeleportationTarget = true;
        private _postProcessMove: ImageProcessingPostProcess;
        private _passProcessMove: PassPostProcess;
        private _teleportationFillColor: string = "#444444";
        private _teleportationBorderColor: string = "#FFFFFF";
        private _rotationAngle: number = 0;
        private _haloCenter = new Vector3(0, 0, 0);
        private _gazeTracker: Mesh;
        private _padSensibilityUp = 0.65;
        private _padSensibilityDown = 0.35;
        private _leftLaserPointer: Nullable<Mesh>;
        private _rightLaserPointer: Nullable<Mesh>;
        private _currentMeshSelected: Nullable<AbstractMesh>;

        /**
         * Observable raised when a new mesh is selected based on meshSelectionPredicate
         */
        public onNewMeshSelected = new Observable<AbstractMesh>();

        /**
         * Observable raised when a new mesh is picked based on meshSelectionPredicate
         */
        public onNewMeshPicked = new Observable<PickingInfo>();

        private _circleEase: CircleEase;

        /**
         * Observable raised before camera teleportation        
        */
        public onBeforeCameraTeleport = new Observable<Vector3>();

        /**
         *  Observable raised after camera teleportation
        */
        public onAfterCameraTeleport = new Observable<Vector3>();

        /**
        * Observable raised when current selected mesh gets unselected
        */
        public onSelectedMeshUnselected = new Observable<AbstractMesh>();

        private _raySelectionPredicate: (mesh: AbstractMesh) => boolean;

        /**
         * To be optionaly changed by user to define custom ray selection
         */
        public raySelectionPredicate: (mesh: AbstractMesh) => boolean;

        /**
         * To be optionaly changed by user to define custom selection logic (after ray selection)
         */
        public meshSelectionPredicate: (mesh: AbstractMesh) => boolean;

        /**
         * Set teleportation enabled. If set to false camera teleportation will be disabled but camera rotation will be kept.
         */
        public teleportationEnabled: boolean = true;

        private _currentHit: Nullable<PickingInfo>;
        private _pointerDownOnMeshAsked = false;
        private _isActionableMesh = false;
        private _defaultHeight: number;
        private _teleportationInitialized = false;
        private _interactionsEnabled = false;
        private _interactionsRequested = false;
        private _displayGaze = true;
        private _displayLaserPointer = true;

        private _dpadPressed = true;

        public get teleportationTarget(): Mesh {
            return this._teleportationTarget;
        }

        public set teleportationTarget(value: Mesh) {
            if (value) {
                value.name = "teleportationTarget";
                this._isDefaultTeleportationTarget = false;
                this._teleportationTarget = value;
            }
        }

        public get displayGaze(): boolean {
            return this._displayGaze;
        }

        public set displayGaze(value: boolean) {
            this._displayGaze = value;
            if (!value) {
                this._gazeTracker.isVisible = false;
            }
        }

        public get displayLaserPointer(): boolean {
            return this._displayLaserPointer;
        }

        public set displayLaserPointer(value: boolean) {
            this._displayLaserPointer = value;
            if (!value) {
                if (this._rightLaserPointer) {
                    this._rightLaserPointer.isVisible = false;
                }
                if (this._leftLaserPointer) {
                    this._leftLaserPointer.isVisible = false;
                }
            }
            else {
                if (this._rightLaserPointer) {
                    this._rightLaserPointer.isVisible = true;
                }
                else if (this._leftLaserPointer) {
                    this._leftLaserPointer.isVisible = true;
                }
            }
        }

        public get deviceOrientationCamera(): Nullable<DeviceOrientationCamera> {
            return this._deviceOrientationCamera;
        }

        // Based on the current WebVR support, returns the current VR camera used
        public get currentVRCamera(): Nullable<Camera> {
            if (this._webVRready) {
                return this._webVRCamera;
            }
            else {
                return this._scene.activeCamera;
            }
        }

        public get webVRCamera(): WebVRFreeCamera {
            return this._webVRCamera;
        }

        public get vrDeviceOrientationCamera(): Nullable<VRDeviceOrientationFreeCamera> {
            return this._vrDeviceOrientationCamera;
        }

        constructor(scene: Scene, public webVROptions: VRExperienceHelperOptions = {}) {
            this._scene = scene;
            this._canvas = scene.getEngine().getRenderingCanvas();

            // Parse options
            if (webVROptions.createFallbackVRDeviceOrientationFreeCamera === undefined) {
                webVROptions.createFallbackVRDeviceOrientationFreeCamera = true;
            }
            if (webVROptions.createDeviceOrientationCamera === undefined) {
                webVROptions.createDeviceOrientationCamera = true;
            }
            if (webVROptions.defaultHeight === undefined) {
                webVROptions.defaultHeight = 1.7;
            }
            if (webVROptions.useCustomVRButton) {
                this._useCustomVRButton = true;
                if (webVROptions.customVRButton) {
                    this._btnVR = webVROptions.customVRButton;
                }
            }
            if (webVROptions.rayLength) {
                this._rayLength = webVROptions.rayLength
            }
            this._defaultHeight = webVROptions.defaultHeight;

            // Set position
            if (this._scene.activeCamera) {
                this._position = this._scene.activeCamera.position.clone();
            } else {
                this._position = new Vector3(0, this._defaultHeight, 0);
            }

            // Set non-vr camera
            if (webVROptions.createDeviceOrientationCamera || !this._scene.activeCamera) {
                this._deviceOrientationCamera = new DeviceOrientationCamera("deviceOrientationVRHelper", this._position.clone(), scene);

                // Copy data from existing camera
                if (this._scene.activeCamera) {
                    this._deviceOrientationCamera.minZ = this._scene.activeCamera.minZ;
                    this._deviceOrientationCamera.maxZ = this._scene.activeCamera.maxZ;
                    // Set rotation from previous camera
                    if (this._scene.activeCamera instanceof TargetCamera && this._scene.activeCamera.rotation) {
                        var targetCamera = this._scene.activeCamera;
                        if (targetCamera.rotationQuaternion) {
                            this._deviceOrientationCamera.rotationQuaternion.copyFrom(targetCamera.rotationQuaternion);
                        } else {
                            this._deviceOrientationCamera.rotationQuaternion.copyFrom(Quaternion.RotationYawPitchRoll(targetCamera.rotation.y, targetCamera.rotation.x, targetCamera.rotation.z));
                        }
                        this._deviceOrientationCamera.rotation = targetCamera.rotation.clone();
                    }
                }

                this._scene.activeCamera = this._deviceOrientationCamera;
                if (this._canvas) {
                    this._scene.activeCamera.attachControl(this._canvas);
                }
            } else {
                this._existingCamera = this._scene.activeCamera;
            }

            // Create VR cameras
            if (webVROptions.createFallbackVRDeviceOrientationFreeCamera) {
                this._vrDeviceOrientationCamera = new VRDeviceOrientationFreeCamera("VRDeviceOrientationVRHelper", this._position, this._scene);
            }
            this._webVRCamera = new WebVRFreeCamera("WebVRHelper", this._position, this._scene, webVROptions);
            this._webVRCamera.useStandingMatrix()
            // Create default button
            if (!this._useCustomVRButton) {
                this._btnVR = <HTMLButtonElement>document.createElement("BUTTON");
                this._btnVR.className = "babylonVRicon";
                this._btnVR.id = "babylonVRiconbtn";
                this._btnVR.title = "Click to switch to VR";
                var css = ".babylonVRicon { position: absolute; right: 20px; height: 50px; width: 80px; background-color: rgba(51,51,51,0.7); background-image: url(data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%222048%22%20height%3D%221152%22%20viewBox%3D%220%200%202048%201152%22%20version%3D%221.1%22%3E%3Cpath%20transform%3D%22rotate%28180%201024%2C576.0000000000001%29%22%20d%3D%22m1109%2C896q17%2C0%2030%2C-12t13%2C-30t-12.5%2C-30.5t-30.5%2C-12.5l-170%2C0q-18%2C0%20-30.5%2C12.5t-12.5%2C30.5t13%2C30t30%2C12l170%2C0zm-85%2C256q59%2C0%20132.5%2C-1.5t154.5%2C-5.5t164.5%2C-11.5t163%2C-20t150%2C-30t124.5%2C-41.5q23%2C-11%2042%2C-24t38%2C-30q27%2C-25%2041%2C-61.5t14%2C-72.5l0%2C-257q0%2C-123%20-47%2C-232t-128%2C-190t-190%2C-128t-232%2C-47l-81%2C0q-37%2C0%20-68.5%2C14t-60.5%2C34.5t-55.5%2C45t-53%2C45t-53%2C34.5t-55.5%2C14t-55.5%2C-14t-53%2C-34.5t-53%2C-45t-55.5%2C-45t-60.5%2C-34.5t-68.5%2C-14l-81%2C0q-123%2C0%20-232%2C47t-190%2C128t-128%2C190t-47%2C232l0%2C257q0%2C68%2038%2C115t97%2C73q54%2C24%20124.5%2C41.5t150%2C30t163%2C20t164.5%2C11.5t154.5%2C5.5t132.5%2C1.5zm939%2C-298q0%2C39%20-24.5%2C67t-58.5%2C42q-54%2C23%20-122%2C39.5t-143.5%2C28t-155.5%2C19t-157%2C11t-148.5%2C5t-129.5%2C1.5q-59%2C0%20-130%2C-1.5t-148%2C-5t-157%2C-11t-155.5%2C-19t-143.5%2C-28t-122%2C-39.5q-34%2C-14%20-58.5%2C-42t-24.5%2C-67l0%2C-257q0%2C-106%2040.5%2C-199t110%2C-162.5t162.5%2C-109.5t199%2C-40l81%2C0q27%2C0%2052%2C14t50%2C34.5t51%2C44.5t55.5%2C44.5t63.5%2C34.5t74%2C14t74%2C-14t63.5%2C-34.5t55.5%2C-44.5t51%2C-44.5t50%2C-34.5t52%2C-14l14%2C0q37%2C0%2070%2C0.5t64.5%2C4.5t63.5%2C12t68%2C23q71%2C30%20128.5%2C78.5t98.5%2C110t63.5%2C133.5t22.5%2C149l0%2C257z%22%20fill%3D%22white%22%20/%3E%3C/svg%3E%0A); background-size: 80%; background-repeat:no-repeat; background-position: center; border: none; outline: none; transition: transform 0.125s ease-out } .babylonVRicon:hover { transform: scale(1.05) } .babylonVRicon:active {background-color: rgba(51,51,51,1) } .babylonVRicon:focus {background-color: rgba(51,51,51,1) }";
                css += ".babylonVRicon.vrdisplaypresenting { display: none; }";
                // TODO: Add user feedback so that they know what state the VRDisplay is in (disconnected, connected, entering-VR)
                // css += ".babylonVRicon.vrdisplaysupported { }";
                // css += ".babylonVRicon.vrdisplayready { }";
                // css += ".babylonVRicon.vrdisplayrequesting { }";

                var style = document.createElement('style');
                style.appendChild(document.createTextNode(css));
                document.getElementsByTagName('head')[0].appendChild(style);

                this.moveButtonToBottomRight();
            }

            // VR button click event
            if (this._btnVR) {
                this._btnVR.addEventListener("click", () => {
                    if (!this.isInVRMode) {
                        this.enterVR();
                    } else {
                        this.exitVR();
                    }
                });
            }

            // Window events
            window.addEventListener("resize", this._onResize);
            document.addEventListener("fullscreenchange", this._onFullscreenChange, false);
            document.addEventListener("mozfullscreenchange", this._onFullscreenChange, false);
            document.addEventListener("webkitfullscreenchange", this._onFullscreenChange, false);
            document.addEventListener("msfullscreenchange", this._onFullscreenChange, false);

            // Display vr button when headset is connected
            if (webVROptions.createFallbackVRDeviceOrientationFreeCamera) {
                this.displayVRButton();
            } else {
                this._scene.getEngine().onVRDisplayChangedObservable.add((e) => {
                    if (e.vrDisplay) {
                        this.displayVRButton();
                    }
                })
            }

            // Exiting VR mode using 'ESC' key on desktop
            this._onKeyDown = (event: KeyboardEvent) => {
                if (event.keyCode === 27 && this.isInVRMode) {
                    this.exitVR();
                }
            };
            document.addEventListener("keydown", this._onKeyDown);

            // Exiting VR mode double tapping the touch screen
            this._scene.onPrePointerObservable.add((pointerInfo, eventState) => {
                if (this.isInVRMode) {
                    this.exitVR();
                    if (this._fullscreenVRpresenting) {
                        this._scene.getEngine().switchFullscreen(true);
                    }
                }
            }, PointerEventTypes.POINTERDOUBLETAP, false);

            // Listen for WebVR display changes
            this._onVRDisplayChanged = (eventArgs: IDisplayChangedEventArgs) => this.onVRDisplayChanged(eventArgs);
            this._onVrDisplayPresentChange = () => this.onVrDisplayPresentChange();
            this._onVRRequestPresentStart = () => {
                this._webVRrequesting = true;
                this.updateButtonVisibility();
            }
            this._onVRRequestPresentComplete = (success: boolean) => {
                this._webVRrequesting = false;
                this.updateButtonVisibility();
            };
            scene.getEngine().onVRDisplayChangedObservable.add(this._onVRDisplayChanged);
            scene.getEngine().onVRRequestPresentStart.add(this._onVRRequestPresentStart);
            scene.getEngine().onVRRequestPresentComplete.add(this._onVRRequestPresentComplete);
            window.addEventListener('vrdisplaypresentchange', this._onVrDisplayPresentChange);

            scene.onDisposeObservable.add(() => {
                this.dispose();
            })

            // Gamepad connection events
            this._webVRCamera.onControllerMeshLoadedObservable.add((webVRController) => this._onDefaultMeshLoaded(webVRController));
            this._scene.gamepadManager.onGamepadConnectedObservable.add(this._onNewGamepadConnected);
            this._scene.gamepadManager.onGamepadDisconnectedObservable.add(this._onNewGamepadDisconnected);

            this.updateButtonVisibility();

            //create easing functions
            this._circleEase = new CircleEase();
            this._circleEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
        }

        // Raised when one of the controller has loaded successfully its associated default mesh
        private _onDefaultMeshLoaded(webVRController: WebVRController) {
            this._tryEnableInteractionOnController(webVRController);
            try {
                this.onControllerMeshLoadedObservable.notifyObservers(webVRController);
            }
            catch (err) {
                Tools.Warn("Error in your custom logic onControllerMeshLoaded: " + err);
            }
        }

        private _onResize = () => {
            this.moveButtonToBottomRight();
            if (this._fullscreenVRpresenting && this._webVRready) {
                this.exitVR();
            }
        }

        private _onFullscreenChange = () => {
            if (document.fullscreen !== undefined) {
                this._fullscreenVRpresenting = document.fullscreen;
            } else if (document.mozFullScreen !== undefined) {
                this._fullscreenVRpresenting = document.mozFullScreen;
            } else if (document.webkitIsFullScreen !== undefined) {
                this._fullscreenVRpresenting = document.webkitIsFullScreen;
            } else if (document.msIsFullScreen !== undefined) {
                this._fullscreenVRpresenting = document.msIsFullScreen;
            }
            if (!this._fullscreenVRpresenting && this._canvas) {
                this.exitVR();
                if (!this._useCustomVRButton) {
                    this._btnVR.style.top = this._canvas.offsetTop + this._canvas.offsetHeight - 70 + "px";
                    this._btnVR.style.left = this._canvas.offsetLeft + this._canvas.offsetWidth - 100 + "px";
                }
            }
        }

        /**
         * Gets a value indicating if we are currently in VR mode.
         */
        public get isInVRMode(): boolean {
            return this._webVRpresenting || this._fullscreenVRpresenting;
        }

        private onVrDisplayPresentChange() {
            var vrDisplay = this._scene.getEngine().getVRDevice();
            if (vrDisplay) {
                var wasPresenting = this._webVRpresenting;

                // A VR display is connected
                this._webVRpresenting = vrDisplay.isPresenting;

                if (wasPresenting && !this._webVRpresenting)
                    this.exitVR();
            } else {
                Tools.Warn('Detected VRDisplayPresentChange on an unknown VRDisplay. Did you can enterVR on the vrExperienceHelper?');
            }

            this.updateButtonVisibility();
        }

        private onVRDisplayChanged(eventArgs: IDisplayChangedEventArgs) {
            this._webVRsupported = eventArgs.vrSupported;
            this._webVRready = !!eventArgs.vrDisplay;
            this._webVRpresenting = eventArgs.vrDisplay && eventArgs.vrDisplay.isPresenting;

            this.updateButtonVisibility();
        }

        private moveButtonToBottomRight() {
            if (this._canvas && !this._useCustomVRButton) {
                this._btnVR.style.top = this._canvas.offsetTop + this._canvas.offsetHeight - 70 + "px";
                this._btnVR.style.left = this._canvas.offsetLeft + this._canvas.offsetWidth - 100 + "px";
            }
        }

        private displayVRButton() {
            if (!this._useCustomVRButton && !this._btnVRDisplayed) {
                document.body.appendChild(this._btnVR);
                this._btnVRDisplayed = true;
            }
        }

        private updateButtonVisibility() {
            if (!this._btnVR || this._useCustomVRButton) {
                return;
            }
            this._btnVR.className = "babylonVRicon";
            if (this.isInVRMode) {
                this._btnVR.className += " vrdisplaypresenting";
            } else {
                if (this._webVRready) this._btnVR.className += " vrdisplayready";
                if (this._webVRsupported) this._btnVR.className += " vrdisplaysupported";
                if (this._webVRrequesting) this._btnVR.className += " vrdisplayrequesting";
            }
        }

        /**
         * Attempt to enter VR. If a headset is connected and ready, will request present on that.
         * Otherwise, will use the fullscreen API.
         */
        public enterVR() {
            if (this.onEnteringVRObservable) {
                try {
                    this.onEnteringVRObservable.notifyObservers(this);
                }
                catch (err) {
                    Tools.Warn("Error in your custom logic onEnteringVR: " + err);
                }
            }

            if (this._scene.activeCamera) {
                this._position = this._scene.activeCamera.position.clone();
                // make sure that we return to the last active camera
                this._existingCamera = this._scene.activeCamera;
            }

            if (this._webVRrequesting)
                return;

            // If WebVR is supported and a headset is connected
            if (this._webVRready) {
                if (!this._webVRpresenting) {
                    this._webVRCamera.position = this._position;
                    this._scene.activeCamera = this._webVRCamera;
                }
            }
            else if (this._vrDeviceOrientationCamera) {
                this._vrDeviceOrientationCamera.position = this._position;
                this._scene.activeCamera = this._vrDeviceOrientationCamera;
                this._scene.getEngine().switchFullscreen(true);
                this.updateButtonVisibility();
            }

            if (this._scene.activeCamera && this._canvas) {
                this._scene.activeCamera.attachControl(this._canvas);
            }

            if (this._interactionsEnabled) {
                this._scene.registerBeforeRender(this.beforeRender);
            }
        }

        /**
         * Attempt to exit VR, or fullscreen.
         */
        public exitVR() {
            if (this.onExitingVRObservable) {
                try {
                    this.onExitingVRObservable.notifyObservers(this);
                }
                catch (err) {
                    Tools.Warn("Error in your custom logic onExitingVR: " + err);
                }
            }
            if (this._webVRpresenting) {
                this._scene.getEngine().disableVR();
            }
            if (this._scene.activeCamera) {
                this._position = this._scene.activeCamera.position.clone();

            }

            if (this._deviceOrientationCamera) {
                this._deviceOrientationCamera.position = this._position;
                this._scene.activeCamera = this._deviceOrientationCamera;
                if (this._canvas) {
                    this._scene.activeCamera.attachControl(this._canvas);
                }
            } else if (this._existingCamera) {
                this._existingCamera.position = this._position;
                this._scene.activeCamera = this._existingCamera;
            }

            this.updateButtonVisibility();

            if (this._interactionsEnabled) {
                this._scene.unregisterBeforeRender(this.beforeRender);
            }
        }

        public get position(): Vector3 {
            return this._position;
        }

        public set position(value: Vector3) {
            this._position = value;

            if (this._scene.activeCamera) {
                this._scene.activeCamera.position = value;
            }
        }

        public enableInteractions() {
            if (!this._interactionsEnabled) {
                this._interactionsRequested = true;

                if (this._leftControllerReady && this._webVRCamera.leftController) {
                    this._enableInteractionOnController(this._webVRCamera.leftController)
                }
                if (this._rightControllerReady && this._webVRCamera.rightController) {
                    this._enableInteractionOnController(this._webVRCamera.rightController)
                }

                this._createGazeTracker();

                this.raySelectionPredicate = (mesh) => {
                    return mesh.isVisible;
                }

                this.meshSelectionPredicate = (mesh) => {
                    return true;
                }

                this._raySelectionPredicate = (mesh) => {
                    if (this._isTeleportationFloor(mesh) || (mesh.name.indexOf("gazeTracker") === -1
                        && mesh.name.indexOf("teleportationTarget") === -1
                        && mesh.name.indexOf("torusTeleportation") === -1
                        && mesh.name.indexOf("laserPointer") === -1)) {
                        return this.raySelectionPredicate(mesh);
                    }
                    return false;
                }

                this._interactionsEnabled = true;
            }
        }

        private beforeRender = () => {
            this._castRayAndSelectObject();
        }

        private _isTeleportationFloor(mesh: AbstractMesh): boolean {
            for (var i = 0; i < this._floorMeshesCollection.length; i++) {
                if (this._floorMeshesCollection[i].id === mesh.id) {
                    return true;
                }
            }
            if (this._floorMeshName && mesh.name === this._floorMeshName) {
                return true;
            }
            return false;
        }

        public addFloorMesh(floorMesh: Mesh): void {
            if (!this._floorMeshesCollection) {
                return;
            }

            if (this._floorMeshesCollection.indexOf(floorMesh) > -1) {
                return;
            }

            this._floorMeshesCollection.push(floorMesh);
        }

        public removeFloorMesh(floorMesh: Mesh): void {
            if (!this._floorMeshesCollection) {
                return
            }

            const meshIndex = this._floorMeshesCollection.indexOf(floorMesh);
            if (meshIndex !== -1) {
                this._floorMeshesCollection.splice(meshIndex, 1);
            }
        }

        public enableTeleportation(vrTeleportationOptions: VRTeleportationOptions = {}) {
            if (!this._teleportationInitialized) {
                this._teleportationRequested = true;

                this.enableInteractions();

                if (vrTeleportationOptions.floorMeshName) {
                    this._floorMeshName = vrTeleportationOptions.floorMeshName;
                }
                if (vrTeleportationOptions.floorMeshes) {
                    this._floorMeshesCollection = vrTeleportationOptions.floorMeshes;
                }

                if (this._leftControllerReady && this._webVRCamera.leftController) {
                    this._enableTeleportationOnController(this._webVRCamera.leftController)
                }
                if (this._rightControllerReady && this._webVRCamera.rightController) {
                    this._enableTeleportationOnController(this._webVRCamera.rightController)
                }

                // Creates an image processing post process for the vignette not relying
                // on the main scene configuration for image processing to reduce setup and spaces 
                // (gamma/linear) conflicts.
                const imageProcessingConfiguration = new ImageProcessingConfiguration();
                imageProcessingConfiguration.vignetteColor = new Color4(0, 0, 0, 0);
                imageProcessingConfiguration.vignetteEnabled = true;
                this._postProcessMove = new ImageProcessingPostProcess("postProcessMove",
                    1.0,
                    this._webVRCamera,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    imageProcessingConfiguration);

                this._webVRCamera.detachPostProcess(this._postProcessMove)
                this._passProcessMove = new PassPostProcess("pass", 1.0, this._webVRCamera);
                this._teleportationInitialized = true;
                if (this._isDefaultTeleportationTarget) {
                    this._createTeleportationCircles();
                }
            }
        }

        private _onNewGamepadConnected = (gamepad: Gamepad) => {
            if (gamepad.type !== Gamepad.POSE_ENABLED) {
                if (gamepad.leftStick) {
                    gamepad.onleftstickchanged((stickValues) => {
                        if (this._teleportationInitialized && this.teleportationEnabled) {
                            // Listening to classic/xbox gamepad only if no VR controller is active
                            if ((!this._leftLaserPointer && !this._rightLaserPointer) ||
                                ((this._leftLaserPointer && !this._leftLaserPointer.isVisible) &&
                                    (this._rightLaserPointer && !this._rightLaserPointer.isVisible))) {
                                this._checkTeleportWithRay(stickValues);
                                this._checkTeleportBackwards(stickValues);
                            }
                        }
                    });
                }
                if (gamepad.rightStick) {
                    gamepad.onrightstickchanged((stickValues) => {
                        if (this._teleportationInitialized) {
                            this._checkRotate(stickValues);
                        }
                    });
                }
                if (gamepad.type === Gamepad.XBOX) {
                    (<Xbox360Pad>gamepad).onbuttondown((buttonPressed: Xbox360Button) => {
                        if (this._interactionsEnabled && buttonPressed === Xbox360Button.A) {
                            this._selectionPointerDown();
                        }
                    });
                    (<Xbox360Pad>gamepad).onbuttonup((buttonPressed: Xbox360Button) => {
                        if (this._interactionsEnabled && buttonPressed === Xbox360Button.A) {
                            this._selectionPointerUp();
                        }
                    });
                }
            } else {
                var webVRController = <WebVRController>gamepad;
                this._tryEnableInteractionOnController(webVRController);
            }
        }

        // This only succeeds if the controller's mesh exists for the controller so this must be called whenever new controller is connected or when mesh is loaded
        private _tryEnableInteractionOnController = (webVRController: WebVRController) => {
            if (webVRController.hand === "left") {
                this._leftControllerReady = true;
                if (this._interactionsRequested && !this._interactionsEnabledOnLeftController) {
                    this._enableInteractionOnController(webVRController);
                }
                if (this._teleportationRequested && !this._teleportationEnabledOnLeftController) {
                    this._enableTeleportationOnController(webVRController);
                }
            }
            if (webVRController.hand === "right") {
                this._rightControllerReady = true;
                if (this._interactionsRequested && !this._interactionsEnabledOnRightController) {
                    this._enableInteractionOnController(webVRController);
                }
                if (this._teleportationRequested && !this._teleportationEnabledOnRightController) {
                    this._enableTeleportationOnController(webVRController);
                }
            }
        }

        private _onNewGamepadDisconnected = (gamepad: Gamepad) => {
            if (gamepad instanceof WebVRController) {
                if (gamepad.hand === "left") {
                    this._interactionsEnabledOnLeftController = false;
                    this._teleportationEnabledOnLeftController = false;
                    this._leftControllerReady = false;
                    if (this._leftLaserPointer) {
                        this._leftLaserPointer.dispose();
                    }
                }
                if (gamepad.hand === "right") {
                    this._interactionsEnabledOnRightController = false;
                    this._teleportationEnabledOnRightController = false;
                    this._rightControllerReady = false;
                    if (this._rightLaserPointer) {
                        this._rightLaserPointer.dispose();
                    }
                }
            }
        }

        private _enableInteractionOnController(webVRController: WebVRController) {
            var controllerMesh = webVRController.mesh;
            if (controllerMesh) {
                var makeNotPick = (root: AbstractMesh) => {
                    root.name += " laserPointer";
                    root.getChildMeshes().forEach((c) => {
                        makeNotPick(c);
                    });
                }
                makeNotPick(controllerMesh);
                var childMeshes = controllerMesh.getChildMeshes();

                for (var i = 0; i < childMeshes.length; i++) {
                    if (childMeshes[i].name && childMeshes[i].name.indexOf("POINTING_POSE") >= 0) {
                        controllerMesh = childMeshes[i];
                        break;
                    }
                }
                var laserPointer = Mesh.CreateCylinder("laserPointer", 1, 0.004, 0.0002, 20, 1, this._scene, false);
                var laserPointerMaterial = new StandardMaterial("laserPointerMat", this._scene);
                laserPointerMaterial.emissiveColor = new Color3(0.7, 0.7, 0.7);
                laserPointerMaterial.alpha = 0.6;
                laserPointer.material = laserPointerMaterial;
                laserPointer.rotation.x = Math.PI / 2;
                laserPointer.parent = controllerMesh;
                laserPointer.position.z = -0.5;
                laserPointer.isVisible = false;
                if (webVRController.hand === "left") {
                    this._leftLaserPointer = laserPointer;
                    this._interactionsEnabledOnLeftController = true;
                    if (!this._rightLaserPointer) {
                        this._leftLaserPointer.isVisible = true;
                    }
                }
                else {
                    this._rightLaserPointer = laserPointer;
                    this._interactionsEnabledOnRightController = true;
                    if (!this._leftLaserPointer) {
                        this._rightLaserPointer.isVisible = true;
                    }
                }
                webVRController.onMainButtonStateChangedObservable.add((stateObject) => {
                    // Enabling / disabling laserPointer 
                    if (this._displayLaserPointer && stateObject.value === 1) {
                        laserPointer.isVisible = !laserPointer.isVisible;
                        // Laser pointer can only be active on left or right, not both at the same time
                        if (webVRController.hand === "left" && this._rightLaserPointer) {
                            this._rightLaserPointer.isVisible = false;
                        }
                        else if (this._leftLaserPointer) {
                            this._leftLaserPointer.isVisible = false;
                        }
                    }
                });
                webVRController.onTriggerStateChangedObservable.add((stateObject) => {
                    if (!this._pointerDownOnMeshAsked) {
                        if (stateObject.value > this._padSensibilityUp) {
                            this._selectionPointerDown();
                        }
                    } else if (stateObject.value < this._padSensibilityDown) {
                        this._selectionPointerUp();
                    }
                });
            }
        }

        private _checkTeleportWithRay(stateObject: StickValues, webVRController: Nullable<WebVRController> = null) {
            if (!this._teleportationRequestInitiated) {
                if (stateObject.y < -this._padSensibilityUp && this._dpadPressed) {
                    if (webVRController) {
                        // If laser pointer wasn't enabled yet
                        if (this._displayLaserPointer && webVRController.hand === "left" && this._leftLaserPointer) {
                            this._leftLaserPointer.isVisible = true;
                            if (this._rightLaserPointer) {
                                this._rightLaserPointer.isVisible = false;
                            }
                        } else if (this._displayLaserPointer && this._rightLaserPointer) {
                            this._rightLaserPointer.isVisible = true;
                            if (this._leftLaserPointer) {
                                this._leftLaserPointer.isVisible = false;
                            }
                        }
                    }
                    this._teleportationRequestInitiated = true;
                }
            } else {
                // Listening to the proper controller values changes to confirm teleportation
                if (webVRController == null
                    || (webVRController.hand === "left" && this._leftLaserPointer && this._leftLaserPointer.isVisible)
                    || (webVRController.hand === "right" && this._rightLaserPointer && this._rightLaserPointer.isVisible)) {
                    if (Math.sqrt(stateObject.y * stateObject.y + stateObject.x * stateObject.x) < this._padSensibilityDown) {
                        if (this._teleportationAllowed) {
                            this._teleportationAllowed = false;
                            this._teleportCamera();
                        }
                        this._teleportationRequestInitiated = false;
                    }
                }
            }
        }
        private _selectionPointerDown() {
            this._pointerDownOnMeshAsked = true;
            if (this._currentMeshSelected && this._currentHit) {
                this._scene.simulatePointerDown(this._currentHit);
            }
        }
        private _selectionPointerUp() {
            if (this._currentMeshSelected && this._currentHit) {
                this._scene.simulatePointerUp(this._currentHit);
            }
            this._pointerDownOnMeshAsked = false;
        }
        private _checkRotate(stateObject: StickValues) {
            // Only rotate when user is not currently selecting a teleportation location
            if (this._teleportationRequestInitiated) {
                return;
            }

            if (!this._rotationLeftAsked) {
                if (stateObject.x < -this._padSensibilityUp && this._dpadPressed) {
                    this._rotationLeftAsked = true;
                    if (this._rotationAllowed) {
                        this._rotateCamera(false);
                    }
                }
            } else {
                if (stateObject.x > -this._padSensibilityDown) {
                    this._rotationLeftAsked = false;
                }
            }

            if (!this._rotationRightAsked) {
                if (stateObject.x > this._padSensibilityUp && this._dpadPressed) {
                    this._rotationRightAsked = true;
                    if (this._rotationAllowed) {
                        this._rotateCamera(true);
                    }
                }
            } else {
                if (stateObject.x < this._padSensibilityDown) {
                    this._rotationRightAsked = false;
                }
            }
        }
        private _checkTeleportBackwards(stateObject: StickValues) {
            // Only teleport backwards when user is not currently selecting a teleportation location
            if (this._teleportationRequestInitiated) {
                return;
            }
            // Teleport backwards
            if (stateObject.y > this._padSensibilityUp && this._dpadPressed) {
                if (!this._teleportationBackRequestInitiated) {
                    if (!this.currentVRCamera) {
                        return;
                    }

                    // Get rotation and position of the current camera
                    var rotation = Quaternion.FromRotationMatrix(this.currentVRCamera.getWorldMatrix().getRotationMatrix());
                    var position = this.currentVRCamera.position;

                    // If the camera has device position, use that instead
                    if ((<WebVRFreeCamera>this.currentVRCamera).devicePosition && (<WebVRFreeCamera>this.currentVRCamera).deviceRotationQuaternion) {
                        rotation = (<WebVRFreeCamera>this.currentVRCamera).deviceRotationQuaternion;
                        position = (<WebVRFreeCamera>this.currentVRCamera).devicePosition;
                    }

                    // Get matrix with only the y rotation of the device rotation
                    rotation.toEulerAnglesToRef(this._workingVector);
                    this._workingVector.z = 0;
                    this._workingVector.x = 0;
                    Quaternion.RotationYawPitchRollToRef(this._workingVector.y, this._workingVector.x, this._workingVector.z, this._workingQuaternion);
                    this._workingQuaternion.toRotationMatrix(this._workingMatrix);

                    // Rotate backwards ray by device rotation to cast at the ground behind the user
                    Vector3.TransformCoordinatesToRef(this.teleportBackwardsVector, this._workingMatrix, this._workingVector);

                    // Teleport if ray hit the ground and is not to far away eg. backwards off a cliff
                    var ray = new Ray(position, this._workingVector);
                    var hit = this._scene.pickWithRay(ray, this._raySelectionPredicate);
                    if (hit && hit.pickedPoint && hit.pickedMesh && this._isTeleportationFloor(hit.pickedMesh) && hit.distance < 5) {
                        this._teleportCamera(hit.pickedPoint);
                    }

                    this._teleportationBackRequestInitiated = true;
                }
            } else {
                this._teleportationBackRequestInitiated = false;
            }

        }

        private _enableTeleportationOnController(webVRController: WebVRController) {
            var controllerMesh = webVRController.mesh;
            if (controllerMesh) {
                if (webVRController.hand === "left") {
                    if (!this._interactionsEnabledOnLeftController) {
                        this._enableInteractionOnController(webVRController);
                    }
                    this._teleportationEnabledOnLeftController = true;
                }
                else {
                    if (!this._interactionsEnabledOnRightController) {
                        this._enableInteractionOnController(webVRController);
                    }
                    this._teleportationEnabledOnRightController = true;
                }
                if (webVRController.controllerType === PoseEnabledControllerType.VIVE) {
                    this._dpadPressed = false;
                    webVRController.onPadStateChangedObservable.add((stateObject) => {
                        this._dpadPressed = stateObject.pressed;
                        if (!this._dpadPressed) {
                            this._rotationLeftAsked = false;
                            this._rotationRightAsked = false;
                            this._teleportationBackRequestInitiated = false;
                        }
                    });
                }
                webVRController.onPadValuesChangedObservable.add((stateObject) => {
                    if (this.teleportationEnabled) {
                        this._checkTeleportBackwards(stateObject);
                        this._checkTeleportWithRay(stateObject, webVRController);
                    }
                    this._checkRotate(stateObject);
                });
            }
        }

        // Gaze support used to point to teleport or to interact with an object
        private _createGazeTracker() {
            this._gazeTracker = Mesh.CreateTorus("gazeTracker", 0.0035, 0.0025, 20, this._scene, false);
            this._gazeTracker.bakeCurrentTransformIntoVertices();
            this._gazeTracker.isPickable = false;
            this._gazeTracker.isVisible = false;

            var targetMat = new StandardMaterial("targetMat", this._scene);
            targetMat.specularColor = Color3.Black();
            targetMat.emissiveColor = new Color3(0.7, 0.7, 0.7)
            targetMat.backFaceCulling = false;
            this._gazeTracker.material = targetMat;
        }

        private _createTeleportationCircles() {
            this._teleportationTarget = Mesh.CreateGround("teleportationTarget", 2, 2, 2, this._scene);
            this._teleportationTarget.isPickable = false;

            var length = 512;
            var dynamicTexture = new DynamicTexture("DynamicTexture", length, this._scene, true);
            dynamicTexture.hasAlpha = true;
            var context = dynamicTexture.getContext();

            var centerX = length / 2;
            var centerY = length / 2;
            var radius = 200;

            context.beginPath();
            context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            context.fillStyle = this._teleportationFillColor;
            context.fill();
            context.lineWidth = 10;
            context.strokeStyle = this._teleportationBorderColor;
            context.stroke();
            context.closePath();
            dynamicTexture.update();

            var teleportationCircleMaterial = new StandardMaterial("TextPlaneMaterial", this._scene);
            teleportationCircleMaterial.diffuseTexture = dynamicTexture;
            this._teleportationTarget.material = teleportationCircleMaterial;

            var torus = Mesh.CreateTorus("torusTeleportation", 0.75, 0.1, 25, this._scene, false);
            torus.isPickable = false;
            torus.parent = this._teleportationTarget;

            var animationInnerCircle = new Animation("animationInnerCircle", "position.y", 30, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);

            var keys = [];
            keys.push({
                frame: 0,
                value: 0
            });
            keys.push({
                frame: 30,
                value: 0.4
            });
            keys.push({
                frame: 60,
                value: 0
            });

            animationInnerCircle.setKeys(keys);

            var easingFunction = new SineEase();
            easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
            animationInnerCircle.setEasingFunction(easingFunction);

            torus.animations = [];
            torus.animations.push(animationInnerCircle);

            this._scene.beginAnimation(torus, 0, 60, true);

            this._hideTeleportationTarget();
        }

        private _displayTeleportationTarget() {
            if (this._teleportationInitialized) {
                this._teleportationTarget.isVisible = true;
                if (this._isDefaultTeleportationTarget) {
                    (<Mesh>this._teleportationTarget.getChildren()[0]).isVisible = true;
                }
            }
        }

        private _hideTeleportationTarget() {
            if (this._teleportationInitialized) {
                this._teleportationTarget.isVisible = false;
                if (this._isDefaultTeleportationTarget) {
                    (<Mesh>this._teleportationTarget.getChildren()[0]).isVisible = false;
                }
            }
        }

        private _rotateCamera(right: boolean) {
            if (!(this.currentVRCamera instanceof FreeCamera)) {
                return;
            }

            if (right) {
                this._rotationAngle++;
            }
            else {
                this._rotationAngle--;
            }

            this.currentVRCamera.animations = [];

            var target = Quaternion.FromRotationMatrix(Matrix.RotationY(Math.PI / 4 * this._rotationAngle));

            var animationRotation = new Animation("animationRotation", "rotationQuaternion", 90, Animation.ANIMATIONTYPE_QUATERNION,
                Animation.ANIMATIONLOOPMODE_CONSTANT);

            var animationRotationKeys = [];
            animationRotationKeys.push({
                frame: 0,
                value: this.currentVRCamera.rotationQuaternion
            });
            animationRotationKeys.push({
                frame: 6,
                value: target
            });

            animationRotation.setKeys(animationRotationKeys);

            animationRotation.setEasingFunction(this._circleEase);

            this.currentVRCamera.animations.push(animationRotation);

            this._postProcessMove.animations = [];

            var animationPP = new Animation("animationPP", "vignetteWeight", 90, Animation.ANIMATIONTYPE_FLOAT,
                Animation.ANIMATIONLOOPMODE_CONSTANT);

            var vignetteWeightKeys = [];
            vignetteWeightKeys.push({
                frame: 0,
                value: 0
            });
            vignetteWeightKeys.push({
                frame: 3,
                value: 4
            });
            vignetteWeightKeys.push({
                frame: 6,
                value: 0
            });

            animationPP.setKeys(vignetteWeightKeys);
            animationPP.setEasingFunction(this._circleEase);
            this._postProcessMove.animations.push(animationPP);

            var animationPP2 = new Animation("animationPP2", "vignetteStretch", 90, Animation.ANIMATIONTYPE_FLOAT,
                Animation.ANIMATIONLOOPMODE_CONSTANT);

            var vignetteStretchKeys = [];
            vignetteStretchKeys.push({
                frame: 0,
                value: 0
            });
            vignetteStretchKeys.push({
                frame: 3,
                value: 10
            });
            vignetteStretchKeys.push({
                frame: 6,
                value: 0
            });

            animationPP2.setKeys(vignetteStretchKeys);
            animationPP2.setEasingFunction(this._circleEase);
            this._postProcessMove.animations.push(animationPP2);

            this._postProcessMove.imageProcessingConfiguration.vignetteWeight = 0;
            this._postProcessMove.imageProcessingConfiguration.vignetteStretch = 0;

            this._webVRCamera.attachPostProcess(this._postProcessMove)
            this._scene.beginAnimation(this._postProcessMove, 0, 6, false, 1, () => {
                this._webVRCamera.detachPostProcess(this._postProcessMove)
            });
            this._scene.beginAnimation(this.currentVRCamera, 0, 6, false, 1);
        }

        private _moveTeleportationSelectorTo(hit: PickingInfo) {
            if (hit.pickedPoint) {
                this._teleportationAllowed = true;
                if (this._teleportationRequestInitiated) {
                    this._displayTeleportationTarget();
                }
                else {
                    this._hideTeleportationTarget();
                }
                this._haloCenter.copyFrom(hit.pickedPoint);
                this._teleportationTarget.position.copyFrom(hit.pickedPoint);
                var pickNormal = hit.getNormal(true, false);
                if (pickNormal) {
                    var axis1 = Vector3.Cross(Axis.Y, pickNormal);
                    var axis2 = Vector3.Cross(pickNormal, axis1);
                    Vector3.RotationFromAxisToRef(axis2, pickNormal, axis1, this._teleportationTarget.rotation);
                }
                this._teleportationTarget.position.y += 0.1;
            }
        }
        private _workingVector = Vector3.Zero();
        private _workingQuaternion = Quaternion.Identity();
        private _workingMatrix = Matrix.Identity();
        private _teleportCamera(location: Nullable<Vector3> = null) {
            if (!(this.currentVRCamera instanceof FreeCamera)) {
                return;
            }

            if (!location) {
                location = this._haloCenter;
            }
            // Teleport the hmd to where the user is looking by moving the anchor to where they are looking minus the
            // offset of the headset from the anchor.
            if (this.webVRCamera.leftCamera) {
                this._workingVector.copyFrom(this.webVRCamera.leftCamera.globalPosition);
                this._workingVector.subtractInPlace(this.webVRCamera.position);
                location.subtractToRef(this._workingVector, this._workingVector);
            } else {
                this._workingVector.copyFrom(location);
            }
            // Add height to account for user's height offset
            if (this.isInVRMode) {
                this._workingVector.y += this.webVRCamera.deviceDistanceToRoomGround();
            } else {
                this._workingVector.y += this._defaultHeight;
            }

            this.onBeforeCameraTeleport.notifyObservers(this._workingVector);

            // Create animation from the camera's position to the new location
            this.currentVRCamera.animations = [];
            var animationCameraTeleportation = new Animation("animationCameraTeleportation", "position", 90, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
            var animationCameraTeleportationKeys = [{
                frame: 0,
                value: this.currentVRCamera.position
            },
            {
                frame: 11,
                value: this._workingVector
            }
            ];

            animationCameraTeleportation.setKeys(animationCameraTeleportationKeys);
            animationCameraTeleportation.setEasingFunction(this._circleEase);
            this.currentVRCamera.animations.push(animationCameraTeleportation);

            this._postProcessMove.animations = [];

            var animationPP = new Animation("animationPP", "vignetteWeight", 90, Animation.ANIMATIONTYPE_FLOAT,
                Animation.ANIMATIONLOOPMODE_CONSTANT);

            var vignetteWeightKeys = [];
            vignetteWeightKeys.push({
                frame: 0,
                value: 0
            });
            vignetteWeightKeys.push({
                frame: 5,
                value: 8
            });
            vignetteWeightKeys.push({
                frame: 11,
                value: 0
            });

            animationPP.setKeys(vignetteWeightKeys);
            this._postProcessMove.animations.push(animationPP);

            var animationPP2 = new Animation("animationPP2", "vignetteStretch", 90, Animation.ANIMATIONTYPE_FLOAT,
                Animation.ANIMATIONLOOPMODE_CONSTANT);

            var vignetteStretchKeys = [];
            vignetteStretchKeys.push({
                frame: 0,
                value: 0
            });
            vignetteStretchKeys.push({
                frame: 5,
                value: 10
            });
            vignetteStretchKeys.push({
                frame: 11,
                value: 0
            });

            animationPP2.setKeys(vignetteStretchKeys);
            this._postProcessMove.animations.push(animationPP2);

            this._postProcessMove.imageProcessingConfiguration.vignetteWeight = 0;
            this._postProcessMove.imageProcessingConfiguration.vignetteStretch = 0;

            this._webVRCamera.attachPostProcess(this._postProcessMove)
            this._scene.beginAnimation(this._postProcessMove, 0, 11, false, 1, () => {
                this._webVRCamera.detachPostProcess(this._postProcessMove)
            });
            this._scene.beginAnimation(this.currentVRCamera, 0, 11, false, 1, () => {
                this.onAfterCameraTeleport.notifyObservers(this._workingVector);
            });
        }

        private _castRayAndSelectObject() {
            if (!(this.currentVRCamera instanceof FreeCamera)) {
                return;
            }

            var ray: Ray;
            if (this._leftLaserPointer && this._leftLaserPointer.isVisible && (<any>this.currentVRCamera).leftController) {
                ray = (<any>this.currentVRCamera).leftController.getForwardRay(this._rayLength);
            }
            else if (this._rightLaserPointer && this._rightLaserPointer.isVisible && (<any>this.currentVRCamera).rightController) {
                ray = (<any>this.currentVRCamera).rightController.getForwardRay(this._rayLength);
            } else {
                ray = this.currentVRCamera.getForwardRay(this._rayLength);
            }

            var hit = this._scene.pickWithRay(ray, this._raySelectionPredicate);

            // Moving the gazeTracker on the mesh face targetted
            if (hit && hit.pickedPoint) {
                if (this._displayGaze) {
                    let multiplier = 1;

                    this._gazeTracker.isVisible = true;

                    if (this._isActionableMesh) {
                        multiplier = 3;
                    }
                    this._gazeTracker.scaling.x = hit.distance * multiplier;
                    this._gazeTracker.scaling.y = hit.distance * multiplier;
                    this._gazeTracker.scaling.z = hit.distance * multiplier;

                    var pickNormal = hit.getNormal();
                    // To avoid z-fighting
                    let deltaFighting = 0.002;

                    if (pickNormal) {
                        var axis1 = Vector3.Cross(Axis.Y, pickNormal);
                        var axis2 = Vector3.Cross(pickNormal, axis1);
                        Vector3.RotationFromAxisToRef(axis2, pickNormal, axis1, this._gazeTracker.rotation);
                    }
                    this._gazeTracker.position.copyFrom(hit.pickedPoint);

                    if (this._gazeTracker.position.x < 0) {
                        this._gazeTracker.position.x += deltaFighting;
                    }
                    else {
                        this._gazeTracker.position.x -= deltaFighting;
                    }
                    if (this._gazeTracker.position.y < 0) {
                        this._gazeTracker.position.y += deltaFighting;
                    }
                    else {
                        this._gazeTracker.position.y -= deltaFighting;
                    }
                    if (this._gazeTracker.position.z < 0) {
                        this._gazeTracker.position.z += deltaFighting;
                    }
                    else {
                        this._gazeTracker.position.z -= deltaFighting;
                    }
                }

                // Changing the size of the laser pointer based on the distance from the targetted point
                if (this._rightLaserPointer && this._rightLaserPointer.isVisible) {
                    this._rightLaserPointer.scaling.y = hit.distance;
                    this._rightLaserPointer.position.z = -hit.distance / 2;
                }
                if (this._leftLaserPointer && this._leftLaserPointer.isVisible) {
                    this._leftLaserPointer.scaling.y = hit.distance;
                    this._leftLaserPointer.position.z = -hit.distance / 2;
                }
            }
            else {
                this._gazeTracker.isVisible = false;
            }

            if (hit && hit.pickedMesh) {
                this._currentHit = hit;
                if (this._pointerDownOnMeshAsked) {
                    this._scene.simulatePointerMove(this._currentHit);
                }
                // The object selected is the floor, we're in a teleportation scenario
                if (this._teleportationInitialized && this._isTeleportationFloor(hit.pickedMesh) && hit.pickedPoint) {
                    // Moving the teleportation area to this targetted point

                    //Raise onSelectedMeshUnselected observable if ray collided floor mesh/meshes and a non floor mesh was previously selected
                    if (this._currentMeshSelected &&
                        !this._isTeleportationFloor(this._currentMeshSelected)) {
                        this.onSelectedMeshUnselected.notifyObservers(this._currentMeshSelected);
                    }

                    this._currentMeshSelected = null;

                    this._moveTeleportationSelectorTo(hit);
                    return;
                }
                // If not, we're in a selection scenario
                this._hideTeleportationTarget();
                this._teleportationAllowed = false;
                if (hit.pickedMesh !== this._currentMeshSelected) {
                    if (this.meshSelectionPredicate(hit.pickedMesh)) {
                        this.onNewMeshPicked.notifyObservers(hit);
                        this._currentMeshSelected = hit.pickedMesh;
                        if (hit.pickedMesh.isPickable && hit.pickedMesh.actionManager) {
                            this.changeGazeColor(new Color3(0, 0, 1));
                            this.changeLaserColor(new Color3(0.2, 0.2, 1));
                            this._isActionableMesh = true;
                        }
                        else {
                            this.changeGazeColor(new Color3(0.7, 0.7, 0.7));
                            this.changeLaserColor(new Color3(0.7, 0.7, 0.7));
                            this._isActionableMesh = false;
                        }
                        try {
                            this.onNewMeshSelected.notifyObservers(this._currentMeshSelected);
                        }
                        catch (err) {
                            Tools.Warn("Error in your custom logic onNewMeshSelected: " + err);
                        }
                    }
                    else {
                        if (this._currentMeshSelected) {
                            this.onSelectedMeshUnselected.notifyObservers(this._currentMeshSelected);
                        }
                        this._currentMeshSelected = null;
                        this.changeGazeColor(new Color3(0.7, 0.7, 0.7));
                        this.changeLaserColor(new Color3(0.7, 0.7, 0.7));
                    }
                }
            }
            else {
                this._currentHit = null;
                this._currentMeshSelected = null;
                this._teleportationAllowed = false;
                this._hideTeleportationTarget();
                this.changeGazeColor(new Color3(0.7, 0.7, 0.7));
                this.changeLaserColor(new Color3(0.7, 0.7, 0.7));
            }
        }

        public changeLaserColor(color: Color3) {
            if (this._leftLaserPointer && this._leftLaserPointer.material) {
                (<StandardMaterial>this._leftLaserPointer.material).emissiveColor = color;
            }
            if (this._rightLaserPointer && this._rightLaserPointer.material) {
                (<StandardMaterial>this._rightLaserPointer.material).emissiveColor = color;
            }
        }

        public changeGazeColor(color: Color3) {
            if (this._gazeTracker.material) {
                (<StandardMaterial>this._gazeTracker.material).emissiveColor = color;
            }
        }

        public dispose() {
            if (this.isInVRMode) {
                this.exitVR();
            }

            if (this._passProcessMove) {
                this._passProcessMove.dispose();
            }

            if (this._postProcessMove) {
                this._postProcessMove.dispose();
            }

            if (this._webVRCamera) {
                this._webVRCamera.dispose();
            }
            if (this._vrDeviceOrientationCamera) {
                this._vrDeviceOrientationCamera.dispose();
            }
            if (!this._useCustomVRButton && this._btnVR.parentNode) {
                document.body.removeChild(this._btnVR);
            }

            if (this._deviceOrientationCamera && (this._scene.activeCamera != this._deviceOrientationCamera)) {
                this._deviceOrientationCamera.dispose();
            }

            if (this._gazeTracker) {
                this._gazeTracker.dispose();
            }

            if (this._teleportationTarget) {
                this._teleportationTarget.dispose();
            }

            this._floorMeshesCollection = [];

            document.removeEventListener("keydown", this._onKeyDown);
            window.removeEventListener('vrdisplaypresentchange', this._onVrDisplayPresentChange);

            window.removeEventListener("resize", this._onResize);
            document.removeEventListener("fullscreenchange", this._onFullscreenChange);
            document.removeEventListener("mozfullscreenchange", this._onFullscreenChange);
            document.removeEventListener("webkitfullscreenchange", this._onFullscreenChange);
            document.removeEventListener("msfullscreenchange", this._onFullscreenChange);

            this._scene.getEngine().onVRDisplayChangedObservable.removeCallback(this._onVRDisplayChanged);
            this._scene.getEngine().onVRRequestPresentStart.removeCallback(this._onVRRequestPresentStart);
            this._scene.getEngine().onVRRequestPresentComplete.removeCallback(this._onVRRequestPresentComplete);
            window.removeEventListener('vrdisplaypresentchange', this._onVrDisplayPresentChange);

            this._scene.gamepadManager.onGamepadConnectedObservable.removeCallback(this._onNewGamepadConnected);
            this._scene.gamepadManager.onGamepadDisconnectedObservable.removeCallback(this._onNewGamepadDisconnected);

            this._scene.unregisterBeforeRender(this.beforeRender);
        }

        public getClassName(): string {
            return "VRExperienceHelper";
        }
    }
}