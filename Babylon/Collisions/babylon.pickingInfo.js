"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.PickingInfo = function () {
    };

    // Properties
    BABYLON.PickingInfo.prototype.hit = false;
    BABYLON.PickingInfo.prototype.distance = 0;
    BABYLON.PickingInfo.prototype.pickedPoint = null;
    BABYLON.PickingInfo.prototype.pickedMesh = null;
    BABYLON.PickingInfo.prototype.bu = 0;
    BABYLON.PickingInfo.prototype.bv = 0;
    BABYLON.PickingInfo.prototype.faceId = -1;

    // Methods
    BABYLON.PickingInfo.prototype.getNormal = function() {
        if (!this.pickedMesh) {
            return null;
        }

        var indices = this.pickedMesh.getIndices();
        var normals = this.pickedMesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);

        var normal0 = BABYLON.Vector3.FromArray(normals , indices[this.faceId]);
        var normal1 = BABYLON.Vector3.FromArray(normals, indices[this.faceId + 1]);
        var normal2 = BABYLON.Vector3.FromArray(normals, indices[this.faceId + 2]);

        normal0 = normal0.scale(this.bu);
        normal1 = normal1.scale(this.bv);
        normal2 = normal2.scale(1.0 - this.bu - this.bv);

        return new BABYLON.Vector3(normal0.x + normal1.x + normal2.x, normal0.y + normal1.y + normal2.y, normal0.z + normal1.z + normal2.z);
    };
})();