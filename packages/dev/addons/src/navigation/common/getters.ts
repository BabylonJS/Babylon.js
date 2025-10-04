import { VertexBuffer } from "core/Buffers/buffer";
import { Matrix, Vector3 } from "core/Maths/math.vector";
import { Mesh } from "core/Meshes/mesh";

/**
 *  Extracts positions and indices from an array of meshes.
 *  @param meshes The array of meshes from which to extract positions and indices.
 *  @returns A tuple containing a Float32Array of positions and a Uint32Array of
 */
export function GetPositionsAndIndices(
    meshes: Mesh[],
    options?: {
        doNotReverseIndices?: boolean;
    }
): [positions: Float32Array, indices: Uint32Array] {
    let offset = 0;
    let index: number;
    let tri: number;
    let pt: number;
    const positions: number[] = [];
    const indices: number[] = [];

    for (index = 0; index < meshes.length; index++) {
        if (meshes[index]) {
            const mesh = meshes[index];

            const meshIndices = options?.doNotReverseIndices ? mesh.getIndices(false, true) : GetReversedIndices(mesh);
            if (!meshIndices) {
                continue;
            }

            const meshPositions = mesh.getVerticesData(VertexBuffer.PositionKind, false, false);
            if (!meshPositions) {
                continue;
            }

            const worldMatrices: Matrix[] = [];
            const worldMatrix = mesh.computeWorldMatrix(true);

            if (mesh.hasThinInstances) {
                const thinMatrices = (mesh as Mesh).thinInstanceGetWorldMatrices();
                for (let instanceIndex = 0; instanceIndex < thinMatrices.length; instanceIndex++) {
                    const tmpMatrix = new Matrix();
                    const thinMatrix = thinMatrices[instanceIndex];
                    thinMatrix.multiplyToRef(worldMatrix, tmpMatrix);
                    worldMatrices.push(tmpMatrix);
                }
            } else {
                worldMatrices.push(worldMatrix);
            }

            const transformed = Vector3.Zero();
            const position = Vector3.Zero();

            for (let matrixIndex = 0; matrixIndex < worldMatrices.length; matrixIndex++) {
                const wm = worldMatrices[matrixIndex];
                for (tri = 0; tri < meshIndices.length; tri++) {
                    indices.push(meshIndices[tri] + offset);
                }

                for (pt = 0; pt < meshPositions.length; pt += 3) {
                    Vector3.FromArrayToRef(meshPositions, pt, position);
                    Vector3.TransformCoordinatesToRef(position, wm, transformed);
                    positions.push(transformed.x, transformed.y, transformed.z);
                }

                offset += meshPositions.length / 3;
            }
        }
    }
    return [Float32Array.from(positions), Uint32Array.from(indices)];
}

/**
 * Reverses the order of vertices in each triangle (3 indices per face) to ensure
 * that the winding order is consistent with the Recast Navigation requirements.
 * This is necessary because Recast Navigation expects the indices to be in a specific winding order.
 * @param meshOrIndices The mesh from which to extract indices or the indices themselves.
 * @returns Array of indices with reversed winding order.
 */
export function GetReversedIndices(
    meshOrIndices: Mesh | Uint32Array | number[]
): Uint32Array<ArrayBufferLike> | number[] | Int32Array<ArrayBufferLike> | Uint16Array<ArrayBufferLike> | null {
    const indices = meshOrIndices instanceof Mesh ? meshOrIndices.getIndices(false, true) : meshOrIndices;

    if (indices) {
        for (let i = 0; i < indices.length; i += 3) {
            // Swap the second and third index to reverse the winding order
            [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
        }
    }

    return indices;
}
