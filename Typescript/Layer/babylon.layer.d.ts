/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class Layer {
        name: string;
        texture: Texture;
        isBackground: boolean;
        color: Color4;
        _scene: Scene;
        vertices: number[];
        indicies: number[];
        _indexBuffer: IndexBuffer;
        _effect: Effect;

        constructor(name: string, imgUrl: string, scene: Scene, isBackground: boolean, color: Color4);

        onDispose: () => void;
        render(): void;
        dispose(): void;
    }
}