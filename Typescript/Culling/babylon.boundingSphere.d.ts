/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class BoundingSphere {
        minimum: Vector3;
        maximum: Vector3;
        center: Vector3;
        radius: number;
        distance: number;
        centerWorld: Vector3;

        constructor(minimum: Vector3, maximum: Vector3);

        _update(world: Matrix, scale: number): void;
        isInFrustrum(frustrumPlanes: Plane[]): boolean;
        intersectsPoint(point: Vector3): boolean;

        static intersects(sphere0: BoundingSphere, sphere1: BoundingSphere): boolean;
    }
}