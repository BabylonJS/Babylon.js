module BABYLON {
    // We're mainly based on the logic defined into the FreeCamera code
    export class DeviceOrientationCamera extends FreeCamera {
        //-- Begin properties for backward compatibility for inputs
        public get angularSensibility() {
            var deviceOrientation = <FreeCameraDeviceOrientationInput>this.inputs.attached["deviceOrientation"];
            if (deviceOrientation)
                return deviceOrientation.angularSensibility;
        }
        
        public set angularSensibility(value) {
            var deviceOrientation = <FreeCameraDeviceOrientationInput>this.inputs.attached["deviceOrientation"];
            if (deviceOrientation)
                deviceOrientation.angularSensibility = value;
        }
        
        public get moveSensibility() {
            var deviceOrientation = <FreeCameraDeviceOrientationInput>this.inputs.attached["deviceOrientation"];
            if (deviceOrientation)
                return deviceOrientation.moveSensibility;
        }
        
        public set moveSensibility(value) {
            var deviceOrientation = <FreeCameraDeviceOrientationInput>this.inputs.attached["deviceOrientation"];
            if (deviceOrientation)
                deviceOrientation.moveSensibility = value;
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