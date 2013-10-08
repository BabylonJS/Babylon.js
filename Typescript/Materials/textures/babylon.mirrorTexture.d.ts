/// <reference path="../../babylon.d.ts" />

declare module BABYLON {
    class MirrorTexture extends RenderTargetTexture {
        constructor(name: string, size: Size2D, scene: Scene, generateMipMaps: boolean);

        mirrorPlane: Plane;

        onBeforeRender(): void;
        onAfterRender(): void;
    }
}