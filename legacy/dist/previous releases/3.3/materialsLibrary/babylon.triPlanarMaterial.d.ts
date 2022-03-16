
declare module BABYLON {
    class TriPlanarMaterial extends PushMaterial {
        mixTexture: BaseTexture;
        private _diffuseTextureX;
        diffuseTextureX: BaseTexture;
        private _diffuseTextureY;
        diffuseTextureY: BaseTexture;
        private _diffuseTextureZ;
        diffuseTextureZ: BaseTexture;
        private _normalTextureX;
        normalTextureX: BaseTexture;
        private _normalTextureY;
        normalTextureY: BaseTexture;
        private _normalTextureZ;
        normalTextureZ: BaseTexture;
        tileSize: number;
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
        clone(name: string): TriPlanarMaterial;
        serialize(): any;
        getClassName(): string;
        static Parse(source: any, scene: Scene, rootUrl: string): TriPlanarMaterial;
    }
}
