module BABYLON {
    export interface VRTeleportationOptions {
        floorMeshName?: string; // If you'd like to provide a mesh acting as the floor
    }

    export class VRExperienceHelper {
        private _scene: BABYLON.Scene;
        private _position: Vector3;
        private _btnVR: HTMLButtonElement;

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
        private _vrDeviceOrientationCamera: VRDeviceOrientationFreeCamera;
        private _deviceOrientationCamera: DeviceOrientationCamera;
        
        private _onKeyDown: (event: KeyboardEvent) => void;
        private _onVrDisplayPresentChange: any;
        private _onVRDisplayChanged: (eventArgs:IDisplayChangedEventArgs) => void;
        private _onVRRequestPresentStart: () => void;
        private _onVRRequestPresentComplete: (success: boolean) => void;
        
        public onEnteringVR = new Observable(); 
        public onExitingVR = new Observable();
        public onControllerMeshLoaded = new Observable<WebVRController>();  

        private _hmdOffsetFromPosition = Vector3.Zero();
        private _rayLength: number;
        private _useCustomVRButton: boolean = false;
        private _teleportationRequested: boolean = false;
        private _teleportationEnabledOnLeftController: boolean = false;
        private _teleportationEnabledOnRightController: boolean = false;
        private _leftControllerReady: boolean = false;
        private _rightControllerReady: boolean = false;
        private _floorMeshName: string;
        private _teleportationAllowed: boolean = false;
        private _rotationAllowed: boolean = true;
        private _teleportationRequestInitiated = false;
        private _rotationRightAsked = false;
        private _rotationLeftAsked = false;
        private _teleportationCircle: Mesh;
        private _postProcessMove: ImageProcessingPostProcess;
        private _passProcessMove: PassPostProcess;
        private _teleportationFillColor: string = "#444444";
        private _teleportationBorderColor: string = "#FFFFFF";
        private _rotationAngle: number = 0;
        private _haloCenter = new Vector3(0, 0, 0);
        private _gazeTracker: BABYLON.Mesh;
        private _padSensibilityUp = 0.65;
        private _padSensibilityDown = 0.35;
        private _leftLaserPointer: Nullable<Mesh>;
        private _rightLaserPointer: Nullable<Mesh>;
        private _currentMeshSelected: Nullable<AbstractMesh>;
        public onNewMeshSelected = new Observable<AbstractMesh>();

        private _raySelectionPredicate: (mesh: AbstractMesh) => boolean;

        /**
         * To be optionaly changed by user to define custom ray selection
         */
        public raySelectionPredicate: (mesh: AbstractMesh) => boolean;

        /**
         * To be optionaly changed by user to define custom selection logic (after ray selection)
         */
        public meshSelectionPredicate: (mesh: AbstractMesh) => boolean;
        
        private _currentHit: Nullable<PickingInfo>;
        private _pointerDownOnMeshAsked = false;
        private _isActionableMesh = false;

        public get deviceOrientationCamera(): DeviceOrientationCamera {
            return this._deviceOrientationCamera;
        }

        // Based on the current WebVR support, returns the current VR camera used
        public get currentVRCamera(): FreeCamera {
            if (this._webVRready) {
                return this._webVRCamera;
            }
            else {
                return this._vrDeviceOrientationCamera;
            }
        }

        public get webVRCamera(): WebVRFreeCamera {
            return this._webVRCamera;
        }

        public get vrDeviceOrientationCamera(): VRDeviceOrientationFreeCamera {
            return this._vrDeviceOrientationCamera;
        }
                
