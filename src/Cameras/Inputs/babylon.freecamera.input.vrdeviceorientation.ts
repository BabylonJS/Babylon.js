module BABYLON {
    export class FreeCameraVRDeviceOrientationInput implements ICameraInput<FreeCamera> {
        camera: FreeCamera;

        public alphaCorrection = 1;
        public betaCorrection = 1;
        public gammaCorrection = 1;

        private _alpha = 0;
        private _beta = 0;
        private _gamma = 0;
        private _dirty = false;
    
        private _offsetOrientation: { yaw: number; pitch: number; roll: number };
        private _deviceOrientationHandler;
        
        constructor() {
            this._deviceOrientationHandler = this._onOrientationEvent.bind(this);
        }

        attachControl(element : HTMLElement, noPreventDefault?: boolean) {
            window.addEventListener("deviceorientation", this._deviceOrientationHandler);
        }

        public _onOrientationEvent(evt: DeviceOrientationEvent): void {
            var camera = this.camera;
            this._alpha = +evt.alpha | 0;
            this._beta = +evt.beta | 0;
            this._gamma = +evt.gamma | 0;
            this._dirty = true;
        }

        public checkInputs() {
            if (this._dirty){
                this._dirty = false;
                var rotationX = this._gamma;
                if (rotationX < 0) {
                    rotationX = 90 + rotationX;
                }
                else {
                    // Incline it in the correct angle.
                    rotationX = 270 - rotationX;
                }
                
                var rotationZ = this._beta;
                if (this._gamma < 0) {
                    // Correct Z rotation when looking down towards ground.
                    rotationZ = -rotationZ;
                }

                this.camera.rotation.x = this.gammaCorrection * rotationX / 180.0 * Math.PI;
                this.camera.rotation.y = this.alphaCorrection * -this._alpha / 180.0 * Math.PI;
                this.camera.rotation.z = this.betaCorrection * rotationZ / 180.0 * Math.PI;
            }
        }              

        detachControl(element : HTMLElement) {
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