module BABYLON {
    /**
     * Class used to store a cell in an octree
     * @see http://doc.babylonjs.com/how_to/optimizing_your_scene_with_octrees
     */
    export class OctreeBlock<T> {
        /**
         * Gets the content of the current block
         */
        public entries = new Array<T>();

        /**
         * Gets the list of block children
         */
        public blocks: Array<OctreeBlock<T>>;

        private _depth: number;
        private _maxDepth: number;
        private _capacity: number;
        private _minPoint: Vector3;
        private _maxPoint: Vector3;
        private _boundingVectors = new Array<Vector3>();
        private _creationFunc: (entry: T, block: OctreeBlock<T>) => void;

        /**
         * Creates a new block
         * @param minPoint defines the minimum vector (in world space) of the block's bounding box
         * @param maxPoint defines the maximum vector (in world space) of the block's bounding box
         * @param capacity defines the maximum capacity of this block (if capacity is reached the block will be split into sub blocks)
         * @param depth defines the current depth of this block in the octree
         * @param maxDepth defines the maximal depth allowed (beyond this value, the capacity is ignored)
         * @param creationFunc defines a callback to call when an element is added to the block
         */
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

        /**
         * Gets the maximum capacity of this block (if capacity is reached the block will be split into sub blocks)
         */
        public get capacity(): number {
            return this._capacity;
        }

        /**
         * Gets the minimum vector (in world space) of the block's bounding box
         */
        public get minPoint(): Vector3 {
            return this._minPoint;
        }

        /**
         * Gets the maximum vector (in world space) of the block's bounding box
         */
        public get maxPoint(): Vector3 {
            return this._maxPoint;
        }

        // Methods

        /**
         * Add a new element to this block
         * @param entry defines the element to add
         */
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

        /**
         * Add an array of elements to this block
         * @param entries defines the array of elements to add
         */
        public addEntries(entries: T[]): void {
            for (var index = 0; index < entries.length; index++) {
                var mesh = entries[index];
                this.addEntry(mesh);
            }
        }

        /**
         * Test if the current block intersects the furstum planes and if yes, then add its content to the selection array
         * @param frustumPlanes defines the frustum planes to test
         * @param selection defines the array to store current content if selection is positive
         * @param allowDuplicate defines if the selection array can contains duplicated entries
         */
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

        /**
         * Test if the current block intersect with the given bounding sphere and if yes, then add its content to the selection array
         * @param sphereCenter defines the bounding sphere center
         * @param sphereRadius defines the bounding sphere radius
         * @param selection defines the array to store current content if selection is positive
         * @param allowDuplicate defines if the selection array can contains duplicated entries
         */
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

        /**
         * Test if the current block intersect with the given ray and if yes, then add its content to the selection array
         * @param ray defines the ray to test with
         * @param selection defines the array to store current content if selection is positive
         */
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

        /**
         * Subdivide the content into child blocks (this block will then be empty)
         */
        public createInnerBlocks(): void {
            Octree._CreateBlocks(this._minPoint, this._maxPoint, this.entries, this._capacity, this._depth, this._maxDepth, this, this._creationFunc);
        }
    }
}