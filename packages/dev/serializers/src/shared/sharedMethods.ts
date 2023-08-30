import { Matrix, Quaternion, TmpVectors, Vector3 } from "core/Maths/math.vector";
import { InstancedMesh } from "core/Meshes/instancedMesh";
import { Mesh } from "core/Meshes/mesh";
import { TransformNode } from "core/Meshes/transformNode";
import type { Node } from "core/node";
import type {
    INode,
} from "babylonjs-gltf2interface";

// Matrix that converts handedness on the X-axis.
const convertHandednessMatrix = Matrix.Compose(new Vector3(-1, 1, 1), Quaternion.Identity(), Vector3.Zero());
/**
 * Checks if a node is a no-op node.
 * @param node The node to check.
 * @param useRightHandedSystem Specifies whether the node should be checked using a right-handed coordinate system.
 */
export function isNoopNode(node: Node, useRightHandedSystem: boolean): boolean {
    if (!(node instanceof TransformNode)) {
        return false;
    }

    // Transform
    if (useRightHandedSystem) {
        const matrix = node.getWorldMatrix();
        if (!matrix.isIdentity()) {
            return false;
        }
    } else {
        const matrix = node.getWorldMatrix().multiplyToRef(convertHandednessMatrix, TmpVectors.Matrix[0]);
        if (!matrix.isIdentity()) {
            return false;
        }
    }

    // Geometry
    if ((node instanceof Mesh && node.geometry) || (node instanceof InstancedMesh && node.sourceMesh.geometry)) {
        return false;
    }

    return true;
}

/**
 * Converts a node from right- to left-handedness.
 * @param node The node to convert.
 */
export function convertNodeHandedness(node: INode): void {
    const translation = Vector3.FromArrayToRef(node.translation || [0, 0, 0], 0, TmpVectors.Vector3[0]);
    const rotation = Quaternion.FromArrayToRef(node.rotation || [0, 0, 0, 1], 0, TmpVectors.Quaternion[0]);
    const scale = Vector3.FromArrayToRef(node.scale || [1, 1, 1], 0, TmpVectors.Vector3[1]);
    const matrix = Matrix.ComposeToRef(scale, rotation, translation, TmpVectors.Matrix[0]).multiplyToRef(convertHandednessMatrix, TmpVectors.Matrix[0]);

    matrix.decompose(scale, rotation, translation);

    if (translation.equalsToFloats(0, 0, 0)) {
        delete node.translation;
    } else {
        node.translation = translation.asArray();
    }

    if (Quaternion.IsIdentity(rotation)) {
        delete node.rotation;
    } else {
        node.rotation = rotation.asArray();
    }

    if (scale.equalsToFloats(1, 1, 1)) {
        delete node.scale;
    } else {
        node.scale = scale.asArray();
    }
}