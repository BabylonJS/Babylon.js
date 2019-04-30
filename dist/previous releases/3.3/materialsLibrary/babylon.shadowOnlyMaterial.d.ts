
declare module BABYLON {
    class ShadowOnlyMaterial extends PushMaterial {
        private _renderId;
        private _activeLight;
        constructor(name: string, scene: Scene);
        shadowColor: Color3;
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): Nullable<BaseTexture>;
        activeLight: IShadowLight;
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        clone(name: string): ShadowOnlyMaterial;
        serialize(): any;
        getClassName(): string;
        static Parse(source: any, scene: Scene, rootUrl: string): ShadowOnlyMaterial;
    }
}
