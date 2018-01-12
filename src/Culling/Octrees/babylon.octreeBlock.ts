module BABYLON {
    export class OctreeBlock<T> {
        public entries = new Array<T>();
        public blocks: Array<OctreeBlock<T>>;

        private _depth: number;
        private _maxDepth: number;
        private _capacity: number;
        private _minPoint: Vector3;
        private _maxPoint: Vector3;
        private _boundingVectors = new Array<Vector3>();
        private _creationFunc: (entry: T, block: OctreeBlock<T>) => void;

        constructor(minPoint: Vector3, maxPoint: Vector3, capacity: number, depth: number, maxDepth: number, creationFunc: (entry: T, block: OctreeBlock<T>) => void) {
            this._capacity = capacity;
            this._depth = depth;
            this._maxDepth = maxDepth;
            this._creationFunc = creationFunc;

            this._minPoint = minPoint;
            this._maxPoint = maxPoint;

            this._boundingVectors.push(minPoint.clone());
            this._boundingVectors.push(maxPoint.clone());

            this._boundingVectors.push(minPoint.clone());
            this._boundingVectors[2].x = maxPoint.x;

            this._boundingVectors.push(minPoint.clone());
            this._boundingVectors[3].y = maxPoint.y;

            this._boundingVectors.push(minPoint.clone());
            this._boundingVectors[4].z = maxPoint.z;

            this._boundingVectors.push(maxPoint.clone());
            this._boundingVectors[5].z = minPoint.z;

            this._boundingVectors.push(maxPoint.clone());
            this._boundingVectors[6].x = minPoint.x;

            this._boundingVectors.push(maxPoint.clone());
            this._boundingVectors[7].y = minPoint.y;
        }

        // Property
        public get capacity(): number {
            return this._capacity;
        }

        public get minPoint(): Vector3 {
            return this._minPoint;
        }

        public get maxPoint(): Vector3 {
            return this._maxPoint;
        }

        // Methods
        public addEntry(entry: T): void {
            if (this.blocks) {
                for (var index = 0; index < this.blocks.length; index++) {
                    var block = this.blocks[index];
                    block.addEntry(entry);
                }
                return;
            }

            this._creationFunc(entry, this);

            if (this.entries.length > this.capacity && this._depth < this._maxDepth) {
                this.createInnerBlocks();
            }
        }

        public addEntries(entries: T[]): void {
            for (var index = 0; index < entries.length; index++) {
                var mesh = entries[index];
                this.addEntry(mesh);
            }
        }

        public select(frustumPlanes: Plane[], selection: SmartArrayNoDuplicate<T>, allowDuplicate?: boolean): void {
            if (BoundingBox.IsInFrustum(this._boundingVectors, frustumPlanes)) {
                if (this.blocks) {
                    for (var index = 0; index < this.blocks.length; index++) {
                        var block = this.blocks[index];
                        block.select(frustumPlanes, selection, allowDuplicate);
                    }
                    return;
                }

                if (allowDuplicate) {
                    selection.concat(this.entries);
                } else {
                    selection.concatWithNoDuplicate(this.entries);
                }
            }
        }

        public intersects(sphereCenter: Vector3, sphereRadius: number, selection: SmartArrayNoDuplicate<T>, allowDuplicate?: boolean): void {
            if (BoundingBox.IntersectsSphere(this._minPoint, this._maxPoint, sphereCenter, sphereRadius)) {
                if (this.blocks) {
                    for (var index = 0; index < this.blocks.length; index++) {
                        var block = this.blocks[index];
                        block.intersects(sphereCenter, sphereRadius, selection, allowDuplicate);
                    }
                    return;
                }

                if (allowDuplicate) {
                    selection.concat(this.entries);
                } else {
                    selection.concatWithNoDuplicate(this.entries);
                }
            }
        }

        public intersectsRay(ray: Ray, selection: SmartArrayNoDuplicate<T>): void {
            if (ray.intersectsBoxMinMax(this._minPoint, this._maxPoint)) {
                if (this.blocks) {
                    for (var index = 0; index < this.blocks.length; index++) {
                        var block = this.blocks[index];
                        block.intersectsRay(ray, selection);
                    }
                    return;
                }
                selection.concatWithNoDuplicate(this.entries);
            }
        }

        public createInnerBlocks(): void {
            Octree._CreateBlocks(this._minPoint, this._maxPoint, this.entries, this._capacity, this._depth, this._maxDepth, this, this._creationFunc);
        }
    }
} 