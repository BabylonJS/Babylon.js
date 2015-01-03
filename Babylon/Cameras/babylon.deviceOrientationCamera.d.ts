declare module BABYLON {
    class DeviceOrientationCamera extends FreeCamera {
        private _offsetX;
        private _offsetY;
        private _orientationGamma;
        private _orientationBeta;
        private _initialOrientationGamma;
        private _initialOrientationBeta;
        private _attachedCanvas;
        private _orientationChanged;
        public angularSensibility: number;
        public moveSensibility: number;
        constructor(name: string, position: Vector3, scene: Scene);
        public attachControl(canvas: HTMLCanvasElement, noPreventDefault: boolean): void;
        public detachControl(canvas: HTMLCanvasElement): void;
        public _checkInputs(): void;
    }
}
