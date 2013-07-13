/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class BoundingBox {
        minimum: Vector3;
        maximum: Vector3;
        vectors: Vector3[];
        center: Vector3;
        extends: Vector3;
        directions: Vector3[];

        constructor(vertices: VertexBuffer, stride: number, start: number, count: number);

        _update(world: Matrix): void;
        isInFrustrum(frustrumPlanes: Plane[]): bool;
        intersectsPoint(point: Vector3): bool;
        
        static intersects(box0: BoundingBox, box1: BoundingBox): bool;
    }

    class BoundingSphere {
        minimum: Vector3;
        maximum: Vector3;
        center: Vector3;
        radius: number;

        constructor(vertices: VertexBuffer, stride: number, start: number, count: number);

        _update(world: Matrix, scale: number): void;
        isInFrustrum(frustrumPlanes: Plane[]): bool;
        intersectsPoint(point: Vector3): bool;

        static intersects(sphere0: BoundingSphere, sphere1: BoundingSphere): bool;
    }

    class BoundingInfo {
        boundingBox: BoundingBox;
        boundingSphere: BoundingSphere;

        constructor(vertices: VertexBuffer, stride: number, start: number, count: number);

        _update(world: Matrix, scale: number): void;
        isInFrustrum(frustrumPlanes: Plane[]): bool;
        _checkCollision(collider: Collider): bool;
        intersectsPoint(point: Vector3): bool;
        intersects(boundingInfo: BoundingInfo, precise: bool): bool;

    }
}