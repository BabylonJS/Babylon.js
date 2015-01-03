declare module BABYLON {
    class Light extends Node {
        public diffuse: Color3;
        public specular: Color3;
        public intensity: number;
        public range: number;
        public includedOnlyMeshes: AbstractMesh[];
        public excludedMeshes: AbstractMesh[];
        public _shadowGenerator: ShadowGenerator;
        private _parentedWorldMatrix;
        public _excludedMeshesIds: string[];
        public _includedOnlyMeshesIds: string[];
        constructor(name: string, scene: Scene);
        public getShadowGenerator(): ShadowGenerator;
        public getAbsolutePosition(): Vector3;
        public transferToEffect(effect: Effect, uniformName0?: string, uniformName1?: string): void;
        public _getWorldMatrix(): Matrix;
        public canAffectMesh(mesh: AbstractMesh): boolean;
        public getWorldMatrix(): Matrix;
        public dispose(): void;
    }
}
