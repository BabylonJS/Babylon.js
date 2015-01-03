declare module BABYLON {
    class AnaglyphArcRotateCamera extends ArcRotateCamera {
        private _eyeSpace;
        private _leftCamera;
        private _rightCamera;
        constructor(name: string, alpha: number, beta: number, radius: number, target: any, eyeSpace: number, scene: any);
        public _update(): void;
        public _updateCamera(camera: ArcRotateCamera): void;
    }
    class AnaglyphFreeCamera extends FreeCamera {
        private _eyeSpace;
        private _leftCamera;
        private _rightCamera;
        private _transformMatrix;
        constructor(name: string, position: Vector3, eyeSpace: number, scene: Scene);
        public _getSubCameraPosition(eyeSpace: any, result: any): void;
        public _update(): void;
        public _updateCamera(camera: FreeCamera): void;
    }
}
