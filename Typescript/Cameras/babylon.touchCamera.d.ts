/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class TouchCamera extends FreeCamera {
        _offsetX: number;
        _offsetY: number;
        _pointerCount: number;
        _pointerPressed: number[];
        angularSensibility: number;
        moveSensibility: number;

        constructor(name: string, position: Vector3, scene: Scene);
    }
}