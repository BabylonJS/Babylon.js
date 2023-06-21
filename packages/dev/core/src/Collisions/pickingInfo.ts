import type { Nullable, FloatArray } from "../types";
import { Vector3, Vector2, TmpVectors } from "../Maths/math.vector";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { TransformNode } from "../Meshes/transformNode";
import { VertexBuffer } from "../Buffers/buffer";
import type { Sprite } from "../Sprites/sprite";

import type { Ray } from "../Culling/ray";

/**
 * Information about the result of picking within a scene
 * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/interactions/picking_collisions
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
     * The mesh corresponding the pick collision
     */
    public pickedMesh: Nullable<AbstractMesh> = null;
    /** (See getTextureCoordinates) The barycentric U coordinate that is used when calculating the texture coordinates of the collision.*/
    public bu = 0;
    /** (See getTextureCoordinates) The barycentric V coordinate that is used when calculating the texture coordinates of the collision.*/
    public bv = 0;
    /** The index of the face on the mesh that was picked, or the index of the Line if the picked Mesh is a LinesMesh */
    public faceId = -1;
    /** The index of the face on the subMesh that was picked, or the index of the Line if the picked Mesh is a LinesMesh */
    public subMeshFaceId = -1;
    /** Id of the submesh that was picked */
    public subMeshId = 0;
    /** If a sprite was picked, this will be the sprite the pick collided with */
    public pickedSprite: Nullable<Sprite> = null;
    /** If we are picking a mesh with thin instance, this will give you the picked thin instance */
    public thinInstanceIndex = -1;
    /**
     * The ray that was used to perform the picking.
     */
    public ray: Nullable<Ray> = null;
    /**
     * If a mesh was used to do the picking (eg. 6dof controller) as a "near interaction", this will be populated.
     */
    public originMesh: Nullable<AbstractMesh> = null;
    /**
     * The aim-space transform of the input used for picking, if it is an XR input source.
     */
    public aimTransform: Nullable<TransformNode> = null;
    /**
     * The grip-space transform of the input used for picking, if it is an XR input source.
     * Some XR sources, such as input coming from head mounted displays, do not have this.
     */
    public gripTransform: Nullable<TransformNode> = null;

    /**
     * Gets the normal corresponding to the face the pick collided with
     * @param useWorldCoordinates If the resulting normal should be relative to the world (default: false)
     * @param useVerticesNormals If the vertices normals should be used to calculate the normal instead of the normal map (default: true)
     * @returns The normal corresponding to the face the pick collided with
     * @remarks Note that the returned normal will always point towards the picking ray.
     */
    public getNormal(useWorldCoordinates = false, useVerticesNormals = true): Nullable<Vector3> {
        if (!this.pickedMesh || (useVerticesNormals && !this.pickedMesh.isVerticesDataPresent(VertexBuffer.NormalKind))) {
            return null;
        }

        let indices = this.pickedMesh.getIndices();

        if (indices?.length === 0) {
            indices = null;
        }

        let result: Vector3;

        const tmp0 = TmpVectors.Vector3[0];
        const tmp1 = TmpVectors.Vector3[1];
        const tmp2 = TmpVectors.Vector3[2];

        if (useVerticesNormals) {
            const normals = <FloatArray>this.pickedMesh.getVerticesData(VertexBuffer.NormalKind);

            let normal0 = indices
                ? Vector3.FromArrayToRef(normals, indices[this.faceId * 3] * 3, tmp0)
                : tmp0.copyFromFloats(normals[this.faceId * 3 * 3], normals[this.faceId * 3 * 3 + 1], normals[this.faceId * 3 * 3 + 2]);
            let normal1 = indices
                ? Vector3.FromArrayToRef(normals, indices[this.faceId * 3 + 1] * 3, tmp1)
                : tmp1.copyFromFloats(normals[(this.faceId * 3 + 1) * 3], normals[(this.faceId * 3 + 1) * 3 + 1], normals[(this.faceId * 3 + 1) * 3 + 2]);
            let normal2 = indices
                ? Vector3.FromArrayToRef(normals, indices[this.faceId * 3 + 2] * 3, tmp2)
                : tmp2.copyFromFloats(normals[(this.faceId * 3 + 2) * 3], normals[(this.faceId * 3 + 2) * 3 + 1], normals[(this.faceId * 3 + 2) * 3 + 2]);

            normal0 = normal0.scale(this.bu);
            normal1 = normal1.scale(this.bv);
            normal2 = normal2.scale(1.0 - this.bu - this.bv);

            result = new Vector3(normal0.x + normal1.x + normal2.x, normal0.y + normal1.y + normal2.y, normal0.z + normal1.z + normal2.z);
        } else {
            const positions = <FloatArray>this.pickedMesh.getVerticesData(VertexBuffer.PositionKind);

            const vertex1 = indices
                ? Vector3.FromArrayToRef(positions, indices[this.faceId * 3] * 3, tmp0)
                : tmp0.copyFromFloats(positions[this.faceId * 3 * 3], positions[this.faceId * 3 * 3 + 1], positions[this.faceId * 3 * 3 + 2]);
            const vertex2 = indices
                ? Vector3.FromArrayToRef(positions, indices[this.faceId * 3 + 1] * 3, tmp1)
                : tmp1.copyFromFloats(positions[(this.faceId * 3 + 1) * 3], positions[(this.faceId * 3 + 1) * 3 + 1], positions[(this.faceId * 3 + 1) * 3 + 2]);
            const vertex3 = indices
                ? Vector3.FromArrayToRef(positions, indices[this.faceId * 3 + 2] * 3, tmp2)
                : tmp2.copyFromFloats(positions[(this.faceId * 3 + 2) * 3], positions[(this.faceId * 3 + 2) * 3 + 1], positions[(this.faceId * 3 + 2) * 3 + 2]);

            const p1p2 = vertex1.subtract(vertex2);
            const p3p2 = vertex3.subtract(vertex2);

            result = Vector3.Cross(p1p2, p3p2);
        }

        const transformNormalToWorld = (pickedMesh: AbstractMesh, n: Vector3) => {
            let wm = pickedMesh.getWorldMatrix();

            if (pickedMesh.nonUniformScaling) {
                TmpVectors.Matrix[0].copyFrom(wm);
                wm = TmpVectors.Matrix[0];
                wm.setTranslationFromFloats(0, 0, 0);
                wm.invert();
                wm.transposeToRef(TmpVectors.Matrix[1]);

                wm = TmpVectors.Matrix[1];
            }

            Vector3.TransformNormalToRef(n, wm, n);
        };

        if (useWorldCoordinates) {
            transformNormalToWorld(this.pickedMesh, result);
        }

        if (this.ray) {
            const normalForDirectionChecking = TmpVectors.Vector3[0].copyFrom(result);

            if (!useWorldCoordinates) {
                // the normal has not been transformed to world space as part as the normal processing, so we must do it now
                transformNormalToWorld(this.pickedMesh, normalForDirectionChecking);
            }

            // Flip the normal if the picking ray is in the same direction.
            if (Vector3.Dot(normalForDirectionChecking, this.ray.direction) > 0) {
                result.negateInPlace();
            }
        }

        result.normalize();

        return result;
    }

    /**
     * Gets the texture coordinates of where the pick occurred
     * @param uvSet The UV set to use to calculate the texture coordinates (default: VertexBuffer.UVKind)
     * @returns The vector containing the coordinates of the texture
     */
    public getTextureCoordinates(uvSet = VertexBuffer.UVKind): Nullable<Vector2> {
        if (!this.pickedMesh || !this.pickedMesh.isVerticesDataPresent(uvSet)) {
            return null;
        }

        const indices = this.pickedMesh.getIndices();
        if (!indices) {
            return null;
        }

        const uvs = this.pickedMesh.getVerticesData(uvSet);
        if (!uvs) {
            return null;
        }

        let uv0 = Vector2.FromArray(uvs, indices[this.faceId * 3] * 2);
        let uv1 = Vector2.FromArray(uvs, indices[this.faceId * 3 + 1] * 2);
        let uv2 = Vector2.FromArray(uvs, indices[this.faceId * 3 + 2] * 2);

        uv0 = uv0.scale(this.bu);
        uv1 = uv1.scale(this.bv);
        uv2 = uv2.scale(1.0 - this.bu - this.bv);

        return new Vector2(uv0.x + uv1.x + uv2.x, uv0.y + uv1.y + uv2.y);
    }
}
