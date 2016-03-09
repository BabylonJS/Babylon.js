module BABYLON {
    // We're mainly based on the logic defined into the FreeCamera code
    export class UniversalCamera extends TouchCamera {
        //-- Begin properties for backward compatibility for inputs
        public get gamepadAngularSensibility() {
            var gamepad = <FreeCameraGamepadInput>this.inputs.attached["gamepad"];
            if (gamepad)
                return gamepad.gamepadAngularSensibility;
        }
        
        public set gamepadAngularSensibility(value) {
            var gamepad = <FreeCameraGamepadInput>this.inputs.attached["gamepad"];
            if (gamepad)
                gamepad.gamepadAngularSensibility = value;
        }
        
        public get gamepadMoveSensibility() {
            var gamepad = <FreeCameraGamepadInput>this.inputs.attached["gamepad"];
            if (gamepad)
                return gamepad.gamepadMoveSensibility;
        }
        
        public set gamepadMoveSensibility(value) {
            var gamepad = <FreeCameraGamepadInput>this.inputs.attached["gamepad"];
            if (gamepad)
                gamepad.gamepadMoveSensibility = value;
        }
        //-- end properties for backward compatibility for inputs
        
        constructor(name: string, position: Vector3, scene: Scene) {
            super(name, position, scene);
            this.inputs.addGamepad();
        }

        public getTypeName(): string {
            return "UniversalCamera";
        }
    }
}