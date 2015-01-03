declare module BABYLON {
    class TouchCamera extends FreeCamera {
        private _offsetX;
        private _offsetY;
        private _pointerCount;
        private _pointerPressed;
        private _attachedCanvas;
        private _onPointerDown;
        private _onPointerUp;
        private _onPointerMove;
        public angularSensibility: number;
        public moveSensibility: number;
        constructor(name: string, position: Vector3, scene: Scene);
        public attachControl(canvas: HTMLCanvasElement, noPreventDefault: boolean): void;
        public detachControl(canvas: HTMLCanvasElement): void;
        public _checkInputs(): void;
    }
}
