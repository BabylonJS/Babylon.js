
declare module BABYLON {
    class CellMaterial extends PushMaterial {
        private _diffuseTexture;
        diffuseTexture: BaseTexture;
        diffuseColor: Color3;
        _computeHighLevel: boolean;
        computeHighLevel: boolean;
        private _disableLighting;
        disableLighting: boolean;
        private _maxSimultaneousLights;
        maxSimultaneousLights: number;
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
        getClassName(): string;
        clone(name: string): CellMaterial;
        serialize(): any;
        static Parse(source: any, scene: Scene, rootUrl: string): CellMaterial;
    }
}
