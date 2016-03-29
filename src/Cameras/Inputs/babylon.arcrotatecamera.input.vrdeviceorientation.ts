module BABYLON {
    export class ArcRotateCameraVRDeviceOrientationInput implements ICameraInput<ArcRotateCamera> {
        camera: ArcRotateCamera;

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

        attachControl(element: HTMLElement, noPreventDefault?: boolean) {
            this.camera.attachControl(element, noPreventDefault);
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
            if (this._dirty) {
                this._dirty = false;

                if (this._gamma < 0) {
                    this._gamma = 180 + this._gamma;
                }

                this.camera.alpha = (-this._alpha / 180.0 * Math.PI) % Math.PI * 2;
                this.camera.beta = (this._gamma / 180.0 * Math.PI);
            }
        }

        detachControl(element: HTMLElement) {
            window.removeEventListener("deviceorientation", this._deviceOrientationHandler);
        }

        getTypeName(): string {
            return "ArcRotateCameraVRDeviceOrientationInput";
        }

        getSimpleName() {
            return "VRDeviceOrientation";
        }
    }

    CameraInputTypes["ArcRotateCameraVRDeviceOrientationInput"] = ArcRotateCameraVRDeviceOrientationInput;
}
