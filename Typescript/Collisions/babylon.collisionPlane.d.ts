/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class CollisionPlane {
        normal: Vector3;
        origin: Vector3;
        equation: number[];

        constructor(origin: Vector3, normal: Vector3);

        isFrontFactingTo(direction: Vector3, epsilon: number): boolean;
        signedDistanceTo(point: Vector3): number;

        static CreateFromPoints(p1: Vector3, p2: Vector3, p3: Vector3): CollisionPlane;
    }
}