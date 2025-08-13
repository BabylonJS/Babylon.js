import { NavMeshQuery } from "@recast-navigation/core";
import type { TiledNavMeshGeneratorConfig } from "@recast-navigation/generators";
import { generateTiledNavMesh, generateSoloNavMesh } from "@recast-navigation/generators";

import type { Mesh } from "core/Meshes/mesh";

import type { INavMeshParametersV2 } from "../types";
import { getPositionsAndIndices } from "../common/getters";
import { CreateNavMeshConfig } from "../common/config";

/**
 *  Builds a NavMesh and NavMeshQuery from meshes using provided parameters.
 *  @param meshes The array of meshes used to create the NavMesh.
 *  @param parameters The parameters used to configure the NavMesh generation.
 *  @returns An object containing the NavMesh and NavMeshQuery.
 *  @remarks This function generates a NavMesh based on the provided meshes and parameters.
 *  @throws Error if the NavMesh data is invalid or cannot be deserialized.
 */
export function GenerateNavMesh(meshes: Array<Mesh>, parameters: INavMeshParametersV2) {
    if (meshes.length === 0) {
        throw new Error("At least one mesh is needed to create the nav mesh.");
    }

    const [positions, indices] = getPositionsAndIndices(meshes);

    if (!positions || !indices) {
        throw new Error("Unable to get nav mesh. No vertices or indices.");
    }

    const config = CreateNavMeshConfig(parameters);
    const result =
        "tileSize" in config
            ? generateTiledNavMesh(positions, indices, config as TiledNavMeshGeneratorConfig, parameters.keepIntermediates)
            : generateSoloNavMesh(positions, indices, config, parameters.keepIntermediates);

    if (!result.success) {
        throw new Error(`Unable to generateSoloNavMesh: ${result.error}`);
    }

    return {
        navMesh: result.navMesh,
        navMeshQuery: new NavMeshQuery(result.navMesh),
        intermediates: result.intermediates,
    };
}
