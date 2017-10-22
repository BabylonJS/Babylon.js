/// <reference path="babylon.freeCamera.ts" />

module BABYLON {
    // We're mainly based on the logic defined into the FreeCamera code
    export class TouchCamera extends FreeCamera {
        //-- Begin properties for backward compatibility for inputs
        public get touchAngularSensibility(): number {
            var touch = <FreeCameraTouchInput>this.inputs.attached["touch"];
            if (touch)
                return touch.touchAngularSensibility;

            return 0;
        }
        
        public set touchAngularSensibility(value: number) {
            var touch = <FreeCameraTouchInput>this.inputs.attached["touch"];
            if (touch)
                touch.touchAngularSensibility = value;
        }
        
        public get touchMoveSensibility(): number {
            var touch = <FreeCameraTouchInput>this.inputs.attached["touch"];
            if (touch)
                return touch.touchMoveSensibility;

            return 0;
        }
        
        public set touchMoveSensibility(value: number) {
            var touch = <FreeCameraTouchInput>this.inputs.attached["touch"];
            if (touch)
                touch.touchMoveSensibility = value;
        }
        //-- end properties for backward compatibility for inputs
        
        constructor(name: string, position: Vector3, scene: Scene) {
            super(name, position, scene);
            this.inputs.addTouch();

            this._setupInputs();
        }

        public getClassName(): string {
            return "TouchCamera";
        }

        public _setupInputs() {
            var mouse = <FreeCameraMouseInput>this.inputs.attached["mouse"];
            if (mouse) {
                mouse.touchEnabled = false;
            }
        }
    }
}