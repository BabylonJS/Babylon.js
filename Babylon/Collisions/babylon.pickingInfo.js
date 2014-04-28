var BABYLON;
(function (BABYLON) {
    var IntersectionInfo = (function () {
        function IntersectionInfo(bu, bv, distance) {
            this.bu = bu;
            this.bv = bv;
            this.distance = distance;
            this.faceId = 0;
        }
        return IntersectionInfo;
    })();
    BABYLON.IntersectionInfo = IntersectionInfo;

    var PickingInfo = (function () {
        function PickingInfo() {
            this.hit = false;
            this.distance = 0;
            this.pickedPoint = null;
            this.pickedMesh = null;
            this.bu = 0;
            this.bv = 0;
            this.faceId = -1;
        }
        // Methods
        PickingInfo.prototype.getNormal = function () {
            if (!this.pickedMesh) {
                return null;
            }

            var indices = this.pickedMesh.getIndices();
            var normals = this.pickedMesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);

            var normal0 = BABYLON.Vector3.FromArray(normals, indices[this.faceId * 3] * 3);
            var normal1 = BABYLON.Vector3.FromArray(normals, indices[this.faceId * 3 + 1] * 3);
            var normal2 = BABYLON.Vector3.FromArray(normals, indices[this.faceId * 3 + 2] * 3);

            normal0 = normal0.scale(this.bu);
            normal1 = normal1.scale(this.bv);
            normal2 = normal2.scale(1.0 - this.bu - this.bv);

            return new BABYLON.Vector3(normal0.x + normal1.x + normal2.x, normal0.y + normal1.y + normal2.y, normal0.z + normal1.z + normal2.z);
        };
        return PickingInfo;
    })();
    BABYLON.PickingInfo = PickingInfo;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.pickingInfo.js.map
