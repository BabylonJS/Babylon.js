import { getNavMeshPositionsAndIndices } from "@recast-navigation/core";
import type { NavMesh } from "@recast-navigation/core";

import type { Scene } from "core/scene";
import type { Node } from "core/node";
import { Mesh } from "core/Meshes/mesh";
import { VertexData } from "core/Meshes/mesh.vertexData";

import { GetReversedIndices } from "../common/getters";

/**
 * Creates a debug mesh for visualizing a NavMesh in the scene.
 * @param navMesh The NavMesh to visualize.
 * @param scene The scene in which to create the debug mesh.
 * @param parent Optional parent node for the debug mesh.
 * @returns The created debug mesh.
 */
export function CreateDebugNavMesh(navMesh: NavMesh, scene: Scene, parent?: Node) {
    const [positions, indices] = getNavMeshPositionsAndIndices(navMesh);

    const mesh = new Mesh("NavMeshDebug", scene);
    const vertexData = new VertexData();

    for (let i = 0; i < indices.length; i += 3) {
        // Swap the order of the second and third vertex in each triangle
        [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
    }

    vertexData.indices = GetReversedIndices(indices);
    vertexData.positions = positions;
    vertexData.applyToMesh(mesh, false);

    parent && (mesh.parent = parent);

    return mesh;
}
