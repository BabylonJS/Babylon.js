var BABYLON = BABYLON || {};

(function () {
    BABYLON.OctreeBlock = function (x, y, z, minPoint, maxPoint) {
        this.subMeshes = [];
        this.meshes = [];
        this.x = x;
        this.y = y;
        this.z = z;

        this._minPoint = minPoint;
        this._maxPoint = maxPoint;
        
        this._boundingVectors = [];

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
    };

    // Methods
    BABYLON.OctreeBlock.prototype.addEntries = function (meshes) {
        for (var index = 0; index < meshes.length; index++) {
            var mesh = meshes[index];

            if (mesh.getBoundingInfo().boundingBox.intersectsMinMax(this._minPoint, this._maxPoint)) {
                var localMeshIndex = this.meshes.length;
                this.meshes.push(mesh);

                this.subMeshes[localMeshIndex] = [];
                for (var subIndex = 0; subIndex < mesh.subMeshes.length; subIndex++) {
                    var subMesh = mesh.subMeshes[subIndex];
                    if (mesh.subMeshes.length === 1 || subMesh.getBoundingInfo().boundingBox.intersectsMinMax(this._minPoint, this._maxPoint)) {
                        this.subMeshes[localMeshIndex].push(subMesh);
                    }
                }
            }
        }
    };

    BABYLON.OctreeBlock.prototype.intersects = function(frustumPlanes) {
        if (BABYLON.BoundingBox.IsInFrustrum(this._boundingVectors, frustumPlanes)) {
            return true;
        }

        return false;
    };
})();