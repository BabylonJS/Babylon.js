module BABYLON {
    export class VRDeviceOrientationFreeCamera extends FreeCamera {
        public _alpha = 0;
        public _beta = 0;
        public _gamma = 0;
    
        private _offsetOrientation: { yaw: number; pitch: number; roll: number };
        private _deviceOrientationHandler;

        constructor(name: string, position: Vector3, scene: Scene, compensateDistortion = true) {
            super(name, position, scene);

            var metrics = VRCameraMetrics.GetDefault();
            metrics.compensateDistortion = compensateDistortion;
            this.setCameraRigMode(Camera.RIG_MODE_VR, { vrCameraMetrics: metrics });

            this._deviceOrientationHandler = this._onOrientationEvent.bind(this);
        }

        public _onOrientationEvent(evt: DeviceOrientationEvent): void {
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

            this.rotation.x = this._gamma / 180.0 * Math.PI;   
            this.rotation.y = -this._alpha / 180.0 * Math.PI;   
            this.rotation.z = this._beta / 180.0 * Math.PI;     
        }

        public attachControl(element: HTMLElement, noPreventDefault?: boolean): void {
            super.attachControl(element, noPreventDefault);

            window.addEventListener("deviceorientation", this._deviceOrientationHandler);
        }

        public detachControl(element: HTMLElement): void {
            super.detachControl(element);

            window.removeEventListener("deviceorientation", this._deviceOrientationHandler);
        }

        public getTypeName(): string {
            return "VRDeviceOrientationFreeCamera";
        }
    }
}