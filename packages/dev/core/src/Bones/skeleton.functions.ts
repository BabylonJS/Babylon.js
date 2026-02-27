import { Bone } from "./bone";
import { Matrix } from "../Maths/math.vector";
import type { Scene } from "../scene";
import type { TransformNode } from "core/Meshes/transformNode";
import { Mesh } from "core/Meshes/mesh";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { VertexBuffer } from "core/Buffers/buffer";
import { Skeleton } from "./skeleton";

/**
 * Creates a skeleton from a hierarchy of transform nodes by converting each node into a bone.
 * Each transform node in the hierarchy will be linked to its corresponding bone, allowing the skeleton
 * to be driven by the transform node transformations.
 * @param rootNode The root transform node of the hierarchy to convert into a skeleton
 * @param scene The scene in which to create the skeleton
 * @param options Optional parameters for skeleton creation
 *    - name: The name for the created skeleton (defaults to rootNode.name + "_skeleton")
 *    - boneMeshSize: The diameter of the sphere mesh created for each bone (defaults to 1, only used if createMesh is true)
 *    - createMesh: If true, creates a mesh with spheres at each bone location for visualization purposes.
 *       The mesh will be parented to the rootNode's parent and returned through options.mesh
 *    - mesh: An existing mesh to attach the skeleton to. If provided, the skeleton will be assigned to this mesh
 * @returns A new skeleton with bones corresponding to the transform node hierarchy
 * @remarks
 * - Only transform nodes with a rotationQuaternion property will be converted into bones
 */
export function CreateSkeletonFromTransformNodeHierarchy(
    rootNode: TransformNode,
    scene: Scene,
    options?: { name?: string; boneMeshSize?: number; createMesh?: boolean; mesh?: Mesh }
): Skeleton {
    const name = options?.name || rootNode.name + "_skeleton";
    const skeleton = new Skeleton(name, name, scene);

    const nodes = rootNode.getChildTransformNodes(false);

    nodes.unshift(rootNode);

    let mesh = options?.mesh || null;
    if (options?.createMesh) {
        mesh = new Mesh(`${name}_mesh`, scene);
        mesh.parent = rootNode.parent;
        mesh.skeleton = skeleton;

        options.mesh = mesh;
    } else if (mesh) {
        mesh.skeleton = skeleton;
    }

    const positions: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    const boneIndices: number[] = [];
    const boneWeights: number[] = [];

    const boneMesh = options?.createMesh ? MeshBuilder.CreateSphere("dummy", { diameter: options?.boneMeshSize || 1, segments: 8 }, scene) : null;

    const boneMeshNumVertices = boneMesh?.getTotalVertices() || 0;
    const boneMeshPositions = boneMesh?.getVerticesData(VertexBuffer.PositionKind);
    const boneMeshIndices = boneMesh?.getIndices();
    const boneMeshNormals = boneMesh?.getVerticesData(VertexBuffer.NormalKind);

    const mapNameToBone: { [name: string]: Bone } = {};

    for (const node of nodes) {
        if (!node.rotationQuaternion || node.getClassName() !== "TransformNode") {
            continue;
        }

        const currentVertexIndex = positions.length / 3;

        if (boneMeshPositions) {
            for (let i = 0; i < boneMeshPositions.length; ++i) {
                positions.push(boneMeshPositions[i]);
            }
        }
        if (boneMeshNormals) {
            for (let i = 0; i < boneMeshNormals.length; ++i) {
                normals.push(boneMeshNormals[i]);
            }
        }

        const boneIndex = skeleton.bones.length;

        if (boneMesh) {
            for (let i = 0; i < boneMeshNumVertices; ++i) {
                boneIndices.push(boneIndex, -1, -1, -1);
                boneWeights.push(1, 0, 0, 0);
            }
        }

        if (boneMeshIndices) {
            for (let i = 0; i < boneMeshIndices.length; ++i) {
                indices.push(currentVertexIndex + boneMeshIndices[i]);
            }
        }

        const bone = new Bone(
            node.name,
            skeleton,
            node.parent ? mapNameToBone[node.parent.name] : null,
            Matrix.Compose(node.scaling, node.rotationQuaternion, node.position), // local matrix
            undefined,
            Matrix.Identity() // bind matrix
        );

        bone.linkTransformNode(node);

        mapNameToBone[node.name] = bone;
    }

    mesh?.setVerticesData(VertexBuffer.PositionKind, positions);
    mesh?.setVerticesData(VertexBuffer.NormalKind, normals);
    mesh?.setVerticesData(VertexBuffer.MatricesIndicesKind, boneIndices);
    mesh?.setVerticesData(VertexBuffer.MatricesWeightsKind, boneWeights);
    mesh?.setIndices(indices);

    mesh?.refreshBoundingInfo(true, false);

    boneMesh?.dispose();

    return skeleton;
}
