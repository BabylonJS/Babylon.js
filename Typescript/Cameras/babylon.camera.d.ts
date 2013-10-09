/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class Camera {
        name: string;
        id: string;
        position: Vector3;
        _scene: Scene;

        constructor(name: string, position: Vector3, scene: Scene);

        static PERSPECTIVE_CAMERA: number;
        static ORTHOGRAPHIC_CAMERA: number;

        fov: number;
        orthoLeft: number;
        orthoRight: number;
        orthoBottom: number;
        orthoTop: number;
        minZ: number;
        maxZ: number;
        intertia: number;
        mode: number;

        attachControl(canvas: HTMLCanvasElement): void;
        detachControl(canvas: HTMLCanvasElement): void;
        _update();
        getViewMatrix(): Matrix;
        getProjectionMatrix(): Matrix;
    }
}