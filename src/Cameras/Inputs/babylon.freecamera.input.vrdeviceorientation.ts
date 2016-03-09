module BABYLON {
    export class FreeCameraVRDeviceOrientationInput implements ICameraInput<FreeCamera> {
        camera: FreeCamera;

        public _alpha = 0;
        public _beta = 0;
        public _gamma = 0;
    
        private _offsetOrientation: { yaw: number; pitch: number; roll: number };
        private _deviceOrientationHandler;
        
        constructor() {
            this._deviceOrientationHandler = this._onOrientationEvent.bind(this);
        }

        attachCamera(camera: FreeCamera) {
            this.camera = camera;

            window.addEventListener("deviceorientation", this._deviceOrientationHandler);
        }

        public _onOrientationEvent(evt: DeviceOrientationEvent): void {
            var camera = this.camera;
            this._alpha = +evt.alpha|0;
            this._beta = +evt.beta|0;
            this._gamma = +evt.gamma|0;

            if (this._gamma < 0) {
                this._gamma = 90 + this._gamma;
            }
            else {
                // Incline it in the correct angle.
                this._gamma = 270 - this._gamma;
            }

            camera.rotation.x = this._gamma / 180.0 * Math.PI;   
            camera.rotation.y = -this._alpha / 180.0 * Math.PI;   
            camera.rotation.z = this._beta / 180.0 * Math.PI;     
        }

        detach() {
            window.removeEventListener("deviceorientation", this._deviceOrientationHandler);
        }

        getTypeName(): string {
            return "FreeCameraVRDeviceOrientationInput";
        }
        
        getSimpleName(){
            return "VRDeviceOrientation";
        }
    }
    
    CameraInputTypes["FreeCameraVRDeviceOrientationInput"] = FreeCameraVRDeviceOrientationInput;
}