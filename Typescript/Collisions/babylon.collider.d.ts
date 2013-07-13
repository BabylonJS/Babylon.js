/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    interface CollisionResponse {
        position: Vector3;
        velocity: Vector3;
    }

    class Collider {
        radius: Vector3;
        retry: number;

        constructor();

        _initialize(source: Vector3, dir: Vector3, e: number): void;
        _canDoCollision(sphereCenter: Vector3, sphereRadius: number, vecMin: Vector3, vecMax: Vector3): bool;
        _testTriangle(subMesh: SubMesh, p1: Vector3, p2: Vector3, p3: Vector3): void;
        _collide(subMesh: SubMesh, pts: VertexBuffer, indices: IndexBuffer, indexStart: number, indexEnd: number, decal: number);
        _getResponse(pos: Vector3, vel: Vector3): CollisionResponse;
    }

    class CollisionPlane {
        normal: Vector3;
        origin: Vector3;
        equation: number[];

        constructor(origin: Vector3, normal: Vector3);

        isFrontFactingTo(direction: Vector3, epsilon: number): bool;
        signedDistanceTo(point: Vector3): number;

        static CreateFromPoints(p1: Vector3, p2: Vector3, p3: Vector3): CollisionPlane;
    }
}