declare module BABYLON {
    class DirectionalLight extends Light {
        public direction: Vector3;
        public position: Vector3;
        private _transformedDirection;
        public _transformedPosition: Vector3;
        private _worldMatrix;
        constructor(name: string, direction: Vector3, scene: Scene);
        public getAbsolutePosition(): Vector3;
        public setDirectionToTarget(target: Vector3): Vector3;
        public _computeTransformedPosition(): boolean;
        public transferToEffect(effect: Effect, directionUniformName: string): void;
        public _getWorldMatrix(): Matrix;
    }
}
