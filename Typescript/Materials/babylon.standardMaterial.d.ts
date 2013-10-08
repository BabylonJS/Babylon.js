//// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class StandardMaterial extends Material {
        diffuseTexture: Texture;
        ambientTexture: Texture;
        opacityTexture: Texture;
        reflectionTexture: Texture;
        emissiveTexture: Texture;
        specularTexture: Texture;
        bumpTexture: Texture;

        ambientColor: Color3;
        diffuseColor: Color3;
        specularColor: Color3;
        specularPower: number;
        emissiveColor: Color3;

        getRenderTargetTextures(): Texture[];
        getAnimatables(): Texture[];
        clone(name: string): StandardMaterial;
    }
}