/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class PointLight extends Light {
        position: Vector3;
        diffuse: Color3;
        specular: Color3;
        animations: Animation[];

        constructor(name: string, position: Vector3, scene: Scene)
    }
}