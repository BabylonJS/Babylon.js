/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class ArcRotateCamera extends Camera {
        alpha: number;
        beta: number;
        radius: number;
        target: Vector3;

        _keys: number[];
        keysUp: number[];
        keysDown: number[];
        keysLeft: number[];
        keysRight: number[];
        _viewMatrix: Matrix;

        constructor(name: string, alpha: number, beta: number, radius: number, target: Vector3, scene: Scene);

        inertialAlphaOffset: number;
        interialBetaOffset: number;
        lowerAlphaLimit: number;
        upperAlphaLimit: number;
        lowerBetaLimit: number;
        upperBetaLimit: number;
        lowerRadiusLimit: number;
        upperRadiusLimit: number;
        setPosition(position: Vector3): void;
    }
}