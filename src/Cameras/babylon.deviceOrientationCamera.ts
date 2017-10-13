/// <reference path="babylon.freeCamera.ts" />

module BABYLON {
    // We're mainly based on the logic defined into the FreeCamera code
    export class DeviceOrientationCamera extends FreeCamera {

        private _initialQuaternion: Quaternion;
        private _quaternionCache: Quaternion;

        constructor(name: string, position: Vector3, scene: Scene) {
            super(name, position, scene);
            this._quaternionCache = new Quaternion();
            this.inputs.addDeviceOrientation();
        }

        public getClassName(): string {
            return "DeviceOrientationCamera";
        }

        public _checkInputs(): void {
            super._checkInputs();
            this._quaternionCache.copyFrom(this.rotationQuaternion);
            if (this._initialQuaternion) {
                this._initialQuaternion.multiplyToRef(this.rotationQuaternion, this.rotationQuaternion);
            }
        }

        public resetToCurrentRotation(axis: Axis = Axis.Y) {
            //can only work if this camera has a rotation quaternion already.
            if (!this.rotationQuaternion) return;

            if (!this._initialQuaternion) {
                this._initialQuaternion = new Quaternion();
            }

            this._initialQuaternion.copyFrom(this._quaternionCache || this.rotationQuaternion);

            ['x', 'y', 'z'].forEach((axisName) => {
                if (!(<any>axis)[axisName]) {
                    (<any>this._initialQuaternion)[axisName] = 0;
                } else {
                    (<any>this._initialQuaternion)[axisName] *= -1;
                }
            });
            this._initialQuaternion.normalize();
            //force rotation update
            this._initialQuaternion.multiplyToRef(this.rotationQuaternion, this.rotationQuaternion);
        }
    }
}