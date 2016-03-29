module BABYLON {
    // We're mainly based on the logic defined into the FreeCamera code
    export class TouchCamera extends FreeCamera {
        //-- Begin properties for backward compatibility for inputs
        public get touchAngularSensibility() {
            var touch = <FreeCameraTouchInput>this.inputs.attached["touch"];
            if (touch)
                return touch.touchAngularSensibility;
        }
        
        public set touchAngularSensibility(value) {
            var touch = <FreeCameraTouchInput>this.inputs.attached["touch"];
            if (touch)
                touch.touchAngularSensibility = value;
        }
        
        public get touchMoveSensibility() {
            var touch = <FreeCameraTouchInput>this.inputs.attached["touch"];
            if (touch)
                return touch.touchMoveSensibility;
        }
        
        public set touchMoveSensibility(value) {
            var touch = <FreeCameraTouchInput>this.inputs.attached["touch"];
            if (touch)
                touch.touchMoveSensibility = value;
        }
        //-- end properties for backward compatibility for inputs
        
        constructor(name: string, position: Vector3, scene: Scene) {
            super(name, position, scene);
            this.inputs.addTouch();
        }

        public getTypeName(): string {
            return "TouchCamera";
        }
    }
}