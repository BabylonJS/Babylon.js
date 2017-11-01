module BABYLON {
    export class IntersectionInfo {
        public faceId = 0;
        public subMeshId = 0;

        constructor(public bu: Nullable<number>, public bv: Nullable<number>, public distance: number) {
        }
    }

    export class PickingInfo {
        public hit = false;
        public distance = 0;
        public pickedPoint: Nullable<Vector3> = null;
        public pickedMesh: Nullable<AbstractMesh> = null;
        public bu = 0;
        public bv = 0;
        public faceId = -1;
        public subMeshId = 0;
        public pickedSprite: Nullable<Sprite> = null;

        // Methods
        public getNormal(useWorldCoordinates = false, useVerticesNormals = true): Nullable<Vector3> {
            if (!this.pickedMesh || !this.pickedMesh.isVerticesDataPresent(VertexBuffer.NormalKind)) {
                return null;
            }

            var indices = this.pickedMesh.getIndices();

            if (!indices) {
                return null;
            }

            var result: Vector3;

            if (useVerticesNormals) {
                var normals = (<FloatArray>this.pickedMesh.getVerticesData(VertexBuffer.NormalKind));

                var normal0 = Vector3.FromArray(normals, indices[this.faceId * 3] * 3);
                var normal1 = Vector3.FromArray(normals, indices[this.faceId * 3 + 1] * 3);
                var normal2 = Vector3.FromArray(normals, indices[this.faceId * 3 + 2] * 3);

                normal0 = normal0.scale(this.bu);
                normal1 = normal1.scale(this.bv);
                normal2 = normal2.scale(1.0 - this.bu - this.bv);

                result = new Vector3(normal0.x + normal1.x + normal2.x, normal0.y + normal1.y + normal2.y, normal0.z + normal1.z + normal2.z);
            } else {
                var positions = (<FloatArray>this.pickedMesh.getVerticesData(VertexBuffer.PositionKind));

                var vertex1 = Vector3.FromArray(positions, indices[this.faceId * 3] * 3);
                var vertex2 = Vector3.FromArray(positions, indices[this.faceId * 3 + 1] * 3);
                var vertex3 = Vector3.FromArray(positions, indices[this.faceId * 3 + 2] * 3);

                var p1p2 = vertex1.subtract(vertex2);
                var p3p2 = vertex3.subtract(vertex2);

                result = BABYLON.Vector3.Cross(p1p2, p3p2);
            }

            if (useWorldCoordinates) {
                result = Vector3.TransformNormal(result, this.pickedMesh.getWorldMatrix());
            }

            return BABYLON.Vector3.Normalize(result);
        }

        public getTextureCoordinates(): Nullable<Vector2> {
            if (!this.pickedMesh || !this.pickedMesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
                return null;
            }

            var indices = this.pickedMesh.getIndices();
            if (!indices) {
                return null;
            }

            var uvs = this.pickedMesh.getVerticesData(VertexBuffer.UVKind);
            if (!uvs) {
                return null;
            }            

            var uv0 = Vector2.FromArray(uvs, indices[this.faceId * 3] * 2);
            var uv1 = Vector2.FromArray(uvs, indices[this.faceId * 3 + 1] * 2);
            var uv2 = Vector2.FromArray(uvs, indices[this.faceId * 3 + 2] * 2);

            uv0 = uv0.scale(1.0 - this.bu - this.bv);
            uv1 = uv1.scale(this.bu);
            uv2 = uv2.scale(this.bv);

            return new Vector2(uv0.x + uv1.x + uv2.x, uv0.y + uv1.y + uv2.y);
        }
    }
} 

