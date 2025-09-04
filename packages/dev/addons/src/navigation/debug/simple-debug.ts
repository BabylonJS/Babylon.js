import type { NavMesh } from "@recast-navigation/core";

import type { Scene } from "core/scene";
import type { Node } from "core/node";
import { Mesh } from "core/Meshes/mesh";
import { VertexData } from "core/Meshes/mesh.vertexData";

import { GetReversedIndices } from "../common/getters";
import { BjsRecast } from "../factory/common";

/**
 * Creates a debug mesh for visualizing a NavMesh in the scene.
 * @param navMesh The NavMesh to visualize.
 * @param scene The scene in which to create the debug mesh.
 * @param parent Optional parent node for the debug mesh.
 * @returns The created debug mesh.
 */
export function CreateDebugNavMesh(navMesh: NavMesh, scene: Scene, parent?: Node) {
    const [positions, indices] = BjsRecast.getNavMeshPositionsAndIndices(navMesh);

    const mesh = new Mesh("NavMeshDebug", scene);
    const vertexData = new VertexData();

    vertexData.indices = GetReversedIndices(indices);
    vertexData.positions = positions;
    vertexData.applyToMesh(mesh, false);

    parent && (mesh.parent = parent);

    return mesh;
}
