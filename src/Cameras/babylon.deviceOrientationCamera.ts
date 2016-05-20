module BABYLON {
    // We're mainly based on the logic defined into the FreeCamera code
    export class DeviceOrientationCamera extends FreeCamera {
        //-- Begin properties for backward compatibility for inputs
        public get angularSensibility() {
            return 0;
        }
        
        public set angularSensibility(value) {
        }
        
        public get moveSensibility() {
                return 0;
        }
        
        public set moveSensibility(value) {
        }
        //-- end properties for backward compatibility for inputs
        
        constructor(name: string, position: Vector3, scene: Scene) {
            super(name, position, scene);
            this.inputs.addDeviceOrientation();
        }

        public getTypeName(): string {
            return "DeviceOrientationCamera";
        }
    }
}