/// <reference path="../../../dist/preview release/babylon.d.ts" />
declare module BABYLON {
    class WaterProceduralTexture extends ProceduralTexture {
        private _time;
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean);
        render(useCameraPostProcess?: boolean): void;
    }
}
