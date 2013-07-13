/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class Sprite {
        name: string;
        position: Vector3;
        size: number;
        angle: number;
        cellIndex: number;
        invertU: number;
        invertV: number;

        constructor(name: string, manager: SpriteManager);

        playAnimation(from: number, to: number, loop: bool, delay: number);
        stopAnimation(): void;

    }

    class SpriteManager {
        name: string;
        cellSize: number;

        constructor(name: string, imgUrl: string, capacity: number, cellSize: number, scene: Scene, epsilon: number);

        onDispose: () => void;

        render(): void;
        dispose(): void;

    }
}