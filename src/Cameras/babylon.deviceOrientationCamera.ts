module BABYLON {
    // We're mainly based on the logic defined into the FreeCamera code
    export class DeviceOrientationCamera extends FreeCamera {
        //-- Begin properties for backward compatibility for inputs
        public get angularSensibility() {
            var gamepad = <FreeCameraDeviceOrientationInput>this.inputs.attached["deviceOrientation"];
            if (gamepad)
                return gamepad.angularSensibility;
        }
        
        public set angularSensibility(value) {
            var gamepad = <FreeCameraDeviceOrientationInput>this.inputs.attached["deviceOrientation"];
            if (gamepad)
                gamepad.angularSensibility = value;
        }
        
        public get moveSensibility() {
            var gamepad = <FreeCameraDeviceOrientationInput>this.inputs.attached["deviceOrientation"];
            if (gamepad)
                return gamepad.moveSensibility;
        }
        
        public set moveSensibility(value) {
            var gamepad = <FreeCameraDeviceOrientationInput>this.inputs.attached["deviceOrientation"];
            if (gamepad)
                gamepad.moveSensibility = value;
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