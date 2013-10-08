/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class BoundingBox {
        minimum: Vector3;
        maximum: Vector3;
        vectors: Vector3[];
        center: Vector3;
        extends: Vector3;
        directions: Vector3[];
        vectorsWorld: Vector3[];
        minimumWorld: Vector3;
        maximumWorld: Vector3;

        constructor(minimum: Vector3, maximum: Vector3);

        _update(world: Matrix): void;
        isInFrustrum(frustrumPlanes: Plane[]): boolean;
        intersectsPoint(point: Vector3): boolean;
        intersectsSphere(sphere: Sphere): boolean;
        intersectsMinMax(min: Vector3, max: Vector3): boolean;
        IsInFrustrum(boundingVectors: Vector3[], frustrumPlanes: Plane[]): boolean;

        static intersects(box0: BoundingBox, box1: BoundingBox): boolean;
    }
}