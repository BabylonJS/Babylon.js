module BABYLON {
    export class FreeCameraDeviceOrientationInput implements ICameraInput<FreeCamera> {
        camera: FreeCamera;

        private _offsetX: number = null;
        private _offsetY: number = null;
        private _orientationGamma: number = 0;
        private _orientationBeta: number = 0;
        private _initialOrientationGamma: number = 0;
        private _initialOrientationBeta: number = 0;
        private _orientationChanged: (e: DeviceOrientationEvent) => any;
        private _resetOrientationGamma: () => any;

        @serialize()
        public angularSensibility: number = 10000.0;

        @serialize()
        public moveSensibility: number = 50.0;

        constructor() {
            this._resetOrientationGamma = this.resetOrientationGamma.bind(this);
            this._orientationChanged = this.orientationChanged.bind(this);
        }

        attachCamera(camera: FreeCamera) {
            this.camera = camera;

            window.addEventListener("resize", this._resetOrientationGamma, false);
            window.addEventListener("deviceorientation", this._orientationChanged);
        }

        resetOrientationGamma() {
            this._initialOrientationGamma = null;
        }

        orientationChanged(evt) {
            if (!this._initialOrientationGamma) {
                this._initialOrientationGamma = evt.gamma;
                this._initialOrientationBeta = evt.beta;
            }

            this._orientationGamma = evt.gamma;
            this._orientationBeta = evt.beta;

            this._offsetY = (this._initialOrientationBeta - this._orientationBeta);
            this._offsetX = (this._initialOrientationGamma - this._orientationGamma);
        }

        detach() {
            window.removeEventListener("resize", this._resetOrientationGamma);
            window.removeEventListener("deviceorientation", this._orientationChanged);
            
            this._orientationGamma = 0;
            this._orientationBeta = 0;
            this._initialOrientationGamma = 0;
            this._initialOrientationBeta = 0;
        }

        public checkInputs() {
            if (!this._offsetX) {
                return;
            }
            
            var camera = this.camera;
            camera.cameraRotation.y -= this._offsetX / this.angularSensibility;

            var speed = camera._computeLocalCameraSpeed();
            var direction = new Vector3(0, 0, speed * this._offsetY / this.moveSensibility);

            Matrix.RotationYawPitchRollToRef(camera.rotation.y, camera.rotation.x, 0, camera._cameraRotationMatrix);
            camera.cameraDirection.addInPlace(Vector3.TransformCoordinates(direction, camera._cameraRotationMatrix));
        }

        getTypeName(): string {
            return "deviceorientation";
        }
    }
}