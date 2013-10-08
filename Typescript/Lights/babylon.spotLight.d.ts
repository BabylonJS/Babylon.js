/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class SpotLight {
        position: Vector3;
        direction: Vector3;
        angle: number;
        exponent: number;
        diffuse: Color3;
        specular: Color3;
        animations: Animation[];

        constructor(name: string, position: Vector3, direction: Vector3, angle: number, exponsent: number, scene: Scene);
    }
}