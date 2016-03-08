module BABYLON {
    // We're mainly based on the logic defined into the FreeCamera code
    export class UniversalCamera extends TouchCamera {

        constructor(name: string, position: Vector3, scene: Scene) {
            super(name, position, scene);
            this.inputs.addGamepad();
        }

        public getTypeName(): string {
            return "UniversalCamera";
        }
    }
}