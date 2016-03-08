module BABYLON {
    // We're mainly based on the logic defined into the FreeCamera code
    export class DeviceOrientationCamera extends FreeCamera {
        //-- 2016-03-08 properties for backward compatibility for inputs
        //deprecated
        public get angularSensibility() {
            Tools.Warn("Warning: angularSensibility is deprecated on DeviceOrientationCamera, use camera.inputs.attached.deviceOrientation.angularSensibility instead.");
            var gamepad = <FreeCameraDeviceOrientationInput>this.inputs.attached["deviceOrientation"];
            if (gamepad)
                return gamepad.angularSensibility;
        }
        
        //deprecated
        public set angularSensibility(value) {
            Tools.Warn("Warning: angularSensibility is deprecated on DeviceOrientationCamera, use camera.inputs.attached.deviceOrientation.angularSensibility instead.");
            var gamepad = <FreeCameraDeviceOrientationInput>this.inputs.attached["deviceOrientation"];
            if (gamepad)
                gamepad.angularSensibility = value;
        }
        
        //deprecated
        public get moveSensibility() {
            Tools.Warn("Warning: moveSensibility is deprecated on DeviceOrientationCamera, use camera.inputs.attached.deviceOrientation.moveSensibility instead.");
            var gamepad = <FreeCameraDeviceOrientationInput>this.inputs.attached["deviceOrientation"];
            if (gamepad)
                return gamepad.moveSensibility;
        }
        
        //deprecated
        public set moveSensibility(value) {
            Tools.Warn("Warning: moveSensibility is deprecated on DeviceOrientationCamera, use camera.inputs.attached.deviceOrientation.moveSensibility instead.");
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