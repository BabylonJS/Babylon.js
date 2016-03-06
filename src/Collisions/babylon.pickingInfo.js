var BABYLON;
(function (BABYLON) {
    var IntersectionInfo = (function () {
        function IntersectionInfo(bu, bv, distance) {
            this.bu = bu;
            this.bv = bv;
            this.distance = distance;
            this.faceId = 0;
            this.subMeshId = 0;
        }
        return IntersectionInfo;
    }());
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
            this.subMeshId = 0;
            this.pickedSprite = null;
        }
        // Methods
        PickingInfo.prototype.getNormal = function (useWorldCoordinates, useVerticesNormals) {
            if (useWorldCoordinates === void 0) { useWorldCoordinates = false; }
            if (useVerticesNormals === void 0) { useVerticesNormals = true; }
            if (!this.pickedMesh || !this.pickedMesh.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                return null;
            }
            var indices = this.pickedMesh.getIndices();
            var result;
            if (useVerticesNormals) {
                var normals = this.pickedMesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
                var normal0 = BABYLON.Vector3.FromArray(normals, indices[this.faceId * 3] * 3);
                var normal1 = BABYLON.Vector3.FromArray(normals, indices[this.faceId * 3 + 1] * 3);
                var normal2 = BABYLON.Vector3.FromArray(normals, indices[this.faceId * 3 + 2] * 3);
                normal0 = normal0.scale(this.bu);
                normal1 = normal1.scale(this.bv);
                normal2 = normal2.scale(1.0 - this.bu - this.bv);
                result = new BABYLON.Vector3(normal0.x + normal1.x + normal2.x, normal0.y + normal1.y + normal2.y, normal0.z + normal1.z + normal2.z);
            }
            else {
                var positions = this.pickedMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
                var vertex1 = BABYLON.Vector3.FromArray(positions, indices[this.faceId * 3] * 3);
                var vertex2 = BABYLON.Vector3.FromArray(positions, indices[this.faceId * 3 + 1] * 3);
                var vertex3 = BABYLON.Vector3.FromArray(positions, indices[this.faceId * 3 + 2] * 3);
                var p1p2 = vertex1.subtract(vertex2);
                var p3p2 = vertex3.subtract(vertex2);
                result = BABYLON.Vector3.Cross(p1p2, p3p2);
            }
            if (useWorldCoordinates) {
                result = BABYLON.Vector3.TransformNormal(result, this.pickedMesh.getWorldMatrix());
            }
            return BABYLON.Vector3.Normalize(result);
        };
        PickingInfo.prototype.getTextureCoordinates = function () {
            if (!this.pickedMesh || !this.pickedMesh.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind)) {
                return null;
            }
            var indices = this.pickedMesh.getIndices();
            var uvs = this.pickedMesh.getVerticesData(BABYLON.VertexBuffer.UVKind);
            var uv0 = BABYLON.Vector2.FromArray(uvs, indices[this.faceId * 3] * 2);
            var uv1 = BABYLON.Vector2.FromArray(uvs, indices[this.faceId * 3 + 1] * 2);
            var uv2 = BABYLON.Vector2.FromArray(uvs, indices[this.faceId * 3 + 2] * 2);
            uv0 = uv0.scale(1.0 - this.bu - this.bv);
            uv1 = uv1.scale(this.bu);
            uv2 = uv2.scale(this.bv);
            return new BABYLON.Vector2(uv0.x + uv1.x + uv2.x, uv0.y + uv1.y + uv2.y);
        };
        return PickingInfo;
    }());
    BABYLON.PickingInfo = PickingInfo;
})(BABYLON || (BABYLON = {}));
