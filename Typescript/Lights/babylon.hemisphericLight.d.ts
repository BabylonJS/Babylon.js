/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class HemisphericLight {
        direction: Vector3;
        diffuse: Color3;
        specular: Color3;
        groundColor: Color3;
        animations: Animation[];

        constructor(name: string, direction: Vector3, scene: Scene);

        getShadowGenerator(): void;
    }
}