/// <reference path="../../../dist/preview release/babylon.d.ts" />
declare module BABYLON {
    class CustomShaderHelper {
    }
    interface ICustomMaterialBuilder {
        (builder: CustomShaderHelper, name: string, mainPart: string, diffusePart: string, vertexPositionPart: string): string;
    }
    class CustomMaterial extends StandardMaterial {
        builder: ICustomMaterialBuilder;
        private _mainPart;
        private _diffusePart;
        private _vertexPositionPart;
        constructor(name: string, builder: ICustomMaterialBuilder, scene: Scene);
    }
}
