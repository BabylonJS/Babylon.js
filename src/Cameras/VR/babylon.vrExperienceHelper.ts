module BABYLON {
    export class VRExperienceHelper {
        private _scene: BABYLON.Scene;
        private _position;
        private _btnVR: HTMLButtonElement;
        private _webVRsupportedAndReady = false;
        private _canvas: HTMLCanvasElement;
        
        constructor(scene: Scene, private webVROptions: WebVROptions = {}) {
            this._scene = scene;

            if (!this._scene.activeCamera) {
                this._scene.activeCamera = new BABYLON.DeviceOrientationCamera("deviceOrientationVRHelper", new BABYLON.Vector3(0, 2, 0), scene);
            }
            else {
                var newCamera = new BABYLON.DeviceOrientationCamera("deviceOrientationVRHelper", this._scene.activeCamera.position, scene);
                if ((<FreeCamera>scene.activeCamera).rotation) {
                    newCamera.rotation = (<FreeCamera>scene.activeCamera).rotation.clone();
                }
                this._scene.activeCamera = newCamera;
            }
            this._position = this._scene.activeCamera.position;
            this._canvas = scene.getEngine().getRenderingCanvas();
            this._scene.activeCamera.attachControl(this._canvas);

            this._btnVR = <HTMLButtonElement>document.createElement("BUTTON");
            this._btnVR.className = "babylonVRicon";
            this._btnVR.id = "babylonVRiconbtn";
            this._btnVR.title = "Click to switch to VR";
            var css = ".babylonVRicon { position: absolute; right: 20px; height: 50px; width: 80px; background-color: rgba(230,230,230,0.6); background-image: url('data:image/png;base64,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'); background-size: 80%; background-repeat:no-repeat; background-position: center; border: none; outline: none; transition: transform 0.125s ease-out } .babylonVRicon:hover { transform: scale(1.05) } .babylonVRicon:active {background-color: rgba(230,230,230,1) } .babylonVRicon:focus {background-color: rgba(230,230,230,1) }";
            
            var style = document.createElement('style');
            style.appendChild(document.createTextNode(css));
            document.getElementsByTagName('head')[0].appendChild(style);  

            this._btnVR.style.top = this._canvas.offsetTop + this._canvas.offsetHeight - 70 + "px";
            this._btnVR.style.left = this._canvas.offsetLeft + this._canvas.offsetWidth - 100 + "px";

            window.addEventListener("resize", () => {
                this._btnVR.style.top = this._canvas.offsetTop + this._canvas.offsetHeight - 70 + "px";
                this._btnVR.style.left = this._canvas.offsetLeft + this._canvas.offsetWidth - 100 + "px";
            });

            if (navigator.getVRDisplays) {
                navigator.getVRDisplays().then((headsets) => {
                    if (headsets.length > 0) {
                        scene.getEngine().initWebVR();
                        this._webVRsupportedAndReady = true;
                    }
                    document.body.appendChild(this._btnVR); 
                });
            }
            else {
                document.body.appendChild(this._btnVR); 
            }

            this._btnVR.addEventListener("click", () => {
                this.enterVR();
            });
        }

        public enterVR() {
            // If WebVR is supported and a headset is connected
            if (this._webVRsupportedAndReady) {
                this._scene.activeCamera = new BABYLON.WebVRFreeCamera("WebVRHelper", this._position, this._scene);
            }
            else {
                this._scene.activeCamera = new BABYLON.VRDeviceOrientationFreeCamera("VRDeviceOrientationVRHelper", this._position, this._scene); 
            }
            this._scene.activeCamera.attachControl(this._canvas);
        }

        public get position(): Vector3 {
            return this._position;
        }

        public set position(value: Vector3) {
            this._position = value;
            this._scene.activeCamera.position = value;
        }

        public getClassName(): string {
            return "VRExperienceHelper";
        }
    }
}
