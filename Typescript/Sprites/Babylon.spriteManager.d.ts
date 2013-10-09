/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class SpriteManager {
        name: string;
        cellSize: number;

        constructor(name: string, imgUrl: string, capacity: number, cellSize: number, scene: Scene, epsilon: number);

        indicies: number[];
        index: number;
        sprites: Sprite[];

        onDispose: () => void;

        render(): void;
        dispose(): void;

    }
}