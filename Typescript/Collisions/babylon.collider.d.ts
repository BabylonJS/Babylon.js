/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    interface CollisionResponse {
        position: Vector3;
        velocity: Vector3;
    }

    class Collider {
        radius: Vector3;
        retry: number;

        basePointWorld: Vector3;
        velocityWorld: Vector3;
        normalizedVelocity: Vector3;

        constructor();

        _initialize(source: Vector3, dir: Vector3, e: number): void;
        _checkPontInTriangle(point: Vector3, pa: Vector3, pb: Vector3, pc: Vector3, n: Vector3): boolean;
        intersectBoxAASphere(boxMin: Vector3, boxMax: Vector3, sphereCenter: Vector3, sphereRadius: number): boolean;
        getLowestRoot(a: number, b: number, c: number, maxR: number): Object;
        _canDoCollision(sphereCenter: Vector3, sphereRadius: number, vecMin: Vector3, vecMax: Vector3): boolean;
        _testTriangle(subMesh: SubMesh, p1: Vector3, p2: Vector3, p3: Vector3): void;
        _collide(subMesh: SubMesh, pts: VertexBuffer, indices: IndexBuffer, indexStart: number, indexEnd: number, decal: number);
        _getResponse(pos: Vector3, vel: Vector3): CollisionResponse;
    }
}