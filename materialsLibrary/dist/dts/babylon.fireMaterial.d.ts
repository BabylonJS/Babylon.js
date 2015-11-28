/// <reference path="../../../dist/preview release/babylon.d.ts" />
declare module BABYLON {
    class FireMaterial extends Material {
        diffuseTexture: BaseTexture;
        distortionTexture: BaseTexture;
        opacityTexture: BaseTexture;
        diffuseColor: Color3;
        disableLighting: boolean;
        speed: number;
        private _scaledDiffuse;
        private _renderId;
        private _defines;
        private _cachedDefines;
        private _lastTime;
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
        clone(name: string): FireMaterial;
        serialize(): any;
        static Parse(source: any, scene: Scene, rootUrl: string): FireMaterial;
    }
}
