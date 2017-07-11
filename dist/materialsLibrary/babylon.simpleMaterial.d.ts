
declare module BABYLON {
    class SimpleMaterial extends PushMaterial {
        private _diffuseTexture;
        diffuseTexture: BaseTexture;
        diffuseColor: Color3;
        private _disableLighting;
        disableLighting: boolean;
        private _maxSimultaneousLights;
        maxSimultaneousLights: number;
        private _worldViewProjectionMatrix;
        private _scaledDiffuse;
        private _renderId;
        constructor(name: string, scene: Scene);
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): BaseTexture;
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        getAnimatables(): IAnimatable[];
        getActiveTextures(): BaseTexture[];
        hasTexture(texture: BaseTexture): boolean;
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): SimpleMaterial;
        serialize(): any;
        static Parse(source: any, scene: Scene, rootUrl: string): SimpleMaterial;
    }
}
