declare module BABYLON {
    interface IOctreeContainer<T> {
        blocks: OctreeBlock<T>[];
    }
    class Octree<T> {
        public maxDepth: number;
        public blocks: OctreeBlock<T>[];
        public dynamicContent: T[];
        private _maxBlockCapacity;
        private _selectionContent;
        private _creationFunc;
        constructor(creationFunc: (entry: T, block: OctreeBlock<T>) => void, maxBlockCapacity?: number, maxDepth?: number);
        public update(worldMin: Vector3, worldMax: Vector3, entries: T[]): void;
        public addMesh(entry: T): void;
        public select(frustumPlanes: Plane[], allowDuplicate?: boolean): SmartArray<T>;
        public intersects(sphereCenter: Vector3, sphereRadius: number, allowDuplicate?: boolean): SmartArray<T>;
        public intersectsRay(ray: Ray): SmartArray<T>;
        static _CreateBlocks<T>(worldMin: Vector3, worldMax: Vector3, entries: T[], maxBlockCapacity: number, currentDepth: number, maxDepth: number, target: IOctreeContainer<T>, creationFunc: (entry: T, block: OctreeBlock<T>) => void): void;
        static CreationFuncForMeshes: (entry: AbstractMesh, block: OctreeBlock<AbstractMesh>) => void;
        static CreationFuncForSubMeshes: (entry: SubMesh, block: OctreeBlock<SubMesh>) => void;
    }
}
