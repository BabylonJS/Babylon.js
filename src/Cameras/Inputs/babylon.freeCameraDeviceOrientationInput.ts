module BABYLON {
    export class FreeCameraDeviceOrientationInput implements ICameraInput<FreeCamera> {
        private _camera: FreeCamera;

        private _screenOrientationAngle: number = 0;

        private _constantTranform: Quaternion;
        private _screenQuaternion: Quaternion = new Quaternion();

        private _alpha: number = 0;
        private _beta: number = 0;
        private _gamma: number = 0;

        constructor() {
            this._constantTranform = new Quaternion(- Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
            this._orientationChanged();
        }

        public get camera(): FreeCamera {
            return this._camera;
        }

        public set camera(camera: FreeCamera) {
            this._camera = camera;
            if (!this._camera.rotationQuaternion) this._camera.rotationQuaternion = new Quaternion();
        }

        attachControl(element: HTMLElement, noPreventDefault?: boolean) {
            window.addEventListener("orientationchange", this._orientationChanged);
            window.addEventListener("deviceorientation", this._deviceOrientation);
            //In certain cases, the attach control is called AFTER orientation was changed,
            //So this is needed.
            this._orientationChanged();
        }

        private _orientationChanged = () => {
            this._screenOrientationAngle = (window.orientation !== undefined ? +window.orientation : (window.screen.orientation && window.screen.orientation['angle'] ? (<any>window.screen.orientation).angle : 0));
            this._screenOrientationAngle = -Tools.ToRadians(this._screenOrientationAngle / 2);
            this._screenQuaternion.copyFromFloats(0, Math.sin(this._screenOrientationAngle), 0, Math.cos(this._screenOrientationAngle));
        }

        private _deviceOrientation = (evt: DeviceOrientationEvent) => {
            this._alpha = evt.alpha;
            this._beta = evt.beta;
            this._gamma = evt.gamma;
        }

        detachControl(element: HTMLElement) {
            window.removeEventListener("orientationchange", this._orientationChanged);
            window.removeEventListener("deviceorientation", this._deviceOrientation);
        }

        public checkInputs() {
            //if no device orientation provided, don't update the rotation.
            //Only testing against alpha under the assumption thatnorientation will never be so exact when set.
            if(!this._alpha) return;
            Quaternion.RotationYawPitchRollToRef(BABYLON.Tools.ToRadians(this._alpha), BABYLON.Tools.ToRadians(this._beta), -BABYLON.Tools.ToRadians(this._gamma), this.camera.rotationQuaternion)
            this._camera.rotationQuaternion.multiplyInPlace(this._screenQuaternion);
            this._camera.rotationQuaternion.multiplyInPlace(this._constantTranform);
            //Mirror on XY Plane
            this._camera.rotationQuaternion.z *= -1;
            this._camera.rotationQuaternion.w *= -1;
        }

        getTypeName(): string {
            return "FreeCameraDeviceOrientationInput";
        }

        getSimpleName() {
            return "deviceOrientation";
        }
    }

    CameraInputTypes["FreeCameraDeviceOrientationInput"] = FreeCameraDeviceOrientationInput;
}