/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class BoundingInfo {
        boundingBox: BoundingBox;
        boundingSphere: BoundingSphere;

        constructor(minimum: Vector3, maximum, Vector3);

        _update(world: Matrix, scale: number): void;

        extentsOverlap(min0, max0, min1, max1): boolean;
        computeBoxExtents(axis: Vector3, box: BoundingBox): Object;
        axisOverlap(axis: Vector3, box0: BoundingBox, box1: BoundingBox): boolean;
        isInFrustrum(frustrumPlanes: Plane[]): boolean;
        _checkCollision(collider: Collider): boolean;
        intersectsPoint(point: Vector3): boolean;
        intersects(boundingInfo: BoundingInfo, precise: boolean): boolean;

    }
}