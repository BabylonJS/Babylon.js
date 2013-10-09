/// <reference path="../../babylon.d.ts" />

declare module BABYLON {
   class RenderTargetTexture extends Texture {
       constructor(name: string, size: Size2D, scene: Scene, generateMipMaps: boolean);

       renderList: any[];
       isRenderTarget: boolean;
       coordinatesMode: number;
       renderParticles: boolean;

       _onBeforeRender: () => void;
       _onAfterRender: () => void;

       resize(size: Size2D, generateMipMaps: boolean): void;
       render(): void;
    }
}