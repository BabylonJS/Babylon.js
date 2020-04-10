
declare module BABYLON {
    class TerrainMaterial extends PushMaterial {
        private _mixTexture;
        mixTexture: BaseTexture;
        private _diffuseTexture1;
        diffuseTexture1: Texture;
        private _diffuseTexture2;
        diffuseTexture2: Texture;
        private _diffuseTexture3;
        diffuseTexture3: Texture;
        private _bumpTexture1;
        bumpTexture1: Texture;
        private _bumpTexture2;
        bumpTexture2: Texture;
        private _bumpTexture3;
        bumpTexture3: Texture;
        diffuseColor: Color3;
        specularColor: Color3;
        specularPower: number;
        private _disableLighting;
        disableLighting: boolean;
        private _maxSimultaneousLights;
        maxSimultaneousLights: number;
        private _renderId;
        constructor(name: string, scene: Scene);
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): Nullable<BaseTexture>;
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        getAnimatables(): IAnimatable[];
        getActiveTextures(): BaseTexture[];
        hasTexture(texture: BaseTexture): boolean;
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): TerrainMaterial;
        serialize(): any;
        getClassName(): string;
        static Parse(source: any, scene: Scene, rootUrl: string): TerrainMaterial;
    }
}
