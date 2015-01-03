declare module BABYLON {
    class SpotLight extends Light {
        public position: Vector3;
        public direction: Vector3;
        public angle: number;
        public exponent: number;
        private _transformedDirection;
        private _transformedPosition;
        private _worldMatrix;
        constructor(name: string, position: Vector3, direction: Vector3, angle: number, exponent: number, scene: Scene);
        public getAbsolutePosition(): Vector3;
        public setDirectionToTarget(target: Vector3): Vector3;
        public transferToEffect(effect: Effect, positionUniformName: string, directionUniformName: string): void;
        public _getWorldMatrix(): Matrix;
    }
}
