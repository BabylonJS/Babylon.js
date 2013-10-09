/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class Particle {
        position: Vector3;
        direction: Vector3;
        lifetime: number;
        age: number;
        size: number;
        angle: number;
        angularSpeed: number;
        color: Color4;
        colorStep: Color4;

        constructor();

    }
}