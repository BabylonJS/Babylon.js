module BABYLON {
    export class IntersectionInfo {
        public faceId = 0;

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

        // Methods
        public getNormal(): Vector3 {
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
        }
    }
} 