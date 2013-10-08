/// <reference path="../../babylon.d.ts" />

declare module BABYLON {
    class OctreeBlock {
        subMeshes: Mesh[];
        meshes: Mesh[];
        _capacity: number;
        _minPoint: Vector3;
        _maxPoint: Vector3;
        _boundingVector: Vector3[];

        constructor(minPoint: Vector3, maxPoint: Vector3, capacity: number)

        addMesh(mesh: Mesh): void;
        addEntries(meshes: Mesh[]): void;
        select(frustrumPlanes: Plane[], selection: Tools.SmartArray): void;
    }
}