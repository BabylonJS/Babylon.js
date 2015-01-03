declare module BABYLON {
    class FollowCamera extends TargetCamera {
        public radius: number;
        public rotationOffset: number;
        public heightOffset: number;
        public cameraAcceleration: number;
        public maxCameraSpeed: number;
        public target: AbstractMesh;
        constructor(name: string, position: Vector3, scene: Scene);
        private getRadians(degrees);
        private follow(cameraTarget);
        public _update(): void;
    }
}
