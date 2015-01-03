declare module BABYLON {
    class OctreeBlock<T> {
        public entries: T[];
        public blocks: OctreeBlock<T>[];
        private _depth;
        private _maxDepth;
        private _capacity;
        private _minPoint;
        private _maxPoint;
        private _boundingVectors;
        private _creationFunc;
        constructor(minPoint: Vector3, maxPoint: Vector3, capacity: number, depth: number, maxDepth: number, creationFunc: (entry: T, block: OctreeBlock<T>) => void);
        public capacity : number;
        public minPoint : Vector3;
        public maxPoint : Vector3;
        public addEntry(entry: T): void;
        public addEntries(entries: T[]): void;
        public select(frustumPlanes: Plane[], selection: SmartArray<T>, allowDuplicate?: boolean): void;
        public intersects(sphereCenter: Vector3, sphereRadius: number, selection: SmartArray<T>, allowDuplicate?: boolean): void;
        public intersectsRay(ray: Ray, selection: SmartArray<T>): void;
        public createInnerBlocks(): void;
    }
}
