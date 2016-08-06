module BABYLON {
    // We're mainly based on the logic defined into the FreeCamera code
    export class DeviceOrientationCamera extends FreeCamera {

        private _initialQuaternion: Quaternion;

        constructor(name: string, position: Vector3, scene: Scene) {
            super(name, position, scene);
            this.inputs.addDeviceOrientation();
        }

        public getTypeName(): string {
            return "DeviceOrientationCamera";
        }

        public resetToCurrentRotation(axis: BABYLON.Vector3) {
            //can only work if this camera has a rotation quaternion already.
            if (!this.rotationQuaternion) return;

            if (!this._initialQuaternion) {
                this._initialQuaternion = new BABYLON.Quaternion();
            } else {
                this._initialQuaternion.copyFrom(this.rotationQuaternion);
            }

            ['x', 'y', 'z'].forEach(function (axisName) {
                if (!axis[axisName]) {
                    this._initialQuaternion[axisName] = 0;
                }
            });
            this._initialQuaternion.normalize();
        }
    }
}