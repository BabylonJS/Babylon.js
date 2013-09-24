var BABYLON = BABYLON || {};

(function() {
    BABYLON.Octree = function(maxBlockCapacity) {
        this.blocks = [];
        this._maxBlockCapacity = maxBlockCapacity || 64;
        this._selection = new BABYLON.Tools.SmartArray(256);
    };

    // Methods
    BABYLON.Octree.prototype.update = function(worldMin, worldMax, meshes) {
        BABYLON.Octree._CreateBlocks(worldMin, worldMax, meshes, this._maxBlockCapacity, this);
    };
    
    BABYLON.Octree.prototype.addMesh = function (mesh) {
        for (var index = 0; index < this.blocks.length; index++) {
            var block = this.blocks[index];
            block.addMesh(mesh);
        }
    };

    BABYLON.Octree.prototype.select = function(frustumPlanes) {
        this._selection.reset();

        for (var index = 0; index < this.blocks.length; index++) {
            var block = this.blocks[index];
            block.select(frustumPlanes, this._selection);
        }

        return this._selection;
    };

    // Statics
    BABYLON.Octree._CreateBlocks = function (worldMin, worldMax, meshes, maxBlockCapacity, target) {
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
    };
})();