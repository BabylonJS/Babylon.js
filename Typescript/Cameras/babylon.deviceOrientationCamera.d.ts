/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class DeviceOrientationCamera extends FreeCamera {
        angularSensibility: number;
        moveSensibility: number;

        constructor(name: string, position: Vector3, scene: Scene);

        _offsetX: number;
        _offsetY: number;
        _orientationGamma: number;
        _orientationBeta: number;
        _initialOrientationGamma: number;
        _initialOrientationBeta: number;
    }
}