/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class Camera {
        name: string;
        id: string;
        position: Vector3;
        _scene: Scene;

        constructor(name: string, position: Vector3, scene: Scene);

        fov: number;
        minZ: number;
        maxZ: number;
        intertia: number;

        attachControl(canvas: HTMLCanvasElement): void;
        detachControl(canvas: HTMLCanvasElement): void;
        _update();
        getViewMatrix(): Matrix;
        getProjectionMatrix(): Matrix;
    }

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
        _needsMoveForGravity: bool;
        animations: Animation[];

        constructor(name: string, position: Vector3, scene: Scene);

        speed: number;
        checkCollisions: bool;
        applyGravity: bool;

        _computeLocalCameraSpeed(): number;
        setTarget(target: Vector3): void;
        _collideWithWorld(velocity: Vector3): void;
        _checkInputs();
    }

    class TouchCamera extends FreeCamera {
        _offsetX: number;
        _offsetY: number;
        _pointerCount: number;
        _pointerPressed: number[];

        constructor(name: string, position: Vector3, scene: Scene);
    }

    class ArcRotateCamera extends Camera {
        alpha: number;
        beta: number;
        radius: number;
        target: Vector3;

        constructor(name: string, alpha: number, beta: number, radius: number, target: Vector3, scene: Scene);

        inertialAlphaOffset: number;
        interialBetaOffset: number;
        setPosition(position: Vector3): void;
    }
}