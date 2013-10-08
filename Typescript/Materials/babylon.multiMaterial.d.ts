//// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class MultiMaterial extends Material {
        subMaterials: Material[];

        constructor(name: string, scene: Scene);

        getSubMaterial(index: number): Material;
    }
}