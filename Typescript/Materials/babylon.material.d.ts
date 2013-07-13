//// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class Material {
        name: string;
        id: string;
        private _scene: Scene;

        constructor(name: string, scene: Scene);

        alpha: number;
        wireframe: bool;
        backFaceCulling: bool;
        _effect: Effect;

        onDispose: () => void;

        isReady(): bool;
        getEffect(): Effect;
        needAlphaBlending(): bool;
        needAlphaTesting(): bool;

        _preBind(): void;
        bind(world: Matrix, mesh: Mesh): void;
        unbind(): void;

        dispose(): void;
    }

    class MultiMaterial extends Material {
        constructor(name: string, scene: Scene);

        getSubMaterial(index: number): Material;
    }

    class StandardMaterial extends Material {
        diffuseTexture: Texture;
        ambientTexture: Texture;
        opacityTexture: Texture;
        reflectionTexture: Texture;
        emissiveTexture: Texture;
        specularTexture: Texture;
        ambientColor: Color3;
        diffuseColor: Color3;
        specularColor: Color3;
        specularPower: number;
        emissiveColor: Color3;

        getRenderTargetTextures(): Texture[];
        getAnimatables(): Texture[];
    }
}