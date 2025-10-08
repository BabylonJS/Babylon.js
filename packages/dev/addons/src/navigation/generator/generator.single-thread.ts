import type { SoloNavMeshGeneratorConfig, TileCacheGeneratorConfig, TiledNavMeshGeneratorConfig } from "@recast-navigation/generators";

import { Logger } from "core/Misc/logger";
import type { Mesh } from "core/Meshes/mesh";

import type { INavMeshParametersV2 } from "../types";
import { GetPositionsAndIndices } from "../common/getters";
import { CreateSoloNavMeshConfig, CreateTileCacheNavMeshConfig, CreateTiledNavMeshConfig } from "../common/config";
import { GetRecast } from "../factory/common";

/**
 * Builds a NavMesh and NavMeshQuery from meshes using provided parameters.
 * @param meshes The array of meshes used to create the NavMesh.
 * @param parameters The parameters used to configure the NavMesh generation.
 * @returns An object containing the NavMesh and NavMeshQuery.
 * @remarks This function generates a NavMesh based on the provided meshes and parameters.
 * It supports different configurations such as solo, tiled, and tile cache nav meshes.
 * If you need obstacles, ensure that `maxObstacles` is set to a value greater than 0.
 * Recommended values for `tileSize` are between 32 and 64 when using obstacles/tile cache.
 * If you need a tiled nav mesh, ensure that `tileSize` is set to a value greater than 0.
 * @throws Error if the NavMesh data is invalid or cannot be deserialized.
 */
export function GenerateNavMesh(meshes: Array<Mesh>, parameters: INavMeshParametersV2) {
    const recast = GetRecast();

    if (meshes.length === 0) {
        throw new Error("At least one mesh is needed to create the nav mesh.");
    }

    const [positions, indices] = GetPositionsAndIndices(meshes, { doNotReverseIndices: parameters.doNotReverseIndices });
    if (!positions || !indices) {
        throw new Error("Unable to get nav mesh. No vertices or indices.");
    }

    // Decide on the type of nav mesh to generate based on parameters
    // If tileSize is set, we will generate a tiled nav mesh
    // If maxObstacles is set, we will generate a tile cache nav mesh
    // Otherwise, we will generate a solo nav mesh
    // Note: tileSize is only used for tiled nav meshes, not tile cache nav meshes
    // If both tileSize and maxObstacles are set, we will generate a tile cache
    const tileSize = parameters.tileSize ?? 0;
    const needsTileCache = (parameters.maxObstacles ?? 0) > 0;
    const needsTiledNavMesh = tileSize > 0;
    if (needsTileCache) {
        if (tileSize < 32 || tileSize > 64) {
            Logger.Warn("NavigationPlugin: Tile cache is enabled. Recommended tileSize is 32 to 64. Other values may lead to unexpected behavior.");
        }
    }

    // Create the appropriate configuration based on the parameters
    const config = needsTileCache ? CreateTileCacheNavMeshConfig(parameters) : needsTiledNavMesh ? CreateTiledNavMeshConfig(parameters) : CreateSoloNavMeshConfig(parameters);
    const result = needsTileCache
        ? recast.generateTileCache(positions, indices, config as TileCacheGeneratorConfig, parameters.keepIntermediates)
        : needsTiledNavMesh
          ? recast.generateTiledNavMesh(positions, indices, config as TiledNavMeshGeneratorConfig, parameters.keepIntermediates)
          : recast.generateSoloNavMesh(positions, indices, config as SoloNavMeshGeneratorConfig, parameters.keepIntermediates);

    if (!result.success) {
        throw new Error(`Unable to generateSoloNavMesh: ${result.error}`);
    }

    return {
        navMesh: result.navMesh,
        intermediates: result.intermediates,
        navMeshQuery: new recast.NavMeshQuery(result.navMesh),
        tileCache: "tileCache" in result ? result.tileCache : undefined,
    };
}
