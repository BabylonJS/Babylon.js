/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class Layer {
        name: string;
        texture: Texture;
        isBackground: bool;

        constructor(name: string, imgUrl: string, scene: Scene, isBackground: bool);

        onDispose: () => void;
        render(): void;
        dispose(): void;
    }
}