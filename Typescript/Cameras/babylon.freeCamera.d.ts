/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class FreeCamera extends Camera {
        cameraDirection: Vector3;
        cameraRotation: Vector2;
        rotation: Vector3;
        ellipsoid: Vector3;
        _keys: number[];
        keysUp: number[];
        keysDown: number[];
        keysLeft: number[];
        keysRight: number[];
        _collider: Collider;
        _needsMoveForGravity: boolean;
        animations: Animation[];

        constructor(name: string, position: Vector3, scene: Scene);

        speed: number;
        checkCollisions: boolean;
        applyGravity: boolean;

        _computeLocalCameraSpeed(): number;
        setTarget(target: Vector3): void;
        _collideWithWorld(velocity: Vector3): void;
        _checkInputs();
    }
}