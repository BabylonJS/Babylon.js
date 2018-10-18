module BABYLON {
    /**
     * @hidden
     */
    export class IntersectionInfo {
        public faceId = 0;
        public subMeshId = 0;

        constructor(
            public bu: Nullable<number>,
            public bv: Nullable<number>,
            public distance: number) {
        }
    }

    /**
     * Information about the result of picking within a scene
     * @see https://doc.babylonjs.com/babylon101/picking_collisions
     */
    export class PickingInfo {
        /**
         * If the pick collided with an object
         */
        public hit = false;
        /**
         * Distance away where the pick collided
         */
        public distance = 0;
        /**
         * The location of pick collision
         */
        public pickedPoint: Nullable<Vector3> = null;
        /**
         * The mesh corresponding the the pick collision
         */
        public pickedMesh: Nullable<AbstractMesh> = null;
        /** (See getTextureCoordinates) The barycentric U coordinate that is used when calulating the texture coordinates of the collision.*/
        public bu = 0;
        /** (See getTextureCoordinates) The barycentric V coordinate that is used when calulating the texture coordinates of the collision.*/
        public bv = 0;
        /** The id of the face on the mesh that was picked  */
        public faceId = -1;
        /** Id of the the submesh that was picked */
        public subMeshId = 0;
        /** If a sprite was picked, this will be the sprite the pick collided with */
        public pickedSprite: Nullable<Sprite> = null;
        /**
         * If a mesh was used to do the picking (eg. 6dof controller) this will be populated.
         */
        public originMesh: Nullable<AbstractMesh> = null;
        /**
         * The ray that was used to perform the picking.
         */
        public ray: Nullable<Ray> = null;

        /**
         * Gets the normal correspodning to the face the pick collided with
         * @param useWorldCoordinates If the resulting normal should be relative to the world (default: false)
         * @param useVerticesNormals If the vertices normals should be used to calculate the normal instead of the normal map
         * @returns The normal correspodning to the face the pick collided with
         */
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

                result = Vector3.Cross(p1p2, p3p2);
            }

            if (useWorldCoordinates) {
                let wm = this.pickedMesh.getWorldMatrix();

                if (this.pickedMesh.nonUniformScaling) {
                    Tmp.Matrix[0].copyFrom(wm);
                    wm = Tmp.Matrix[0];
                    wm.setTranslationFromFloats(0, 0, 0);
                    wm.invert();
                    wm.transposeToRef(Tmp.Matrix[1]);

                    wm = Tmp.Matrix[1];
                }

                result = Vector3.TransformNormal(result, wm);
            }

            result.normalize();

            return result;
        }

        /**
         * Gets the texture coordinates of where the pick occured
         * @returns the vector containing the coordnates of the texture
         */
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
