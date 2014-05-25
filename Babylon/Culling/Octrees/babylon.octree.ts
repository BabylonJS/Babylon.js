module BABYLON {
    export interface IOctreeContainer {
        blocks: Array<OctreeBlock>;
    }

    export class Octree {
        public blocks: Array<OctreeBlock>;
        private _maxBlockCapacity: number;
        private _selection;


        constructor(maxBlockCapacity?: number) {
            this._maxBlockCapacity = maxBlockCapacity || 64;
            this._selection = new BABYLON.SmartArray<OctreeBlock>(256);
        }

        // Methods
        public update(worldMin: Vector3, worldMax: Vector3, meshes): void {
            Octree._CreateBlocks(worldMin, worldMax, meshes, this._maxBlockCapacity, this);
        }

        public addMesh(mesh): void {
            for (var index = 0; index < this.blocks.length; index++) {
                var block = this.blocks[index];
                block.addMesh(mesh);
            }
        }

        public select(frustumPlanes: Plane[]): SmartArray<OctreeBlock> {
            this._selection.reset();

            for (var index = 0; index < this.blocks.length; index++) {
                var block = this.blocks[index];
                block.select(frustumPlanes, this._selection);
            }

            return this._selection;
        }

        // Statics
        static _CreateBlocks(worldMin: Vector3, worldMax: Vector3, meshes, maxBlockCapacity: number, target: IOctreeContainer): void {
            target.blocks = [];
            var blockSize = new BABYLON.Vector3((worldMax.x - worldMin.x) / 2, (worldMax.y - worldMin.y) / 2, (worldMax.z - worldMin.z) / 2);

            // Segmenting space
            for (var x = 0; x < 2; x++) {
                for (var y = 0; y < 2; y++) {
                    for (var z = 0; z < 2; z++) {
                        var localMin = worldMin.add(blockSize.multiplyByFloats(x, y, z));
                        var localMax = worldMin.add(blockSize.multiplyByFloats(x + 1, y + 1, z + 1));

                        var block = new BABYLON.OctreeBlock(localMin, localMax, maxBlockCapacity);
                        block.addEntries(meshes);
                        target.blocks.push(block);
                    }
                }
            }
        }
    }
} 