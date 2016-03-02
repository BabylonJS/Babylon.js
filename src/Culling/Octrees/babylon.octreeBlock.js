var BABYLON;
(function (BABYLON) {
    var OctreeBlock = (function () {
        function OctreeBlock(minPoint, maxPoint, capacity, depth, maxDepth, creationFunc) {
            this.entries = new Array();
            this._boundingVectors = new Array();
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
        Object.defineProperty(OctreeBlock.prototype, "capacity", {
            // Property
            get: function () {
                return this._capacity;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(OctreeBlock.prototype, "minPoint", {
            get: function () {
                return this._minPoint;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(OctreeBlock.prototype, "maxPoint", {
            get: function () {
                return this._maxPoint;
            },
            enumerable: true,
            configurable: true
        });
        // Methods
        OctreeBlock.prototype.addEntry = function (entry) {
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
        };
        OctreeBlock.prototype.addEntries = function (entries) {
            for (var index = 0; index < entries.length; index++) {
                var mesh = entries[index];
                this.addEntry(mesh);
            }
        };
        OctreeBlock.prototype.select = function (frustumPlanes, selection, allowDuplicate) {
            if (BABYLON.BoundingBox.IsInFrustum(this._boundingVectors, frustumPlanes)) {
                if (this.blocks) {
                    for (var index = 0; index < this.blocks.length; index++) {
                        var block = this.blocks[index];
                        block.select(frustumPlanes, selection, allowDuplicate);
                    }
                    return;
                }
                if (allowDuplicate) {
                    selection.concat(this.entries);
                }
                else {
                    selection.concatWithNoDuplicate(this.entries);
                }
            }
        };
        OctreeBlock.prototype.intersects = function (sphereCenter, sphereRadius, selection, allowDuplicate) {
            if (BABYLON.BoundingBox.IntersectsSphere(this._minPoint, this._maxPoint, sphereCenter, sphereRadius)) {
                if (this.blocks) {
                    for (var index = 0; index < this.blocks.length; index++) {
                        var block = this.blocks[index];
                        block.intersects(sphereCenter, sphereRadius, selection, allowDuplicate);
                    }
                    return;
                }
                if (allowDuplicate) {
                    selection.concat(this.entries);
                }
                else {
                    selection.concatWithNoDuplicate(this.entries);
                }
            }
        };
        OctreeBlock.prototype.intersectsRay = function (ray, selection) {
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
        };
        OctreeBlock.prototype.createInnerBlocks = function () {
            BABYLON.Octree._CreateBlocks(this._minPoint, this._maxPoint, this.entries, this._capacity, this._depth, this._maxDepth, this, this._creationFunc);
        };
        return OctreeBlock;
    }());
    BABYLON.OctreeBlock = OctreeBlock;
})(BABYLON || (BABYLON = {}));
