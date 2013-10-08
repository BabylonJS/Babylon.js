/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class SubMesh {
        materialIndex: number;
        verticesStart: number;
        verticesCount: number;
        indexStart: number;
        indexCount: number;

        constructor(materialIndex: number, verticesStart: number, verticesCount: number, indexStart: number, indexCount: number, mesh: Mesh);

        getBoundingInfo(): BoundingInfo;
        getMaterial(): Material;
        refreshBoundingInfo(): void;
        updateBoundingInfo(world: Matrix, scale: Vector3): void;
        isInFrustrum(frustumPlanes: Plane[]): boolean;
        render(): void;
        getLinesIndexBuffer(indices: number[], engine: Engine): IndexBuffer;
        canIntersects(ray: Ray): boolean;
        intersects(ray: Ray, positions: Vector3[], indices: number[]): MeshRayHitTest;
        clone(newMesh: Mesh): SubMesh;

        static CreateFromIndices(materialIndex: number, startIndex: number, indexCount: number, mesh: Mesh): SubMesh;
    }
}