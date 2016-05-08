/// <reference path="../../../dist/preview release/babylon.d.ts" />
/// <reference path="../simple/babylon.simpleMaterial.d.ts" />
declare module BABYLON {
    class WaterMaterial extends Material {
        renderTargetSize: Vector2;
        bumpTexture: BaseTexture;
        diffuseColor: Color3;
        specularColor: Color3;
        specularPower: number;
        disableLighting: boolean;
        maxSimultaneousLights: number;
        /**
        * @param {number}: Represents the wind force
        */
        windForce: number;
        /**
        * @param {Vector2}: The direction of the wind in the plane (X, Z)
        */
        windDirection: Vector2;
        /**
        * @param {number}: Wave height, represents the height of the waves
        */
        waveHeight: number;
        /**
        * @param {number}: Bump height, represents the bump height related to the bump map
        */
        bumpHeight: number;
        /**
        * @param {number}: The water color blended with the reflection and refraction samplers
        */
        waterColor: Color3;
        /**
        * @param {number}: The blend factor related to the water color
        */
        colorBlendFactor: number;
        /**
        * @param {number}: Represents the maximum length of a wave
        */
        waveLength: number;
        /**
        * @param {number}: Defines the waves speed
        */
        waveSpeed: number;
        private _mesh;
        private _refractionRTT;
        private _reflectionRTT;
        private _material;
        private _reflectionTransform;
        private _lastTime;
        private _renderId;
        private _defines;
        private _cachedDefines;
        /**
        * Constructor
        */
        constructor(name: string, scene: Scene, renderTargetSize?: Vector2);
        refractionTexture: RenderTargetTexture;
        reflectionTexture: RenderTargetTexture;
        addToRenderList(node: any): void;
        enableRenderTargets(enable: boolean): void;
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): BaseTexture;
        private _checkCache(scene, mesh?, useInstances?);
        isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean;
        bindOnlyWorldMatrix(world: Matrix): void;
        bind(world: Matrix, mesh?: Mesh): void;
        private _createRenderTargets(scene, renderTargetSize);
        getAnimatables(): IAnimatable[];
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): WaterMaterial;
        serialize(): any;
        static Parse(source: any, scene: Scene, rootUrl: string): WaterMaterial;
        static CreateDefaultMesh(name: string, scene: Scene): Mesh;
    }
}
