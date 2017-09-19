module BABYLON {
    export class VRExperienceHelper {
        private _scene: BABYLON.Scene;
        private _position;
        private _btnVR: HTMLButtonElement;
        private _webVRsupported = false;
        private _canvas: HTMLCanvasElement;
        private _isInVRMode = false;
        private _webVRCamera: WebVRFreeCamera;
        private _vrDisplay = null;
        private _vrDeviceOrientationCamera: VRDeviceOrientationFreeCamera;
        private _deviceOrientationCamera: DeviceOrientationCamera;
        
        private onVrDisplayConnectDelegate: any;
        private onVrDisplayDisconnectDelegate: any;
        private onVrDisplayPresentChangeDelegate: any;
        private onFullScreenChangeDelegate: any;
        
        constructor(scene: Scene, private webVROptions: WebVROptions = {}) {
            this._scene = scene;

            if (!this._scene.activeCamera) {
                this._deviceOrientationCamera = new BABYLON.DeviceOrientationCamera("deviceOrientationVRHelper", new BABYLON.Vector3(0, 2, 0), scene);
            }
            else {
                this._deviceOrientationCamera = new BABYLON.DeviceOrientationCamera("deviceOrientationVRHelper", this._scene.activeCamera.position, scene);
                if ((<FreeCamera>scene.activeCamera).rotation) {
                    this._deviceOrientationCamera.rotation = (<FreeCamera>scene.activeCamera).rotation.clone();
                }
                this._deviceOrientationCamera.minZ = this._scene.activeCamera.minZ;
                this._deviceOrientationCamera.maxZ = this._scene.activeCamera.maxZ;
            }
            this._scene.activeCamera = this._deviceOrientationCamera;
            this._position = this._scene.activeCamera.position;
            this._canvas = scene.getEngine().getRenderingCanvas();
            this._scene.activeCamera.attachControl(this._canvas);

            this._btnVR = <HTMLButtonElement>document.createElement("BUTTON");
            this._btnVR.className = "babylonVRicon";
            this._btnVR.id = "babylonVRiconbtn";
            this._btnVR.title = "Click to switch to VR";
            var css = ".babylonVRicon { position: absolute; right: 20px; height: 50px; width: 80px; background-color: rgba(51,51,51,0.7); background-image: url(data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%222048%22%20height%3D%221152%22%20viewBox%3D%220%200%202048%201152%22%20version%3D%221.1%22%3E%3Cpath%20transform%3D%22rotate%28180%201024%2C576.0000000000001%29%22%20d%3D%22m1109%2C896q17%2C0%2030%2C-12t13%2C-30t-12.5%2C-30.5t-30.5%2C-12.5l-170%2C0q-18%2C0%20-30.5%2C12.5t-12.5%2C30.5t13%2C30t30%2C12l170%2C0zm-85%2C256q59%2C0%20132.5%2C-1.5t154.5%2C-5.5t164.5%2C-11.5t163%2C-20t150%2C-30t124.5%2C-41.5q23%2C-11%2042%2C-24t38%2C-30q27%2C-25%2041%2C-61.5t14%2C-72.5l0%2C-257q0%2C-123%20-47%2C-232t-128%2C-190t-190%2C-128t-232%2C-47l-81%2C0q-37%2C0%20-68.5%2C14t-60.5%2C34.5t-55.5%2C45t-53%2C45t-53%2C34.5t-55.5%2C14t-55.5%2C-14t-53%2C-34.5t-53%2C-45t-55.5%2C-45t-60.5%2C-34.5t-68.5%2C-14l-81%2C0q-123%2C0%20-232%2C47t-190%2C128t-128%2C190t-47%2C232l0%2C257q0%2C68%2038%2C115t97%2C73q54%2C24%20124.5%2C41.5t150%2C30t163%2C20t164.5%2C11.5t154.5%2C5.5t132.5%2C1.5zm939%2C-298q0%2C39%20-24.5%2C67t-58.5%2C42q-54%2C23%20-122%2C39.5t-143.5%2C28t-155.5%2C19t-157%2C11t-148.5%2C5t-129.5%2C1.5q-59%2C0%20-130%2C-1.5t-148%2C-5t-157%2C-11t-155.5%2C-19t-143.5%2C-28t-122%2C-39.5q-34%2C-14%20-58.5%2C-42t-24.5%2C-67l0%2C-257q0%2C-106%2040.5%2C-199t110%2C-162.5t162.5%2C-109.5t199%2C-40l81%2C0q27%2C0%2052%2C14t50%2C34.5t51%2C44.5t55.5%2C44.5t63.5%2C34.5t74%2C14t74%2C-14t63.5%2C-34.5t55.5%2C-44.5t51%2C-44.5t50%2C-34.5t52%2C-14l14%2C0q37%2C0%2070%2C0.5t64.5%2C4.5t63.5%2C12t68%2C23q71%2C30%20128.5%2C78.5t98.5%2C110t63.5%2C133.5t22.5%2C149l0%2C257z%22%20fill%3D%22white%22%20/%3E%3C/svg%3E%0A); background-size: 80%; background-repeat:no-repeat; background-position: center; border: none; outline: none; transition: transform 0.125s ease-out } .babylonVRicon:hover { transform: scale(1.05) } .babylonVRicon:active {background-color: rgba(51,51,51,1) } .babylonVRicon:focus {background-color: rgba(51,51,51,1) }";
            css += ".babylonVRicon.vrdisplayconnected { border: 4px solid #0F0; }";

            var style = document.createElement('style');
            style.appendChild(document.createTextNode(css));
            document.getElementsByTagName('head')[0].appendChild(style);  

            this._btnVR.style.top = this._canvas.offsetTop + this._canvas.offsetHeight - 70 + "px";
            this._btnVR.style.left = this._canvas.offsetLeft + this._canvas.offsetWidth - 100 + "px";
            this._btnVR.addEventListener("click", () => {
                this.enterVR();
            });

            window.addEventListener("resize", () => {
                this._btnVR.style.top = this._canvas.offsetTop + this._canvas.offsetHeight - 70 + "px";
                this._btnVR.style.left = this._canvas.offsetLeft + this._canvas.offsetWidth - 100 + "px";
            });
            
            document.body.appendChild(this._btnVR);

            // Exiting VR mode using 'ESC' key on desktop
            document.addEventListener("keydown", (event) => {
                if (event.keyCode === 27 && this._isInVRMode) {
                    this.exitVR();
                }
            });

            // Exiting VR mode double tapping the touch screen
            this._scene.onPrePointerObservable.add( (pointerInfo, eventState) => {
                if (this._isInVRMode) {
                    this.exitVR();
                }
            }, BABYLON.PointerEventTypes.POINTERDOUBLETAP, false);
            
            this._vrDeviceOrientationCamera = new BABYLON.VRDeviceOrientationFreeCamera("VRDeviceOrientationVRHelper", this._position, this._scene);
            this._webVRCamera = null;

            this.onVrDisplayConnectDelegate = (display) => { this.gotVRDisplays([display]); };
            this.onVrDisplayDisconnectDelegate = () => { this.gotVRDisplays([]); };
            this.onVrDisplayPresentChangeDelegate = () => { this.onVrDisplayPresentChange(); };
            this.onFullScreenChangeDelegate = () => { this.onFullScreenChange(); };
            window.addEventListener('vrdisplayconnect', this.onVrDisplayConnectDelegate);
            window.addEventListener('vrdisplaydisconnect', this.onVrDisplayDisconnectDelegate);
            window.addEventListener('vrdisplaypresentchange', this.onVrDisplayPresentChangeDelegate);
            document.addEventListener('fullscreenchange', this.onFullScreenChangeDelegate);
            this.detectVR();
        }

        private onVrDisplayPresentChange() {
            if (this._vrDisplay) {
                // A VR display is connected
                this._isInVRMode = this._vrDisplay.isPresenting;
            } else {
                Tools.Warn('Detected VRDisplayPresentChange on an unknown VRDisplay. Did you can enterVR on the vrExperienceHelper?');
            }
        }

        private onFullScreenChange() {            
            this._isInVRMode = document.fullscreen;
        }

        private gotVRDisplays(displays) {
            this._webVRsupported = true;
            if (displays.length > 0) {
                this._webVRCamera = this._webVRCamera || new BABYLON.WebVRFreeCamera("WebVRHelper", this._position, this._scene);
                this._vrDisplay = displays[0];
            }
            else if (this._webVRCamera) {
                this._webVRCamera.dispose();
                this._webVRCamera = null;                           
                this._vrDisplay = null;
            }                    
            this.updateButtonVisibility();
        }

        private detectVR() {
            
            if (navigator.getVRDisplays) {
                var gotVRDisplays = (displays) => this.gotVRDisplays(displays);
                navigator.getVRDisplays().then(gotVRDisplays).catch((error) => {
                    this._webVRsupported = false;
                    Tools.Warn(error || 'getVRDisplays rejected; system not capable of WebVR.');

                    this.updateButtonVisibility();
                });
            }
            else {
                this._webVRsupported = false;
                this._vrDeviceOrientationCamera = new BABYLON.VRDeviceOrientationFreeCamera("VRDeviceOrientationVRHelper", this._position, this._scene);
                document.body.appendChild(this._btnVR); 

                this.updateButtonVisibility();
            }
        }

        private updateButtonVisibility() {            
            if (!this._btnVR) {
                return;
            }
            if (this._isInVRMode) {
                this._btnVR.style.display = "none";
            } else {
                this._btnVR.style.display = "";
                this._btnVR.className = "babylonVRicon" + (this._vrDisplay ? " vrdisplayconnected" : "");
            }
        }

        /**
         * Attempt to enter VR. If a headset is connected and ready, will request present on that.
         * Otherwise, will use the fullscreen API.
         */
        public enterVR() {
            // If WebVR is supported and a headset is connected
            if (this._webVRsupported && this._webVRCamera) {
                this._webVRCamera.position = this._position;
                this._scene.activeCamera = this._webVRCamera;
            }
            else {
                this._vrDeviceOrientationCamera.position = this._position;
                this._scene.activeCamera = this._vrDeviceOrientationCamera;
                this._scene.getEngine().switchFullscreen(true);
            }
            this._scene.activeCamera.attachControl(this._canvas);
        }

        /**
         * Attempt to exit VR, or fullscreen.
         */
        public exitVR() {
            if (this._webVRsupported) {
                this._scene.getEngine().disableVR();
            }
            if (this._scene.activeCamera) {
                this._position = this._scene.activeCamera.position;
            }
            this._deviceOrientationCamera.position = this._position;
            this._scene.activeCamera = this._deviceOrientationCamera;
            this._scene.activeCamera.attachControl(this._canvas);
            this._isInVRMode = false;
        }

        public get position(): Vector3 {
            return this._position;
        }

        public set position(value: Vector3) {
            this._position = value;
            this._scene.activeCamera.position = value;
        }

        public dispose() {
            if (this._isInVRMode) {
                this.exitVR();
            }
            this._deviceOrientationCamera.dispose();
            if (this._webVRCamera) {
                this._webVRCamera.dispose();
            }
            if (this._vrDeviceOrientationCamera) {
                this._vrDeviceOrientationCamera.dispose();
            }
            document.body.removeChild(this._btnVR);

            window.removeEventListener('vrdisplayconnect', this.onVrDisplayConnectDelegate);
            window.removeEventListener('vrdisplaydisconnect', this.onVrDisplayDisconnectDelegate);
            window.removeEventListener('vrdisplaypresentchange', this.onVrDisplayPresentChangeDelegate);
            document.removeEventListener('fullscreenchange', this.onFullScreenChangeDelegate);

            // TODO: Remove other event listeners on window and document.
        }

        public getClassName(): string {
            return "VRExperienceHelper";
        }
    }
}
