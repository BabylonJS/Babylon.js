module BABYLON {
    // We're mainly based on the logic defined into the FreeCamera code
    export class DeviceOrientationCamera extends FreeCamera {
        constructor(name: string, position: Vector3, scene: Scene) {
            super(name, position, scene);
            this.inputs.addDeviceOrientation();
        }

        public getTypeName(): string {
            return "DeviceOrientationCamera";
        }
    }
}