/// <reference path="../../babylon.d.ts" />

declare module BABYLON {
    class ShadowGenerator {
        _light: Light;
        _scene: Scene;

        _shadowMap: RenderTargetTexture;

        constructor(mapSize: number, light: Light);

        renderSubMesh(subMesh: Mesh): void;

        useVarianceShadowMap: boolean;

        isReady(mesh: Mesh): boolean;
        getShadowMap(): RenderTargetTexture;
        getLight(): Light;
        getTransformMatrix(): Matrix;
        dispose(): void;
    }
}