declare module BABYLON {
    class OculusCamera extends FreeCamera {
        private _leftCamera;
        private _rightCamera;
        private _offsetOrientation;
        private _deviceOrientationHandler;
        constructor(name: string, position: Vector3, scene: Scene);
        public _update(): void;
        public _updateCamera(camera: FreeCamera): void;
        public _onOrientationEvent(evt: DeviceOrientationEvent): void;
        public attachControl(element: HTMLElement, noPreventDefault?: boolean): void;
        public detachControl(element: HTMLElement): void;
    }
}
