import type { SoloNavMeshGeneratorConfig, TileCacheGeneratorConfig, TiledNavMeshGeneratorConfig } from "recast-navigation/generators";

import type { INavMeshParametersV2 } from "../types";
import { DefaultTileCacheMeshProcess } from "./tile-cache";

/**
 * Creates a SoloNavMesh configuration based on the provided parameters.
 * @param parameters The parameters used to configure the SoloNavMesh generation.
 * @returns A configuration object for generating a SoloNavMesh.
 * @see https://docs.recast-navigation-js.isaacmason.com/types/index.RecastConfig.html
 */
export function CreateSoloNavMeshConfig(parameters: INavMeshParametersV2): SoloNavMeshGeneratorConfig {
    const cfg: SoloNavMeshGeneratorConfig = {
        // The size of the non-navigable border around the heightfield.
        // [Limit: >=0]
        // [Units: vx] [0]
        borderSize: parameters.borderSize ? parameters.borderSize : 0,

        // The xz-plane cell size to use for fields. [Limit: > 0] [Units: wu] [0.2]
        cs: parameters.cs,

        // The y-axis cell size to use for fields. Limit: > 0] [Units: wu] [0.2]
        ch: parameters.ch,

        // Sets the sampling distance to use when generating the detail mesh. (For height detail only.)
        // [Limits: 0 or >= 0.9]
        // [Units: wu] [6]
        detailSampleDist: parameters.detailSampleDist,

        // The maximum distance the detail mesh surface should deviate from heightfield data. (For height detail only.)
        // [Limit: >=0]
        // [Units: wu] [1]
        detailSampleMaxError: parameters.detailSampleMaxError,

        // The maximum allowed length for contour edges along the border of the mesh.
        // [Limit: >=0]
        // [Units: vx] [12]
        maxEdgeLen: parameters.maxEdgeLen,

        //The maximum distance a simplified contour's border edges should deviate from the original raw contour.
        // [Limit: >=0]
        // [Units: vx] [1.3]
        maxSimplificationError: parameters.maxSimplificationError,

        // The maximum number of vertices allowed for polygons generated during the be merged with larger regions.
        // [Limit: >=0]
        // [Units: vx] [6]
        maxVertsPerPoly: parameters.maxVertsPerPoly,

        // Any regions with a span count smaller than this value will, if possible, be merged with larger regions.
        // [Limit: >=0]
        // [Units: vx] [20]
        mergeRegionArea: parameters.mergeRegionArea,

        // The minimum number of cells allowed to form isolated island areas.
        // [Limit: >=0]
        // [Units: vx] [8]
        minRegionArea: parameters.minRegionArea,

        // Maximum ledge height that is considered to still be traversable.
        // [Limit: >=0]
        // [Units: vx] [2]
        walkableClimb: parameters.walkableClimb,

        // The maximum slope that is considered walkable.
        // [Limits: 0 <= value < 90]
        // [Units: Degrees] [60]
        walkableSlopeAngle: parameters.walkableSlopeAngle,

        // Minimum floor to 'ceiling' height that will still allow the floor area to be considered walkable.
        // [Limit: >= 3]
        // [Units: vx] [2] ??? >=3
        walkableHeight: parameters.walkableHeight,

        // The distance to erode/shrink the walkable area of the heightfield away from obstructions.
        // [Limit: >=0]
        // [Units: vx] [0.5]
        walkableRadius: parameters.walkableRadius,

        // OffMeshConnections (teleports) to be added to the NavMesh.
        offMeshConnections: parameters.offMeshConnections,
    };
    return cfg;
}

/**
 * Creates a TiledNavMesh configuration based on the provided parameters.
 * @param parameters The parameters used to configure the TiledNavMesh generation.
 * @returns A configuration object for generating a TiledNavMesh.
 */
export function CreateTiledNavMeshConfig(parameters: INavMeshParametersV2): TiledNavMeshGeneratorConfig {
    const cfg: TiledNavMeshGeneratorConfig = {
        ...CreateSoloNavMeshConfig(parameters),
        tileSize: parameters.tileSize ?? 32,
    };
    return cfg;
}

/**
 * Creates a TileCacheNavMesh configuration based on the provided parameters.
 * @param parameters The parameters used to configure the TileCacheNavMesh generation.
 * @returns A configuration object for generating a TileCacheNavMesh.
 */
export function CreateTileCacheNavMeshConfig(parameters: INavMeshParametersV2): TileCacheGeneratorConfig {
    const cfg: TileCacheGeneratorConfig = {
        ...CreateTiledNavMeshConfig(parameters),
        expectedLayersPerTile: parameters.expectedLayersPerTile ?? 1,
        tileCacheMeshProcess: parameters.tileCacheMeshProcess ?? DefaultTileCacheMeshProcess,
        maxObstacles: parameters.maxObstacles ?? 32,
    };

    return cfg;
}
