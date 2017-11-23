
declare module BABYLON {
    class ShadowOnlyMaterial extends PushMaterial {
        private _worldViewProjectionMatrix;
        private _scaledDiffuse;
        private _renderId;
        constructor(name: string, scene: Scene);
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): BaseTexture;
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        clone(name: string): ShadowOnlyMaterial;
        serialize(): any;
        static Parse(source: any, scene: Scene, rootUrl: string): ShadowOnlyMaterial;
    }
}
