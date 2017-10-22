/// <reference path="babylon.touchCamera.ts" />

module BABYLON {
    // We're mainly based on the logic defined into the FreeCamera code
    export class UniversalCamera extends TouchCamera {
        //-- Begin properties for backward compatibility for inputs
        public get gamepadAngularSensibility(): number {
            var gamepad = <FreeCameraGamepadInput>this.inputs.attached["gamepad"];
            if (gamepad)
                return gamepad.gamepadAngularSensibility;

            return 0;                
        }
        
        public set gamepadAngularSensibility(value: number) {
            var gamepad = <FreeCameraGamepadInput>this.inputs.attached["gamepad"];
            if (gamepad)
                gamepad.gamepadAngularSensibility = value;
        }
        
        public get gamepadMoveSensibility(): number {
            var gamepad = <FreeCameraGamepadInput>this.inputs.attached["gamepad"];
            if (gamepad)
                return gamepad.gamepadMoveSensibility;

            return 0;
        }
        
        public set gamepadMoveSensibility(value: number) {
            var gamepad = <FreeCameraGamepadInput>this.inputs.attached["gamepad"];
            if (gamepad)
                gamepad.gamepadMoveSensibility = value;
        }
        //-- end properties for backward compatibility for inputs
        
        constructor(name: string, position: Vector3, scene: Scene) {
            super(name, position, scene);
            this.inputs.addGamepad();
        }

        public getClassName(): string {
            return "UniversalCamera";
        }
    }
}