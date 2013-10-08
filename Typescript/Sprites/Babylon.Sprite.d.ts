/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class Sprite {
        name: string;
        color: Color4;

        position: Vector3;
        size: number;
        angle: number;
        cellIndex: number;
        invertU: number;
        invertV: number;
        disposeWhenFinishedAnimating: boolean;

        constructor(name: string, manager: SpriteManager);

        playAnimation(from: number, to: number, loop: boolean, delay: number);
        stopAnimation(): void;
        dispose(): void;
    }
}