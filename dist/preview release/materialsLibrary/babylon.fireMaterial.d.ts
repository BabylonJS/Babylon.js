
declare module BABYLON {
    class FireMaterial extends PushMaterial {
        private _diffuseTexture;
        diffuseTexture: BaseTexture;
        private _distortionTexture;
        distortionTexture: BaseTexture;
        private _opacityTexture;
        opacityTexture: BaseTexture;
        diffuseColor: Color3;
        speed: number;
        private _scaledDiffuse;
        private _renderId;
        private _lastTime;
        constructor(name: string, scene: Scene);
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): BaseTexture;
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        getAnimatables(): IAnimatable[];
        getActiveTextures(): BaseTexture[];
        hasTexture(texture: BaseTexture): boolean;
        getClassName(): string;
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): FireMaterial;
        serialize(): any;
        static Parse(source: any, scene: Scene, rootUrl: string): FireMaterial;
    }
}
