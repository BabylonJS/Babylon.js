import type { Nullable, FloatArray } from "../types";
import { Vector3, Vector2, TmpVectors } from "../Maths/math.vector";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { TransformNode } from "../Meshes/transformNode";
import { VertexBuffer } from "../Buffers/buffer";
import type { Sprite } from "../Sprites/sprite";

declare type Ray = import("../Culling/ray").Ray;

/**
 * Information about the result of picking within a scene
 * @see https://doc.babylonjs.com/divingDeeper/mesh/interactions/picking_collisions
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
    /** (See getTextureCoordinates) The barycentric U coordinate that is used when calculating the texture coordinates of the collision.*/
    public bu = 0;
    /** (See getTextureCoordinates) The barycentric V coordinate that is used when calculating the texture coordinates of the collision.*/
    public bv = 0;
    /** The index of the face on the mesh that was picked, or the index of the Line if the picked Mesh is a LinesMesh */
    public faceId = -1;
    /** The index of the face on the subMesh that was picked, or the index of the Line if the picked Mesh is a LinesMesh */
    public subMeshFaceId = -1;
    /** Id of the the submesh that was picked */
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
     * @param useVerticesNormals If the vertices normals should be used to calculate the normal instead of the normal map
     * @returns The normal corresponding to the face the pick collided with
     * @remarks Note that the returned normal will always point towards the picking ray.
     */
    public getNormal(useWorldCoordinates = false, useVerticesNormals = true): Nullable<Vector3> {
        if (!this.pickedMesh || (useVerticesNormals && !this.pickedMesh.isVerticesDataPresent(VertexBuffer.NormalKind))) {
            return null;
        }

        const indices = this.pickedMesh.getIndices();

        if (!indices) {
            return null;
        }

        let result: Vector3;

        if (useVerticesNormals) {
            const normals = <FloatArray>this.pickedMesh.getVerticesData(VertexBuffer.NormalKind);

            let normal0 = Vector3.FromArray(normals, indices[this.faceId * 3] * 3);
            let normal1 = Vector3.FromArray(normals, indices[this.faceId * 3 + 1] * 3);
            let normal2 = Vector3.FromArray(normals, indices[this.faceId * 3 + 2] * 3);

            normal0 = normal0.scale(this.bu);
            normal1 = normal1.scale(this.bv);
            normal2 = normal2.scale(1.0 - this.bu - this.bv);

            result = new Vector3(normal0.x + normal1.x + normal2.x, normal0.y + normal1.y + normal2.y, normal0.z + normal1.z + normal2.z);
        } else {
            const positions = <FloatArray>this.pickedMesh.getVerticesData(VertexBuffer.PositionKind);

            const vertex1 = Vector3.FromArray(positions, indices[this.faceId * 3] * 3);
            const vertex2 = Vector3.FromArray(positions, indices[this.faceId * 3 + 1] * 3);
            const vertex3 = Vector3.FromArray(positions, indices[this.faceId * 3 + 2] * 3);

            const p1p2 = vertex1.subtract(vertex2);
            const p3p2 = vertex3.subtract(vertex2);

            result = Vector3.Cross(p1p2, p3p2);
        }

        // Flip the normal if the picking ray is in the same direction.
        if (this.ray && Vector3.Dot(result, this.ray.direction) > 0) {
            result.negateInPlace();
        }

        if (useWorldCoordinates) {
            let wm = this.pickedMesh.getWorldMatrix();

            if (this.pickedMesh.nonUniformScaling) {
                TmpVectors.Matrix[0].copyFrom(wm);
                wm = TmpVectors.Matrix[0];
                wm.setTranslationFromFloats(0, 0, 0);
                wm.invert();
                wm.transposeToRef(TmpVectors.Matrix[1]);

                wm = TmpVectors.Matrix[1];
            }

            Vector3.TransformNormalToRef(result, wm, result);
        }

        result.normalize();

        return result;
    }

    /**
     * Gets the texture coordinates of where the pick occurred
     * @returns the vector containing the coordinates of the texture
     */
    public getTextureCoordinates(): Nullable<Vector2> {
        if (!this.pickedMesh || !this.pickedMesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
            return null;
        }

        const indices = this.pickedMesh.getIndices();
        if (!indices) {
            return null;
        }

        const uvs = this.pickedMesh.getVerticesData(VertexBuffer.UVKind);
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
