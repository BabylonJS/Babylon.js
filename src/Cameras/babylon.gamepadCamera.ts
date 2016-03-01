module BABYLON {
    // We're mainly based on the logic defined into the FreeCamera code
    export class GamepadCamera extends UniversalCamera {
        constructor(name: string, position: Vector3, scene: Scene) {
            Tools.Warn("Deprecated. Please use Universal Camera instead.");
            super(name, position, scene);
        }

        public getTypeName(): string {
            return "GamepadCamera";
        }
    }
}