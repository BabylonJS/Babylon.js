/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class DirectionalLight extends Light {
        direction: Vector3;
        animations: Animation[];
        position: Vector3;
        diffuse: Color3;
        specular: Color3;

        constructor(name: string, direction: Vector3, scene: Scene);
    }
}