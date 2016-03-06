var BABYLON;
(function (BABYLON) {
    var Octree = (function () {
        function Octree(creationFunc, maxBlockCapacity, maxDepth) {
            if (maxDepth === void 0) { maxDepth = 2; }
            this.maxDepth = maxDepth;
            this.dynamicContent = new Array();
            this._maxBlockCapacity = maxBlockCapacity || 64;
            this._selectionContent = new BABYLON.SmartArray(1024);
            this._creationFunc = creationFunc;
        }
        // Methods
        Octree.prototype.update = function (worldMin, worldMax, entries) {
            Octree._CreateBlocks(worldMin, worldMax, entries, this._maxBlockCapacity, 0, this.maxDepth, this, this._creationFunc);
        };
        Octree.prototype.addMesh = function (entry) {
            for (var index = 0; index < this.blocks.length; index++) {
                var block = this.blocks[index];
                block.addEntry(entry);
            }
        };
        Octree.prototype.select = function (frustumPlanes, allowDuplicate) {
            this._selectionContent.reset();
            for (var index = 0; index < this.blocks.length; index++) {
                var block = this.blocks[index];
                block.select(frustumPlanes, this._selectionContent, allowDuplicate);
            }
            if (allowDuplicate) {
                this._selectionContent.concat(this.dynamicContent);
            }
            else {
                this._selectionContent.concatWithNoDuplicate(this.dynamicContent);
            }
            return this._selectionContent;
        };
        Octree.prototype.intersects = function (sphereCenter, sphereRadius, allowDuplicate) {
            this._selectionContent.reset();
            for (var index = 0; index < this.blocks.length; index++) {
                var block = this.blocks[index];
                block.intersects(sphereCenter, sphereRadius, this._selectionContent, allowDuplicate);
            }
            if (allowDuplicate) {
                this._selectionContent.concat(this.dynamicContent);
            }
            else {
                this._selectionContent.concatWithNoDuplicate(this.dynamicContent);
            }
            return this._selectionContent;
        };
        Octree.prototype.intersectsRay = function (ray) {
            this._selectionContent.reset();
            for (var index = 0; index < this.blocks.length; index++) {
                var block = this.blocks[index];
                block.intersectsRay(ray, this._selectionContent);
            }
            this._selectionContent.concatWithNoDuplicate(this.dynamicContent);
            return this._selectionContent;
        };
        Octree._CreateBlocks = function (worldMin, worldMax, entries, maxBlockCapacity, currentDepth, maxDepth, target, creationFunc) {
            target.blocks = new Array();
            var blockSize = new BABYLON.Vector3((worldMax.x - worldMin.x) / 2, (worldMax.y - worldMin.y) / 2, (worldMax.z - worldMin.z) / 2);
            // Segmenting space
            for (var x = 0; x < 2; x++) {
                for (var y = 0; y < 2; y++) {
                    for (var z = 0; z < 2; z++) {
                        var localMin = worldMin.add(blockSize.multiplyByFloats(x, y, z));
                        var localMax = worldMin.add(blockSize.multiplyByFloats(x + 1, y + 1, z + 1));
                        var block = new BABYLON.OctreeBlock(localMin, localMax, maxBlockCapacity, currentDepth + 1, maxDepth, creationFunc);
                        block.addEntries(entries);
                        target.blocks.push(block);
                    }
                }
            }
        };
        Octree.CreationFuncForMeshes = function (entry, block) {
            if (!entry.isBlocked && entry.getBoundingInfo().boundingBox.intersectsMinMax(block.minPoint, block.maxPoint)) {
                block.entries.push(entry);
            }
        };
        Octree.CreationFuncForSubMeshes = function (entry, block) {
            if (entry.getBoundingInfo().boundingBox.intersectsMinMax(block.minPoint, block.maxPoint)) {
                block.entries.push(entry);
            }
        };
        return Octree;
    }());
    BABYLON.Octree = Octree;
})(BABYLON || (BABYLON = {}));
