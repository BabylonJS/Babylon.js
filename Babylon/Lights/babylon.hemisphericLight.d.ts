declare module BABYLON {
    class HemisphericLight extends Light {
        public direction: Vector3;
        public groundColor: Color3;
        private _worldMatrix;
        constructor(name: string, direction: Vector3, scene: Scene);
        public setDirectionToTarget(target: Vector3): Vector3;
        public getShadowGenerator(): ShadowGenerator;
        public transferToEffect(effect: Effect, directionUniformName: string, groundColorUniformName: string): void;
        public _getWorldMatrix(): Matrix;
    }
}
