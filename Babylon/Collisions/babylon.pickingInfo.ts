module BABYLON {
    export class IntersectionInfo {
        public faceId = 0;
        public subMeshId = 0;

        constructor(public bu: number, public bv: number, public distance: number) {
        }
    }

    export class PickingInfo {
        public hit = false;
        public distance = 0;
        public pickedPoint: Vector3 = null;
        public pickedMesh: AbstractMesh = null;
        public bu = 0;
        public bv = 0;
        public faceId = -1;
        public subMeshId = 0;

        // Methods
        public getNormal(useWorldCoordinates = false): Vector3 {
            if (!this.pickedMesh || !this.pickedMesh.isVerticesDataPresent(VertexBuffer.NormalKind)) {
                return null;
            }

            var indices = this.pickedMesh.getIndices();
            var normals = this.pickedMesh.getVerticesData(VertexBuffer.NormalKind);

            var normal0 = Vector3.FromArray(normals, indices[this.faceId * 3] * 3);
            var normal1 = Vector3.FromArray(normals, indices[this.faceId * 3 + 1] * 3);
            var normal2 = Vector3.FromArray(normals, indices[this.faceId * 3 + 2] * 3);

            normal0 = normal0.scale(this.bu);
            normal1 = normal1.scale(this.bv);
            normal2 = normal2.scale(1.0 - this.bu - this.bv);

            var result = new Vector3(normal0.x + normal1.x + normal2.x, normal0.y + normal1.y + normal2.y, normal0.z + normal1.z + normal2.z);
            if (useWorldCoordinates) {
                result = Vector3.TransformNormal(result, this.pickedMesh.getWorldMatrix());
            }
            return result;
        }

        public getTextureCoordinates(): Vector2 {
            if (!this.pickedMesh || !this.pickedMesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
                return null;
            }

            var indices = this.pickedMesh.getIndices();
            var uvs = this.pickedMesh.getVerticesData(VertexBuffer.UVKind);

            var uv0 = Vector2.FromArray(uvs, indices[this.faceId * 3] * 2);
            var uv1 = Vector2.FromArray(uvs, indices[this.faceId * 3 + 1] * 2);
            var uv2 = Vector2.FromArray(uvs, indices[this.faceId * 3 + 2] * 2);

            uv0 = uv0.scale(this.bu);
            uv1 = uv1.scale(this.bv);
            uv2 = uv2.scale(1.0 - this.bu - this.bv);

            return new Vector2(uv0.x + uv1.x + uv2.x, uv0.y + uv1.y + uv2.y);
        }
    }
} 