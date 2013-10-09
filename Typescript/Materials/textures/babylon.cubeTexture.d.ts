/// <reference path="../../babylon.d.ts" />

declare module BABYLON {
    class CubeTexture extends BaseTexture {
        constructor(rootUrl: string, scene: Scene);

        isCube: boolean;
        _computeReflectionTextureMatrix(): Matrix;
    }
}