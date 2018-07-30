module BABYLON {
    Node.AddNodeConstructor("VirtualJoysticksCamera", (name, scene) => {
        return () => new VirtualJoysticksCamera(name, Vector3.Zero(), scene);
    });

    // We're mainly based on the logic defined into the FreeCamera code
    export class VirtualJoysticksCamera extends FreeCamera {
        
        constructor(name: string, position: Vector3, scene: Scene) {
            super(name, position, scene);
            this.inputs.addVirtualJoystick();
        }

        public getClassName(): string {
            return "VirtualJoysticksCamera";
        }
    }
}