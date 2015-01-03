declare module BABYLON {
    class VirtualJoysticksCamera extends FreeCamera {
        private _leftjoystick;
        private _rightjoystick;
        constructor(name: string, position: Vector3, scene: Scene);
        public _checkInputs(): void;
        public dispose(): void;
    }
}
