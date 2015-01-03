declare module BABYLON {
    class GamepadCamera extends FreeCamera {
        private _gamepad;
        private _gamepads;
        public angularSensibility: number;
        public moveSensibility: number;
        constructor(name: string, position: Vector3, scene: Scene);
        private _onNewGameConnected(gamepad);
        public _checkInputs(): void;
        public dispose(): void;
    }
}
