
declare module BABYLON {
    class LavaMaterial extends PushMaterial {
        private _diffuseTexture;
        diffuseTexture: BaseTexture;
        noiseTexture: BaseTexture;
        fogColor: Color3;
        speed: number;
        movingSpeed: number;
        lowFrequencySpeed: number;
        fogDensity: number;
        private _lastTime;
        diffuseColor: Color3;
        private _disableLighting;
        disableLighting: boolean;
        private _maxSimultaneousLights;
        maxSimultaneousLights: number;
        private _scaledDiffuse;
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
        clone(name: string): LavaMaterial;
        serialize(): any;
        getClassName(): string;
        static Parse(source: any, scene: Scene, rootUrl: string): LavaMaterial;
    }
}
