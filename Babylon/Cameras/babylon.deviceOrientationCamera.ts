module BABYLON {
    // We're mainly based on the logic defined into the FreeCamera code
    export class DeviceOrientationCamera extends FreeCamera {
        private _offsetX: number = null;
        private _offsetY: number = null;
        private _orientationGamma: number = 0;
        private _orientationBeta: number = 0;
        private _initialOrientationGamma: number = 0;
        private _initialOrientationBeta: number = 0;
        private _attachedCanvas: HTMLCanvasElement;
        private _orientationChanged: (e: DeviceOrientationEvent) => any;
        private _isLandscape: boolean = true;

        public angularSensibility: number = 10000.0;
        public moveSensibility: number = 50.0;

        constructor(name: string, position: Vector3, scene: Scene) {
            super(name, position, scene);

            http://david.blob.core.windows.net/videos/BabylonJSWinStoreLaunchSequence.mp4 = (window.innerWidth > window.innerHeight) ? true : false;

            window.addEventListener("resize", () => {
                this._isLandscape = (window.innerWidth > window.innerHeight) ? true : false;
                this._initialOrientationGamma = null;
            }, false);
        }

        public attachControl(canvas: HTMLCanvasElement, noPreventDefault: boolean): void {
            if (this._attachedCanvas) {
                return;
            }
            this._attachedCanvas = canvas;

            var that = this;
            if (!this._orientationChanged) {
                this._orientationChanged = function (evt) {

                    if (!that._initialOrientationGamma) {
                        if (!this._isLandscape) {
                            that._initialOrientationGamma = evt.gamma;
                            that._initialOrientationBeta = evt.beta;
                        }
                        else {
                            that._initialOrientationGamma = evt.beta;
                            that._initialOrientationBeta = evt.gamma;
                        }
                    }

                    if (!this._isLandscape) {
                        that._orientationGamma = evt.gamma;
                        that._orientationBeta = evt.beta;
                    }
                    else {
                        that._orientationGamma = evt.beta;
                        that._orientationBeta = evt.gamma;
                    }

                    that._offsetY = (that._initialOrientationBeta - that._orientationBeta);
                    that._offsetX = (that._initialOrientationGamma - that._orientationGamma);
                };
            }

            window.addEventListener("deviceorientation", this._orientationChanged);
        }

        public detachControl(canvas: HTMLCanvasElement): void {
            if (this._attachedCanvas != canvas) {
                return;
            }

            window.removeEventListener("deviceorientation", this._orientationChanged);

            this._attachedCanvas = null;
            this._orientationGamma = 0;
            this._orientationBeta = 0;
            this._initialOrientationGamma = 0;
            this._initialOrientationBeta = 0;
        }

        public _checkInputs(): void {
            if (!this._offsetX) {
                return;
            }
            this.cameraRotation.y -= this._offsetX / this.angularSensibility;

            var speed = this._computeLocalCameraSpeed();
            var direction = new BABYLON.Vector3(0, 0, speed * this._offsetY / this.moveSensibility);

            BABYLON.Matrix.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, 0, this._cameraRotationMatrix);
            this.cameraDirection.addInPlace(BABYLON.Vector3.TransformCoordinates(direction, this._cameraRotationMatrix));
        }
    }
}