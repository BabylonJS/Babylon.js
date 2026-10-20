import { Matrix, Quaternion, TmpVectors, Vector3 } from "core/Maths/math.vector";
import { Epsilon } from "core/Maths/math.constants";
import { TransformNode } from "core/Meshes/transformNode";
import { AbstractMesh } from "core/Meshes/abstractMesh";
import { type Node } from "core/node";

/**
 * Matrix that converts handedness on the X-axis. Used to convert from LH to RH and vice versa.
 * @internal
 */
export const ConvertHandednessMatrix = Matrix.Compose(new Vector3(-1, 1, 1), Quaternion.Identity(), Vector3.Zero());

/**
 * Checks if a node is a "noop" transform node, usually inserted by the glTF loader to correct handedness.
 * Refreshes changed transforms even when the scene's render ID has not advanced.
 * @internal
 */
export function IsNoopNode(node: Node, useRightHandedSystem: boolean): boolean {
    if (!(node instanceof TransformNode)) {
        return false;
    }

    // Transform
    const worldMatrix = node.computeWorldMatrix(!node.isSynchronized());
    if (useRightHandedSystem) {
        if (!worldMatrix.equalsWithEpsilon(Matrix.IdentityReadOnly, Epsilon)) {
            return false;
        }
    } else {
        const matrix = worldMatrix.multiplyToRef(ConvertHandednessMatrix, TmpVectors.Matrix[0]);
        if (!matrix.equalsWithEpsilon(Matrix.IdentityReadOnly, Epsilon)) {
            return false;
        }
    }

    // Geometry
    if (node instanceof AbstractMesh && node.geometry) {
        return false;
    }

    return true;
}
