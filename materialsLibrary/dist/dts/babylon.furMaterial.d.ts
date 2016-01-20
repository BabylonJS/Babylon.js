/// <reference path="../../../dist/preview release/babylon.d.ts" />
declare module BABYLON {
    class FurMaterial extends Material {
        diffuseTexture: BaseTexture;
        heightTexture: BaseTexture;
        diffuseColor: Color3;
        furLength: number;
        furAngle: number;
        furColor: Color3;
        furOffset: number;
        furSpacing: number;
        furGravity: Vector3;
        furSpeed: number;
        furTexture: DynamicTexture;
        disableLighting: boolean;
        highLevelFur: boolean;
        private _worldViewProjectionMatrix;
        private _scaledDiffuse;
        private _renderId;
        private _furTime;
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
        clone(name: string): FurMaterial;
        serialize(): any;
        static Parse(source: any, scene: Scene, rootUrl: string): FurMaterial;
        static GenerateTexture(name: string, scene: Scene): DynamicTexture;
    }
}
