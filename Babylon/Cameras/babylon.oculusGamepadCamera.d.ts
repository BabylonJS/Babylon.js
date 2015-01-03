declare module BABYLON {
    class OculusGamepadCamera extends FreeCamera {
        private _leftCamera;
        private _rightCamera;
        private _offsetOrientation;
        private _deviceOrientationHandler;
        private _gamepad;
        private _gamepads;
        public angularSensibility: number;
        public moveSensibility: number;
        constructor(name: string, position: Vector3, scene: Scene);
        private _onNewGameConnected(gamepad);
        public _update(): void;
        public _checkInputs(): void;
        public _updateCamera(camera: FreeCamera): void;
        public _onOrientationEvent(evt: DeviceOrientationEvent): void;
        public attachControl(element: HTMLElement, noPreventDefault?: boolean): void;
        public detachControl(element: HTMLElement): void;
        public dispose(): void;
    }
}
