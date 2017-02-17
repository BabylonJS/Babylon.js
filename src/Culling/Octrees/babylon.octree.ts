module BABYLON {
    export interface IOctreeContainer<T> {
        blocks: Array<OctreeBlock<T>>;
    }

    export class Octree<T> {
        public blocks: Array<OctreeBlock<T>>;
        public dynamicContent = new Array<T>();

        private _maxBlockCapacity: number;
        private _selectionContent: SmartArray<T>;       
        private _creationFunc: (entry: T, block: OctreeBlock<T>) => void;

        constructor(creationFunc: (entry: T, block: OctreeBlock<T>) => void, maxBlockCapacity?: number, public maxDepth = 2) {
            this._maxBlockCapacity = maxBlockCapacity || 64;
            this._selectionContent = new SmartArray<T>(1024);
            this._creationFunc = creationFunc;
        }

        // Methods
        public update(worldMin: Vector3, worldMax: Vector3, entries: T[]): void {
            Octree._CreateBlocks(worldMin, worldMax, entries, this._maxBlockCapacity, 0, this.maxDepth, this, this._creationFunc);
        }

        public addMesh(entry: T): void {
            for (var index = 0; index < this.blocks.length; index++) {
                var block = this.blocks[index];
                block.addEntry(entry);
            }
        }

        public select(frustumPlanes: Plane[], allowDuplicate?: boolean): SmartArray<T> {
            this._selectionContent.reset();

            for (var index = 0; index < this.blocks.length; index++) {
                var block = this.blocks[index];
                block.select(frustumPlanes, this._selectionContent, allowDuplicate);
            }

            if (allowDuplicate) {
                this._selectionContent.concat(this.dynamicContent);
            } else {
                this._selectionContent.concatWithNoDuplicate(this.dynamicContent);                
            }

            return this._selectionContent;
        }

        public intersects(sphereCenter: Vector3, sphereRadius: number, allowDuplicate?: boolean): SmartArray<T> {
            this._selectionContent.reset();

            for (var index = 0; index < this.blocks.length; index++) {
                var block = this.blocks[index];
                block.intersects(sphereCenter, sphereRadius, this._selectionContent, allowDuplicate);
            }

            if (allowDuplicate) {
                this._selectionContent.concat(this.dynamicContent);
            } else {
                this._selectionContent.concatWithNoDuplicate(this.dynamicContent);
            }

            return this._selectionContent;
        }

        public intersectsRay(ray: Ray): SmartArray<T> {
            this._selectionContent.reset();

            for (var index = 0; index < this.blocks.length; index++) {
                var block = this.blocks[index];
                block.intersectsRay(ray, this._selectionContent);
            }

            this._selectionContent.concatWithNoDuplicate(this.dynamicContent);

            return this._selectionContent;
        }

        public static _CreateBlocks<T>(worldMin: Vector3, worldMax: Vector3, entries: T[], maxBlockCapacity: number, currentDepth: number, maxDepth: number, target: IOctreeContainer<T>, creationFunc: (entry: T, block: OctreeBlock<T>) => void): void {
            target.blocks = new Array<OctreeBlock<T>>();
            var blockSize = new Vector3((worldMax.x - worldMin.x) / 2, (worldMax.y - worldMin.y) / 2, (worldMax.z - worldMin.z) / 2);

            // Segmenting space
            for (var x = 0; x < 2; x++) {
                for (var y = 0; y < 2; y++) {
                    for (var z = 0; z < 2; z++) {
                        var localMin = worldMin.add(blockSize.multiplyByFloats(x, y, z));
                        var localMax = worldMin.add(blockSize.multiplyByFloats(x + 1, y + 1, z + 1));

                        var block = new OctreeBlock<T>(localMin, localMax, maxBlockCapacity, currentDepth + 1, maxDepth, creationFunc);
                        block.addEntries(entries);
                        target.blocks.push(block);
                    }
                }
            }
        }

        public static CreationFuncForMeshes = (entry: AbstractMesh, block: OctreeBlock<AbstractMesh>): void => {
            if (!entry.isBlocked && entry.getBoundingInfo().boundingBox.intersectsMinMax(block.minPoint, block.maxPoint)) {
                block.entries.push(entry);
            }
        }

        public static CreationFuncForSubMeshes = (entry: SubMesh, block: OctreeBlock<SubMesh>): void => {
            if (entry.getBoundingInfo().boundingBox.intersectsMinMax(block.minPoint, block.maxPoint)) {
                block.entries.push(entry);
            }
        }
    }
} 