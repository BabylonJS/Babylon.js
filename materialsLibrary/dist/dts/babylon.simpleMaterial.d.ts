/// <reference path="../../../dist/preview release/babylon.d.ts" />
declare module BABYLON {
    class SimpleMaterial extends Material {
        diffuseTexture: BaseTexture;
        diffuseColor: Color3;
        disableLighting: boolean;
        maxSimultaneousLights: number;
        private _worldViewProjectionMatrix;
        private _scaledDiffuse;
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
        clone(name: string): SimpleMaterial;
        serialize(): any;
        static Parse(source: any, scene: Scene, rootUrl: string): SimpleMaterial;
    }
}
