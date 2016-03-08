module BABYLON {
    // We're mainly based on the logic defined into the FreeCamera code
    export class TouchCamera extends FreeCamera {
        //-- 2016-03-08 properties for backward compatibility for inputs
        //deprecated
        public get touchAngularSensibility() {
            Tools.Warn("Warning: touchAngularSensibility is deprecated on TouchCamera, use camera.inputs.attached.touch.touchAngularSensibility instead.");
            var touch = <FreeCameraTouchInput>this.inputs.attached["touch"];
            if (touch)
                return touch.touchAngularSensibility;
        }
        
        //deprecated
        public set touchAngularSensibility(value) {
            Tools.Warn("Warning: touchAngularSensibility is deprecated on TouchCamera, use camera.inputs.attached.touch.touchAngularSensibility instead.");
            var touch = <FreeCameraTouchInput>this.inputs.attached["touch"];
            if (touch)
                touch.touchAngularSensibility = value;
        }
        
        //deprecated
        public get touchMoveSensibility() {
            Tools.Warn("Warning: touchMoveSensibility is deprecated on TouchCamera, use camera.inputs.attached.touch.touchMoveSensibility instead.");
            var touch = <FreeCameraTouchInput>this.inputs.attached["touch"];
            if (touch)
                return touch.touchMoveSensibility;
        }
        
        //deprecated
        public set touchMoveSensibility(value) {
            Tools.Warn("Warning: touchMoveSensibility is deprecated on TouchCamera, use camera.inputs.attached.touch.touchMoveSensibility instead.");
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