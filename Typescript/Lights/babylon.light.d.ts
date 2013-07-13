/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class Light {
        name: string;
        id: string;
        diffuse: Color3;
        specular: Color3;
        private _scene: Scene;

        constructor(name: string, scene: Scene);

        intensity: number;
        isEnabled: bool;
    }

    class PointLight extends Light {
        position: Vector3;
        animations: Animation[]; 

        constructor(name: string, position: Vector3, scene: Scene);
    }

    class DirectionalLight extends Light {
        direction: Vector3;
        animations: Animation[]; 

        constructor(name: string, direction: Vector3, scene: Scene);
    }
}