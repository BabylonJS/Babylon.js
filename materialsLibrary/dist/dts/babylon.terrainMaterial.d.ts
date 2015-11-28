/// <reference path="../../../dist/preview release/babylon.d.ts" />
declare module BABYLON {
    class TerrainMaterial extends Material {
        mixTexture: BaseTexture;
        diffuseTexture1: Texture;
        diffuseTexture2: Texture;
        diffuseTexture3: Texture;
        bumpTexture1: Texture;
        bumpTexture2: Texture;
        bumpTexture3: Texture;
        diffuseColor: Color3;
        specularColor: Color3;
        specularPower: number;
        disableLighting: boolean;
        private _worldViewProjectionMatrix;
        private _scaledDiffuse;
        private _scaledSpecular;
        private _renderId;
        private _defines;
        private _cachedDefines;
        constructor(name: string, scene: Scene);
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): BaseTexture;
        private _checkCache(scene, mesh?, useInstances?);
        isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean;
        bindOnlyWorldMatrix(world: Matrix): void;
        bind(world: Matrix, mesh?: Mesh): void;
        getAnimatables(): IAnimatable[];
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): TerrainMaterial;
        serialize(): any;
        static Parse(source: any, scene: Scene, rootUrl: string): TerrainMaterial;
    }
}
