var BABYLON;
(function (BABYLON) {
    var OctreeBlock = (function () {
        function OctreeBlock(minPoint, maxPoint, capacity) {
            this.meshes = new Array();
            this.subMeshes = new Array();
            this._boundingVectors = new Array();
            this._capacity = capacity;

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
        // Methods
        OctreeBlock.prototype.addMesh = function (mesh) {
            if (this.blocks) {
                for (var index = 0; index < this.blocks.length; index++) {
                    var block = this.blocks[index];
                    block.addMesh(mesh);
                }
                return;
            }

            if (mesh.getBoundingInfo().boundingBox.intersectsMinMax(this._minPoint, this._maxPoint)) {
                var localMeshIndex = this.meshes.length;
                this.meshes.push(mesh);

                this.subMeshes[localMeshIndex] = [];
                if (mesh.subMeshes) {
                    for (var subIndex = 0; subIndex < mesh.subMeshes.length; subIndex++) {
                        var subMesh = mesh.subMeshes[subIndex];
                        if (mesh.subMeshes.length === 1 || subMesh.getBoundingInfo().boundingBox.intersectsMinMax(this._minPoint, this._maxPoint)) {
                            this.subMeshes[localMeshIndex].push(subMesh);
                        }
                    }
                }
            }

            if (this.subMeshes.length > this._capacity) {
                BABYLON.Octree._CreateBlocks(this._minPoint, this._maxPoint, this.meshes, this._capacity, this);
            }
        };

        OctreeBlock.prototype.addEntries = function (meshes) {
            for (var index = 0; index < meshes.length; index++) {
                var mesh = meshes[index];
                this.addMesh(mesh);
            }
        };

        OctreeBlock.prototype.select = function (frustumPlanes, selection) {
            if (this.blocks) {
                for (var index = 0; index < this.blocks.length; index++) {
                    var block = this.blocks[index];
                    block.select(frustumPlanes, selection);
                }
                return;
            }
            if (BABYLON.BoundingBox.IsInFrustum(this._boundingVectors, frustumPlanes)) {
                selection.push(this);
            }
        };
        return OctreeBlock;
    })();
    BABYLON.OctreeBlock = OctreeBlock;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.octreeBlock.js.map
