module BABYLON {
    // We're mainly based on the logic defined into the FreeCamera code
    export class TouchCamera extends FreeCamera {
        constructor(name: string, position: Vector3, scene: Scene) {
            super(name, position, scene);
            this.inputs.addTouch();
        }

        public getTypeName(): string {
            return "TouchCamera";
        }
    }
}