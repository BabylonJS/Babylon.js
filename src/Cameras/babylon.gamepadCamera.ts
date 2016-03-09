module BABYLON {
    // We're mainly based on the logic defined into the FreeCamera code
    export class GamepadCamera extends UniversalCamera {
        //-- 2016-03-08 properties for backward compatibility for inputs
        //deprecated
        public get gamepadAngularSensibility() {
            Tools.Warn("Warning: gamepadAngularSensibility is deprecated on GamepadCamera, use camera.inputs.attached.gamepad.gamepadAngularSensibility instead.");
            var gamepad = <FreeCameraGamepadInput>this.inputs.attached["gamepad"];
            if (gamepad)
                return gamepad.gamepadAngularSensibility;
        }
        
        //deprecated
        public set gamepadAngularSensibility(value) {
            Tools.Warn("Warning: gamepadAngularSensibility is deprecated on GamepadCamera, use camera.inputs.attached.gamepad.gamepadAngularSensibility instead.");
            var gamepad = <FreeCameraGamepadInput>this.inputs.attached["gamepad"];
            if (gamepad)
                gamepad.gamepadAngularSensibility = value;
        }
        
        //deprecated
        public get gamepadMoveSensibility() {
            Tools.Warn("Warning: gamepadMoveSensibility is deprecated on GamepadCamera, use camera.inputs.attached.gamepad.gamepadMoveSensibility instead.");
            var gamepad = <FreeCameraGamepadInput>this.inputs.attached["gamepad"];
            if (gamepad)
                return gamepad.gamepadMoveSensibility;
        }
        
        //deprecated
        public set gamepadMoveSensibility(value) {
            Tools.Warn("Warning: gamepadMoveSensibility is deprecated on GamepadCamera, use camera.inputs.attached.gamepad.gamepadMoveSensibility instead.");
            var gamepad = <FreeCameraGamepadInput>this.inputs.attached["gamepad"];
            if (gamepad)
                gamepad.gamepadMoveSensibility = value;
        }
        //-- end properties for backward compatibility for inputs
        
        
        constructor(name: string, position: Vector3, scene: Scene) {
            Tools.Warn("Deprecated. Please use Universal Camera instead.");
            super(name, position, scene);
        }

        public getTypeName(): string {
            return "GamepadCamera";
        }
    }
}