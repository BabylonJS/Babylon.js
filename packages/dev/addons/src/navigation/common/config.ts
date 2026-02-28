import type { SoloNavMeshGeneratorConfig, TileCacheGeneratorConfig, TiledNavMeshGeneratorConfig } from "@recast-navigation/generators";
import type { CrowdAgentParams } from "@recast-navigation/core";

import { Logger } from "core/Misc/logger";

import type { IAgentParametersV2, INavMeshParametersV2 } from "../types";
import { CreateDefaultTileCacheMeshProcess } from "./tile-cache";

export const DefaultMaxObstacles = 128;

/**
 * Creates a SoloNavMesh configuration based on the provided parameters.
 * @param parameters The parameters used to configure the SoloNavMesh generation.
 * @returns A configuration object for generating a SoloNavMesh.
 * @see https://docs.recast-navigation-js.isaacmason.com/types/index.RecastConfig.html
 */
export function CreateSoloNavMeshConfig(parameters: INavMeshParametersV2): Partial<SoloNavMeshGeneratorConfig> {
    return ToSoloNavMeshGeneratorConfig(parameters);
}

/**
 * Creates a TiledNavMesh configuration based on the provided parameters.
 * @param parameters The parameters used to configure the TiledNavMesh generation.
 * @returns A configuration object for generating a TiledNavMesh.
 */
export function CreateTiledNavMeshConfig(parameters: INavMeshParametersV2): Partial<TiledNavMeshGeneratorConfig> {
    const cfg: Partial<TiledNavMeshGeneratorConfig> = {
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
export function CreateTileCacheNavMeshConfig(parameters: INavMeshParametersV2): Partial<TileCacheGeneratorConfig> {
    const cfg: Partial<TileCacheGeneratorConfig> = {
        ...CreateTiledNavMeshConfig(parameters),
        expectedLayersPerTile: parameters.expectedLayersPerTile ?? 1,
        maxObstacles: parameters.maxObstacles ?? DefaultMaxObstacles,
    };

    if (parameters.tileCacheMeshProcess) {
        cfg.tileCacheMeshProcess = parameters.tileCacheMeshProcess;
    } else if (parameters.offMeshConnections) {
        Logger.Warn("offMeshConnections are required but no tileCacheMeshProcess is set. Using fallback DefaultTileCacheMeshProcess.");
        cfg.tileCacheMeshProcess = CreateDefaultTileCacheMeshProcess(parameters.offMeshConnections);
    }

    return cfg;
}

/**
 * Convert INavMeshParametersV2 to SoloNavMeshGeneratorConfig by filtering out undefined values.
 * @param config NavMesh parameters
 * @returns Recast solo nav mesh generator config
 */
export function ToSoloNavMeshGeneratorConfig(config: INavMeshParametersV2): Partial<SoloNavMeshGeneratorConfig> {
    return Object.fromEntries(Object.entries(config).filter(([_, v]) => v !== undefined));
}

/**
 * Convert IAgentParametersV2 to Recast CrowdAgentParams by filtering out undefined values.
 * @param agentParams Agent parameters
 * @returns Recast crowd agent parameters
 */
export function ToCrowdAgentParams(agentParams: IAgentParametersV2): Partial<CrowdAgentParams> {
    return Object.fromEntries(Object.entries(agentParams).filter(([_, v]) => v !== undefined));
}
