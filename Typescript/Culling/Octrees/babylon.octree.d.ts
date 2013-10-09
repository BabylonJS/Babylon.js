/// <reference path="../../babylon.d.ts" />

declare module BABYLON {
    class Octree {
        blocks: OctreeBlock[];
        _maxBlockCapacity: number;
        _selection: Tools.SmartArray;

        constructor(maxBlockCapacity: number);

        update(worldMin: Vector3, worldMax: Vector3, meshes: Mesh[]): void;
        addMesh(mesh: Mesh): void;
        select(frustrumPlanes: Plane[]): void;

        static _CreateBlocks(worldMin: Vector3, worldMax: Vector3, meshes: Mesh[], maxBlockCapacity: number, target: OctreeBlock): void;
    }
}