        constructor(scene: Scene, public webVROptions: WebVROptions = {}) {
            this._scene = scene;

            if (!this._scene.activeCamera || isNaN(this._scene.activeCamera.position.x)) {
                this._position = new BABYLON.Vector3(0, 2, 0);
                this._deviceOrientationCamera = new BABYLON.DeviceOrientationCamera("deviceOrientationVRHelper", new BABYLON.Vector3(0, 1.7, 0), scene);
            }
            else {
                this._position = this._scene.activeCamera.position.clone();
                this._deviceOrientationCamera = new BABYLON.DeviceOrientationCamera("deviceOrientationVRHelper", this._position, scene);
                this._deviceOrientationCamera.minZ = this._scene.activeCamera.minZ;
                this._deviceOrientationCamera.maxZ = this._scene.activeCamera.maxZ;
                // Set rotation from previous camera
                if(this._scene.activeCamera instanceof TargetCamera && this._scene.activeCamera.rotation){
                    var targetCamera = this._scene.activeCamera;
                    if(targetCamera.rotationQuaternion){
                        this._deviceOrientationCamera.rotationQuaternion.copyFrom(targetCamera.rotationQuaternion);
                    }else{
                        this._deviceOrientationCamera.rotationQuaternion.copyFrom(Quaternion.RotationYawPitchRoll(targetCamera.rotation.y, targetCamera.rotation.x, targetCamera.rotation.z));
                    }
                    this._deviceOrientationCamera.rotation = targetCamera.rotation.clone();
                }
            }
            this._scene.activeCamera = this._deviceOrientationCamera;
            this._canvas = scene.getEngine().getRenderingCanvas();
            if (this._canvas) {
                this._scene.activeCamera.attachControl(this._canvas);
            }

            if (webVROptions) {
                if (webVROptions.useCustomVRButton) {
                    this._useCustomVRButton = true;
                    if (webVROptions.customVRButton) {
                        this._btnVR = webVROptions.customVRButton;
                    }
                }

                if (webVROptions.rayLength) {
                    this._rayLength = webVROptions.rayLength
                }
            }

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
            }  

            if (this._canvas) {
                if (!this._useCustomVRButton) {
                    this._btnVR.style.top = this._canvas.offsetTop + this._canvas.offsetHeight - 70 + "px";
                    this._btnVR.style.left = this._canvas.offsetLeft + this._canvas.offsetWidth - 100 + "px";
                }
                if (this._btnVR) {
                    this._btnVR.addEventListener("click", () => {
                        this.enterVR();
                    });
                }

                window.addEventListener("resize", () => {
                    if (this._canvas && !this._useCustomVRButton) {
                        this._btnVR.style.top = this._canvas.offsetTop + this._canvas.offsetHeight - 70 + "px";
                        this._btnVR.style.left = this._canvas.offsetLeft + this._canvas.offsetWidth - 100 + "px";
                    }

                    if (this._fullscreenVRpresenting && this._webVRready) {
                        this.exitVR();
                    }
                });
            }

            document.addEventListener("fullscreenchange", () => { this._onFullscreenChange() }, false);
            document.addEventListener("mozfullscreenchange", () => { this._onFullscreenChange() }, false);
            document.addEventListener("webkitfullscreenchange", () => { this._onFullscreenChange() }, false);
            document.addEventListener("msfullscreenchange", () => { this._onFullscreenChange() }, false);

            if (!this._useCustomVRButton) {
                document.body.appendChild(this._btnVR);
            }

            // Exiting VR mode using 'ESC' key on desktop
            this._onKeyDown = (event: KeyboardEvent) => {
                if (event.keyCode === 27 && this.isInVRMode()) {
                    this.exitVR();
                }
            };
            document.addEventListener("keydown", this._onKeyDown);

            // Exiting VR mode double tapping the touch screen
            this._scene.onPrePointerObservable.add( (pointerInfo, eventState) => {
                if (this.isInVRMode()) {
                    this.exitVR();
                    if (this._fullscreenVRpresenting) {
                        this._scene.getEngine().switchFullscreen(true);
                    }
                }
            }, BABYLON.PointerEventTypes.POINTERDOUBLETAP, false);
            
            // Listen for WebVR display changes
            this._onVRDisplayChanged = (eventArgs:IDisplayChangedEventArgs) => this.onVRDisplayChanged(eventArgs);
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

