module BABYLON {
    /**
     * Contains an array of blocks representing the octree
     */
    export interface IOctreeContainer<T> {
        /**
         * Blocks within the octree
         */
        blocks: Array<OctreeBlock<T>>;
    }

    /**
     * Octrees are a really powerful data structure that can quickly select entities based on space coordinates.
     * @see https://doc.babylonjs.com/how_to/optimizing_your_scene_with_octrees
     */
    export class Octree<T> {
        /**
         * Blocks within the octree containing objects
         */
        public blocks: Array<OctreeBlock<T>>;
        /**
         * Content stored in the octree
         */
        public dynamicContent = new Array<T>();

        private _maxBlockCapacity: number;
        private _selectionContent: SmartArrayNoDuplicate<T>;
        private _creationFunc: (entry: T, block: OctreeBlock<T>) => void;

        /**
         * Creates a octree
         * @see https://doc.babylonjs.com/how_to/optimizing_your_scene_with_octrees
         * @param creationFunc function to be used to instatiate the octree
         * @param maxBlockCapacity defines the maximum number of meshes you want on your octree's leaves (default: 64)
         * @param maxDepth defines the maximum depth (sub-levels) for your octree. Default value is 2, which means 8 8 8 = 512 blocks :) (This parameter takes precedence over capacity.)
         */
        constructor(creationFunc: (
            entry: T,
            block: OctreeBlock<T>) => void,
            maxBlockCapacity?: number,
            /** Defines the maximum depth (sub-levels) for your octree. Default value is 2, which means 8 8 8 = 512 blocks :) (This parameter takes precedence over capacity.) */
            public maxDepth = 2
        ) {
            this._maxBlockCapacity = maxBlockCapacity || 64;
            this._selectionContent = new SmartArrayNoDuplicate<T>(1024);
            this._creationFunc = creationFunc;
        }

        // Methods
        /**
         * Updates the octree by adding blocks for the passed in meshes within the min and max world parameters
         * @param worldMin worldMin for the octree blocks var blockSize = new Vector3((worldMax.x - worldMin.x) / 2, (worldMax.y - worldMin.y) / 2, (worldMax.z - worldMin.z) / 2);
         * @param worldMax worldMax for the octree blocks var blockSize = new Vector3((worldMax.x - worldMin.x) / 2, (worldMax.y - worldMin.y) / 2, (worldMax.z - worldMin.z) / 2);
         * @param entries meshes to be added to the octree blocks
         */
        public update(worldMin: Vector3, worldMax: Vector3, entries: T[]): void {
            Octree._CreateBlocks(worldMin, worldMax, entries, this._maxBlockCapacity, 0, this.maxDepth, this, this._creationFunc);
        }

        /**
         * Adds a mesh to the octree
         * @param entry Mesh to add to the octree
         */
        public addMesh(entry: T): void {
            for (var index = 0; index < this.blocks.length; index++) {
                var block = this.blocks[index];
                block.addEntry(entry);
            }
        }

        /**
         * Selects an array of meshes within the frustum
         * @param frustumPlanes The frustum planes to use which will select all meshes within it
         * @param allowDuplicate If duplicate objects are allowed in the resulting object array
         * @returns array of meshes within the frustum
         */
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

        /**
         * Test if the octree intersect with the given bounding sphere and if yes, then add its content to the selection array
         * @param sphereCenter defines the bounding sphere center
         * @param sphereRadius defines the bounding sphere radius
         * @param allowDuplicate defines if the selection array can contains duplicated entries
         * @returns an array of objects that intersect the sphere
         */
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

        /**
        * Test if the octree intersect with the given ray and if yes, then add its content to resulting array
         * @param ray defines the ray to test with
         * @returns array of intersected objects
         */
        public intersectsRay(ray: Ray): SmartArray<T> {
            this._selectionContent.reset();

            for (var index = 0; index < this.blocks.length; index++) {
                var block = this.blocks[index];
                block.intersectsRay(ray, this._selectionContent);
            }

            this._selectionContent.concatWithNoDuplicate(this.dynamicContent);

            return this._selectionContent;
        }

        /**
         * @hidden
         */
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

        /**
         * Adds a mesh into the octree block if it intersects the block
         */
        public static CreationFuncForMeshes = (entry: AbstractMesh, block: OctreeBlock<AbstractMesh>): void => {
            let boundingInfo = entry.getBoundingInfo();
            if (!entry.isBlocked && boundingInfo.boundingBox.intersectsMinMax(block.minPoint, block.maxPoint)) {
                block.entries.push(entry);
            }
        }

        /**
         * Adds a submesh into the octree block if it intersects the block
         */
        public static CreationFuncForSubMeshes = (entry: SubMesh, block: OctreeBlock<SubMesh>): void => {
            let boundingInfo = entry.getBoundingInfo();
            if (boundingInfo.boundingBox.intersectsMinMax(block.minPoint, block.maxPoint)) {
                block.entries.push(entry);
            }
        }
    }
}