            // Create the cameras
            this._vrDeviceOrientationCamera = new BABYLON.VRDeviceOrientationFreeCamera("VRDeviceOrientationVRHelper", this._position, this._scene);            
            this._webVRCamera = new BABYLON.WebVRFreeCamera("WebVRHelper", this._position, this._scene, webVROptions);
            this._webVRCamera.onControllerMeshLoadedObservable.add((webVRController) => this._onDefaultMeshLoaded(webVRController));
        
            this.updateButtonVisibility();
        }

        // Raised when one of the controller has loaded successfully its associated default mesh
        private _onDefaultMeshLoaded(webVRController: WebVRController) {
            if (webVRController.hand === "left") {
                this._leftControllerReady = true;
                if (this._teleportationRequested && !this._teleportationEnabledOnLeftController) {
                    this._enableTeleportationOnController(webVRController);
                }
            }
            if (webVRController.hand === "right") {
                this._rightControllerReady = true;
                if (this._teleportationRequested && !this._teleportationEnabledOnRightController) {
                    this._enableTeleportationOnController(webVRController);
                }
            }
            if (this.onControllerMeshLoaded) {
                this.onControllerMeshLoaded.notifyObservers(webVRController);
            }
        }

        private _onFullscreenChange() {
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

        private isInVRMode() {
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

        private onVRDisplayChanged(eventArgs:IDisplayChangedEventArgs) {
            this._webVRsupported = eventArgs.vrSupported;
            this._webVRready = !!eventArgs.vrDisplay;
            this._webVRpresenting = eventArgs.vrDisplay && eventArgs.vrDisplay.isPresenting;

            this.updateButtonVisibility();
        }

        private updateButtonVisibility() {            
            if (!this._btnVR) {
                return;
            }
            this._btnVR.className = "babylonVRicon";
            if (this.isInVRMode()) {
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
            if (this._scene.activeCamera) {
                this._position = this._scene.activeCamera.position.clone();
            }

            if (this.onEnteringVR) {
                this.onEnteringVR.notifyObservers({});
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
            else {
                this._vrDeviceOrientationCamera.position = this._position;
                this._scene.activeCamera = this._vrDeviceOrientationCamera;
                this._scene.getEngine().switchFullscreen(true);
                this.updateButtonVisibility();
            }
            
            if (this._scene.activeCamera && this._canvas) {
                this._scene.activeCamera.attachControl(this._canvas);
            }
        }

        /**
         * Attempt to exit VR, or fullscreen.
         */
        public exitVR() {
            if (this.onExitingVR) {
                this.onExitingVR.notifyObservers({});
            }
            if (this._webVRpresenting) {
                this._scene.getEngine().disableVR();
            }
            if (this._scene.activeCamera) {
                this._position = this._scene.activeCamera.position.clone();
                
            }
            this._deviceOrientationCamera.position = this._position;
            this._scene.activeCamera = this._deviceOrientationCamera;

            if (this._canvas) {
                this._scene.activeCamera.attachControl(this._canvas);
            }

            this.updateButtonVisibility();  
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

        public enableTeleportation(vrTeleportationOptions: VRTeleportationOptions = {}) {
            this._teleportationRequested = true;

            if (vrTeleportationOptions) {
                if (vrTeleportationOptions.floorMeshName) {
                    this._floorMeshName = vrTeleportationOptions.floorMeshName;
                }
            }

            if (this._leftControllerReady && this._webVRCamera.leftController) {
                this._enableTeleportationOnController(this._webVRCamera.leftController)
            }
            if (this._rightControllerReady && this._webVRCamera.rightController) {
                this._enableTeleportationOnController(this._webVRCamera.rightController)
            }

            this._scene.gamepadManager.onGamepadConnectedObservable.add((pad) => this._onNewGamepadConnected(pad));

            // Creates an image processing post process for the vignette not relying
            // on the main scene configuration for image processing to reduce setup and spaces 
            // (gamma/linear) conflicts.
            const imageProcessingConfiguration = new ImageProcessingConfiguration();
            imageProcessingConfiguration.vignetteColor = new BABYLON.Color4(0, 0, 0, 0);
            imageProcessingConfiguration.vignetteEnabled = true;
            this._postProcessMove = new BABYLON.ImageProcessingPostProcess("postProcessMove", 
                1.0, 
                this._webVRCamera,
                undefined,
                undefined,
                undefined,
                undefined,
                imageProcessingConfiguration);
            
            this._webVRCamera.detachPostProcess(this._postProcessMove)

            this._passProcessMove = new BABYLON.PassPostProcess("pass", 1.0, this._webVRCamera);

            this._createGazeTracker();
            this._createTeleportationCircles();

            this.raySelectionPredicate = (mesh) => {
                return true;
            }

            this.meshSelectionPredicate = (mesh) => {
                return true;
            }

            this._raySelectionPredicate = (mesh) => {
                if (mesh.name.indexOf(this._floorMeshName) !== -1 || (mesh.isVisible && mesh.name.indexOf("gazeTracker") === -1 
                        && mesh.name.indexOf("teleportationCircle") === -1
                        && mesh.name.indexOf("torusTeleportation") === -1
                        && mesh.name.indexOf("laserPointer") === -1)) {
                    return this.raySelectionPredicate(mesh);
                }
                return false;
            }

            this._scene.registerBeforeRender(() => {
                this._castRayAndSelectObject();
            });
        }

        private _onNewGamepadConnected(gamepad: Gamepad) {
            if (gamepad.leftStick && gamepad.type !== BABYLON.Gamepad.POSE_ENABLED) {
                gamepad.onleftstickchanged((stickValues) => {
                    // Listening to classic/xbox gamepad only if no VR controller is active
                    if ((!this._leftLaserPointer && !this._rightLaserPointer) || 
                        ((this._leftLaserPointer && !this._leftLaserPointer.isVisible) && 
                        (this._rightLaserPointer && !this._rightLaserPointer.isVisible))) {
                        if (!this._teleportationRequestInitiated) {
                            if (stickValues.y < -this._padSensibilityUp) {
                                this._teleportationRequestInitiated = true;
                            }
                        }
                        else {
                            if (stickValues.y > -this._padSensibilityDown) {
                                if (this._teleportationAllowed) {
                                    this._teleportCamera();
                                }
                                this._teleportationRequestInitiated = false;
                            }
                        }
                    }
                });
            }
            if (gamepad.rightStick) {
                gamepad.onrightstickchanged((stickValues) => {
                    if (!this._rotationLeftAsked) {
                        if (stickValues.x < -this._padSensibilityUp) {
                            this._rotationLeftAsked = true;
                            if (this._rotationAllowed) {
                                this._rotateCamera(false);
                            }
                        }
                    }
                    else {
                        if (stickValues.x > -this._padSensibilityDown) {
                            this._rotationLeftAsked = false;
                        }
                    }
        
                    if (!this._rotationRightAsked) {
                        if (stickValues.x > this._padSensibilityUp) {
                            this._rotationRightAsked = true;
                            if (this._rotationAllowed) {
                                this._rotateCamera(true);
                            }
                        }
                    }
                    else {
                        if (stickValues.x < this._padSensibilityDown) {
                            this._rotationRightAsked = false;
                        }
                    }
                });
            }
        }

        private _enableTeleportationOnController(webVRController: WebVRController) {
            var controllerMesh = webVRController.mesh;
            if (controllerMesh) {
                var childMeshes = controllerMesh.getChildMeshes();

                for (var i = 0; i < childMeshes.length; i++) {
                    if (childMeshes[i].name === "POINTING_POSE") {
                        controllerMesh = childMeshes[i];
                        break;
                    }
                }
                var laserPointer = BABYLON.Mesh.CreateCylinder("laserPointer", 1, 0.004, 0.0002, 20, 1, this._scene, false);
                var laserPointerMaterial = new BABYLON.StandardMaterial("laserPointerMat", this._scene);
                laserPointerMaterial.emissiveColor = new BABYLON.Color3(0.7, 0.7, 0.7);
                laserPointerMaterial.alpha = 0.6;
                laserPointer.material = laserPointerMaterial;
                laserPointer.rotation.x = Math.PI / 2;
                laserPointer.parent = controllerMesh;
                laserPointer.position.z = -0.5;
                laserPointer.position.y = 0;
                laserPointer.isVisible = false;
                if (webVRController.hand === "left") {
                    this._leftLaserPointer = laserPointer;
                }
                else {
                    this._rightLaserPointer = laserPointer;
                }
                webVRController.onMainButtonStateChangedObservable.add((stateObject) => {
                    // Enabling / disabling laserPointer 
                    if (stateObject.value === 1) {
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
                webVRController.onPadValuesChangedObservable.add((stateObject) => {
                    if (!this._teleportationRequestInitiated) {
                        if (stateObject.y < -this._padSensibilityUp) {
                            // If laser pointer wasn't enabled yet
                            if (webVRController.hand === "left" &&  this._leftLaserPointer) {
                                this._leftLaserPointer.isVisible = true;
                                if (this._rightLaserPointer) {
                                    this._rightLaserPointer.isVisible = false;
                                }
                            }
                            else if (this._rightLaserPointer) {
                                this._rightLaserPointer.isVisible = true;
                                if (this._leftLaserPointer) {
                                    this._leftLaserPointer.isVisible = false;
                                }
                            }
                            this._teleportationRequestInitiated = true;
                        }
                    }
                    else {
                        // Listening to the proper controller values changes to confirm teleportation
                        if ((webVRController.hand === "left" && this._leftLaserPointer && this._leftLaserPointer.isVisible) 
                            || (webVRController.hand === "right" && this._rightLaserPointer && this._rightLaserPointer.isVisible)) {
                            if (stateObject.y > -this._padSensibilityDown) {
                                if (this._teleportationAllowed) {
                                    this._teleportationAllowed = false;
                                    this._teleportCamera();
                                }
                                this._teleportationRequestInitiated = false;
                            }
                        }
                    }
                    if (!this._rotationLeftAsked) {
                        if (stateObject.x < -this._padSensibilityUp) {
                            this._rotationLeftAsked = true;
                            if (this._rotationAllowed) {
                                this._rotateCamera(false);
                            }
                        }
                    }
                    else {
                        if (stateObject.x > -this._padSensibilityDown) {
                            this._rotationLeftAsked = false;
                        }
                    }
        
                    if (!this._rotationRightAsked) {
                        if (stateObject.x > this._padSensibilityUp) {
                            this._rotationRightAsked = true;
                            if (this._rotationAllowed) {
                                this._rotateCamera(true);
                            }
                        }
                    }
                    else {
                        if (stateObject.x < this._padSensibilityDown) {
                            this._rotationRightAsked = false;
                        }
                    }
                });
                webVRController.onTriggerStateChangedObservable.add((stateObject) => {
                    if (!this._pointerDownOnMeshAsked) {
                        if (stateObject.value > this._padSensibilityUp) {
                            this._pointerDownOnMeshAsked = true;
                            if (this._currentMeshSelected && this._currentHit) {
                                this._scene.simulatePointerDown(this._currentHit);
                            }
                        }
                    }
                    else if (stateObject.value < this._padSensibilityDown) {
                        if (this._currentMeshSelected && this._currentHit) {
                            this._scene.simulatePointerUp(this._currentHit);
                        }
                        this._pointerDownOnMeshAsked = false;
                    }
                });
            }
        }

        // Gaze support used to point to teleport or to interact with an object
        private _createGazeTracker() {
            this._gazeTracker = BABYLON.Mesh.CreateTorus("gazeTracker", 0.0035, 0.0025, 20, this._scene, false);
            this._gazeTracker.bakeCurrentTransformIntoVertices();
            this._gazeTracker.isPickable = false;

            var targetMat = new BABYLON.StandardMaterial("targetMat", this._scene);
            targetMat.specularColor = BABYLON.Color3.Black();
            targetMat.emissiveColor = new BABYLON.Color3(0.7, 0.7, 0.7)
            targetMat.backFaceCulling = false;
            this._gazeTracker.material = targetMat;
        }

        private _createTeleportationCircles() {
            this._teleportationCircle = BABYLON.Mesh.CreateGround("teleportationCircle", 2, 2, 2, this._scene);
            this._teleportationCircle.isPickable = false;
            
            var length = 512;
            var dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", length, this._scene, true);
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
            
            var teleportationCircleMaterial = new BABYLON.StandardMaterial("TextPlaneMaterial", this._scene);
            teleportationCircleMaterial.diffuseTexture = dynamicTexture;
            this._teleportationCircle.material = teleportationCircleMaterial;
            
            var torus = BABYLON.Mesh.CreateTorus("torusTeleportation", 0.75, 0.1, 25, this._scene, false);
            torus.isPickable = false;
            torus.parent = this._teleportationCircle;
            
            var animationInnerCircle = new BABYLON.Animation("animationInnerCircle", "position.y", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
        
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
        
            var easingFunction = new BABYLON.SineEase();
            easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
            animationInnerCircle.setEasingFunction(easingFunction);
        
            torus.animations = [];
            torus.animations.push(animationInnerCircle);
        
            this._scene.beginAnimation(torus, 0, 60, true);
            
            this._hideTeleportationCircle();
        }

        private _displayTeleportationCircle() {
            this._teleportationCircle.isVisible = true;
            (<Mesh>this._teleportationCircle.getChildren()[0]).isVisible = true;
        }
        
        private _hideTeleportationCircle() {
            this._teleportationCircle.isVisible = false;
            (<Mesh>this._teleportationCircle.getChildren()[0]).isVisible = false;
        }

        private _rotateCamera(right: boolean) {
            if (right) {
                this._rotationAngle++;
            }
            else {
                this._rotationAngle--;
            }
        
            this.currentVRCamera.animations = [];
         
            var target = BABYLON.Quaternion.FromRotationMatrix(BABYLON.Matrix.RotationY(Math.PI / 4 * this._rotationAngle));
        
            var animationRotation = new BABYLON.Animation("animationRotation", "rotationQuaternion", 90, BABYLON.Animation.ANIMATIONTYPE_QUATERNION,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
            
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
        
            var easingFunction = new BABYLON.CircleEase();
            easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
            animationRotation.setEasingFunction(easingFunction);
        
            this.currentVRCamera.animations.push(animationRotation);
        
            this._postProcessMove.animations = [];
        
            var animationPP = new BABYLON.Animation("animationPP", "vignetteWeight", 90, BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        
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
            animationPP.setEasingFunction(easingFunction);
            this._postProcessMove.animations.push(animationPP);
        
            var animationPP2 = new BABYLON.Animation("animationPP2", "vignetteStretch", 90, BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        
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
            animationPP2.setEasingFunction(easingFunction);
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
                    this._displayTeleportationCircle();
                }
                else {
                    this._hideTeleportationCircle();
                }
                this._haloCenter.copyFrom(hit.pickedPoint);
                this._teleportationCircle.position.copyFrom(hit.pickedPoint);
                var pickNormal = hit.getNormal();
                if (pickNormal) {
                    var axis1 = BABYLON.Vector3.Cross(BABYLON.Axis.Y, pickNormal);
                    var axis2 = BABYLON.Vector3.Cross(pickNormal, axis1);
                    BABYLON.Vector3.RotationFromAxisToRef(axis2, pickNormal, axis1, this._teleportationCircle.rotation);
                }
                this._teleportationCircle.position.y += 0.1;
            }
        }

        // webVRCamera.devicePosition is not the actual offset from webVRCamera.position so this function computes
        // the actual global offset. Left eye is used instead of center to avoid additional computation on each call.
        private _updateHmdOffsetFromPosition(){
            if(this.webVRCamera.leftCamera){
                this._hmdOffsetFromPosition.copyFrom(this.webVRCamera.leftCamera.globalPosition).subtractInPlace(this.webVRCamera.position);
            }else{
                this._hmdOffsetFromPosition.copyFrom(this.webVRCamera.devicePosition);
            }
        }

        private _teleportCamera() {
            this.currentVRCamera.animations = [];
            this._updateHmdOffsetFromPosition();
        
            var animationCameraTeleportationX = new BABYLON.Animation("animationCameraTeleportationX", "position.x", 90, BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        
            var animationCameraTeleportationXKeys = [];
            animationCameraTeleportationXKeys.push({
                frame: 0,
                value: this.currentVRCamera.position.x
            });
            animationCameraTeleportationXKeys.push({
                frame: 11,
                value: this._haloCenter.x-this._hmdOffsetFromPosition.x
            });
        
            var easingFunction = new BABYLON.CircleEase();
            easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);

            animationCameraTeleportationX.setKeys(animationCameraTeleportationXKeys);
            animationCameraTeleportationX.setEasingFunction(easingFunction);
            this.currentVRCamera.animations.push(animationCameraTeleportationX);

            var animationCameraTeleportationY = new BABYLON.Animation("animationCameraTeleportationY", "position.y", 90, BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
    
            var animationCameraTeleportationYKeys = [];
            animationCameraTeleportationYKeys.push({
                frame: 0,
                value: this.currentVRCamera.position.y
            });
            animationCameraTeleportationYKeys.push({
                frame: 11,
                value: this._haloCenter.y+1.7
            });
        
            animationCameraTeleportationY.setKeys(animationCameraTeleportationYKeys);
            animationCameraTeleportationY.setEasingFunction(easingFunction);
            this.currentVRCamera.animations.push(animationCameraTeleportationY);
        
            var animationCameraTeleportationZ = new BABYLON.Animation("animationCameraTeleportationZ", "position.z", 90, BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        
            var animationCameraTeleportationZKeys = [];
            animationCameraTeleportationZKeys.push({
                frame: 0,
                value: this.currentVRCamera.position.z
            });
            animationCameraTeleportationZKeys.push({
                frame: 11,
                value: this._haloCenter.z-this._hmdOffsetFromPosition.z
            });
        
            animationCameraTeleportationZ.setKeys(animationCameraTeleportationZKeys);
            animationCameraTeleportationZ.setEasingFunction(easingFunction);
            this.currentVRCamera.animations.push(animationCameraTeleportationZ);
        
            this._postProcessMove.animations = [];
        
            var animationPP = new BABYLON.Animation("animationPP", "vignetteWeight", 90, BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        
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
        
            var animationPP2 = new BABYLON.Animation("animationPP2", "vignetteStretch", 90, BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
        
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
        
            this._postProcessMove.imageProcessingConfiguration.vignetteWeight = 8;
            this._postProcessMove.imageProcessingConfiguration.vignetteStretch = 10;
            
            this._webVRCamera.attachPostProcess(this._postProcessMove)
            this._scene.beginAnimation(this._postProcessMove, 0, 11, false, 1, () => {
                this._webVRCamera.detachPostProcess(this._postProcessMove)
            });
            this._scene.beginAnimation(this.currentVRCamera, 0, 11, false, 1);
        }

        private _castRayAndSelectObject () {
            var ray;
            if ((!(<WebVRFreeCamera>this.currentVRCamera).rightController && !(<WebVRFreeCamera>this.currentVRCamera).leftController) || 
                (this._leftLaserPointer && !this._leftLaserPointer.isVisible && !this._rightLaserPointer) || 
                (this._rightLaserPointer && !this._rightLaserPointer.isVisible && !this._leftLaserPointer) || 
                (this._rightLaserPointer && this._leftLaserPointer && !this._rightLaserPointer.isVisible && !this._leftLaserPointer.isVisible)) {
                    ray = this.currentVRCamera.getForwardRay(this._rayLength);
                
            } else {
                if (this._leftLaserPointer && this._leftLaserPointer.isVisible) {
                    ray = (<any>this.currentVRCamera).leftController.getForwardRay(this._rayLength);
                }
                else {
                    ray = (<any>this.currentVRCamera).rightController.getForwardRay(this._rayLength);
                }
            }
        
            var hit = this._scene.pickWithRay(ray, this._raySelectionPredicate);

            // Moving the gazeTracker on the mesh face targetted
            if (hit && hit.pickedPoint) {
                var multiplier = 1;
                if (this._isActionableMesh) {
                    multiplier = 3;
                }
                this._gazeTracker.scaling.x = hit.distance * multiplier;
                this._gazeTracker.scaling.y = hit.distance * multiplier;
                this._gazeTracker.scaling.z = hit.distance * multiplier;
        
                var pickNormal = hit.getNormal();
                // To avoid z-fighting
                var deltaFighting = 0.002;
                
                if (pickNormal) {
                    var axis1 = BABYLON.Vector3.Cross(BABYLON.Axis.Y, pickNormal);
                    var axis2 = BABYLON.Vector3.Cross(pickNormal, axis1);
                    BABYLON.Vector3.RotationFromAxisToRef(axis2, pickNormal, axis1, this._gazeTracker.rotation);
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
        
            if (hit && hit.pickedMesh) {
                this._currentHit = hit;
                // The object selected is the floor, we're in a teleportation scenario
                if (hit.pickedMesh.name.indexOf(this._floorMeshName) !== -1 && hit.pickedPoint) {
                    // Moving the teleportation area to this targetted point
                    this._moveTeleportationSelectorTo(hit)
                    return;
                }
                // If not, we're in a selection scenario
                this._hideTeleportationCircle();
                this._teleportationAllowed = false;
                if (hit.pickedMesh !== this._currentMeshSelected) {
                    if (this.meshSelectionPredicate(hit.pickedMesh)) {
                        this._currentMeshSelected = hit.pickedMesh;
                        if (hit.pickedMesh.isPickable && hit.pickedMesh.actionManager) {
                            this.changeGazeColor(new BABYLON.Color3(0,0,1));
                            this.changeLaserColor(new BABYLON.Color3(0.2,0.2,1));
                            this._isActionableMesh = true;
                        }
                        else {
                            this.changeGazeColor(new BABYLON.Color3(0.7,0.7,0.7));
                            this.changeLaserColor(new BABYLON.Color3(0.7,0.7,0.7));
                            this._isActionableMesh = false;
                        }
                        this.onNewMeshSelected.notifyObservers(this._currentMeshSelected);
                    }
                    else {
                        this._currentMeshSelected = null;
                        this.changeGazeColor(new BABYLON.Color3(0.7,0.7,0.7));
                        this.changeLaserColor(new BABYLON.Color3(0.7,0.7,0.7));
                    }
                }
            }
            else {
                this._currentHit = null;
                this._currentMeshSelected = null;
                this._teleportationAllowed = false;
                this._hideTeleportationCircle();
                this.changeGazeColor(new BABYLON.Color3(0.7,0.7,0.7));
                this.changeLaserColor(new BABYLON.Color3(0.7,0.7,0.7));
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
            if (this.isInVRMode()) {
                this.exitVR();
            }
            this._deviceOrientationCamera.dispose();

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
            if (!this._useCustomVRButton) {
                document.body.removeChild(this._btnVR);
            }

            document.removeEventListener("keydown", this._onKeyDown);
            window.removeEventListener('vrdisplaypresentchange', this._onVrDisplayPresentChange);
        }

        public getClassName(): string {
            return "VRExperienceHelper";
        }
    }
}
