import type { NavMesh, NavMeshQuery, TileCache, TileCacheMeshProcess } from "@recast-navigation/core";
import type { SoloNavMeshGeneratorIntermediates, TileCacheGeneratorIntermediates, TiledNavMeshGeneratorIntermediates } from "@recast-navigation/generators";

import type { IVector3Like } from "core/Maths/math.like";
import type { Vector3 } from "core/Maths/math.vector";
import type { IAgentParameters, INavMeshParameters } from "core/Navigation/INavigationEngine";
import type { Nullable } from "core/types";

/**
 * Recast injection type
 */
export type RecastInjection = any; // typeof import("@recast-navigation/core") & typeof import("@recast-navigation/generators");

/**
 * Off-mesh connection data
 */
export interface IOffMeshConnection {
    /**
     * The start position of the off-mesh connection.
     */
    startPosition: IVector3Like;
    /**
     * The end position of the off-mesh connection.
     */
    endPosition: IVector3Like;
    /**
     * The radius of the off-mesh connection.
     */
    radius: number;
    /**
     * The type of the off-mesh connection.
     */
    bidirectional: boolean;
    /**
     * The area type of the off-mesh connection.
     */
    area: number;
    /**
     * The flags of the off-mesh connection.
     */
    flags: number;
    /**
     * The user ID of the off-mesh connection.
     * @remarks This can be used to associate the off-mesh connection with a specific user
     */
    userId?: number;
}

/**
 * Result of a navigation mesh creation.
 */
export type CreateNavMeshResult = Nullable<{
    /**
     * Navigation mesh
     */
    navMesh: NavMesh;
    /**
     * Navigation mesh query
     */
    navMeshQuery: NavMeshQuery;
    /**
     * Intermediates generated during the NavMesh creation process.
     * @remarks This is only available if the `keepIntermediates` parameter is set to true in the `INavMeshParametersV2`.
     * It can be used for debugging or visualization purposes.
     */
    intermediates?: GeneratorIntermediates;
    /**
     * Tile cache generated during the NavMesh creation process.
     * @remarks This is only available if the `maxObstacles` parameter is set to a value greater than 0 in the `INavMeshParametersV2`. Defaults `maxObstacles` to 128.
     * It can be used for obstacle avoidance and dynamic navigation mesh updates.
     * @see {@link INavMeshParametersV2}
     */
    tileCache?: TileCache;
}>;

/**
 * Agent parameters
 * For actual limits and default values check the recast-navigation-js docs.
 * @see https://docs.recast-navigation-js.isaacmason.com/types/index.CrowdAgentParams.html
 */
export interface IAgentParametersV2 extends IAgentParameters {
    /**
     * Flags that impact steering behavior.
     */
    updateFlags: number;
    /**
     * The index of the avoidance configuration to use for the agent. [Limits: 0 to #DT_CROWD_MAX_OBSTAVOIDANCE_PARAMS inclusive]
     */
    obstacleAvoidanceType: number;
    /**
     * The index of the query filter used by this agent.
     */
    queryFilterType: number;
    /**
     * User defined data attached to the agent.
     */
    userData: unknown;
}

/**
 * NavMesh parameters
 * For actual limits and default values check the recast-navigation-js docs.
 * @see https://docs.recast-navigation-js.isaacmason.com/types/index.RecastConfig.html
 */
export interface INavMeshParametersV2 extends INavMeshParameters {
    /**
     * OffMeshConnections - Teleports
     */
    offMeshConnections?: IOffMeshConnection[];
    /**
     * Whether to keep intermediate navigation mesh data for debug visualization. Default is false.
     */
    keepIntermediates?: boolean;
    /**
     * The maximum number of obstacles that can be added to the navigation mesh. Default is 32.
     * If this value is greater then 0, the navigation mesh will be generated with a tile cache.
     */
    maxObstacles?: number;
    /**
     * The size of each tile in the tiled navigation mesh. Default is 32.
     */
    expectedLayersPerTile?: number;
    /**
     * Function which is sets the polyAreas and polyFlags for the tile cache mesh. Defaults to a function that sets all areas to 0 and flags to 1.
     */
    tileCacheMeshProcess?: TileCacheMeshProcess;
    /**
     * Don't reverse indices of the source mesh
     */
    doNotReverseIndices?: boolean;
}

/**
 * Result of a steer target computation.
 */
export type SteerTargetResult =
    | {
          /**
           * Indicates whether the steering target computation was successful.
           */
          success: false;
      }
    | {
          /**
           * Indicates whether the steering target computation was successful.
           */
          success: true;
          /**
           * The position to steer towards.
           */
          steerPos: Vector3;
          /**
           * The flag indicating the type of steering position.
           */
          steerPosFlag: number;
          /**
           * The reference to the polygon that the steering position is associated with.
           */
          steerPosRef: number;
          /**
           * The points that make up the path to the steering position.
           */
          points: Vector3[];
      };

/**
 * Error types for path computation.
 */
export const ComputePathError = {
    START_NEAREST_POLY_FAILED: "START_NEAREST_POLY_FAILED",
    END_NEAREST_POLY_FAILED: "END_NEAREST_POLY_FAILED",
    FIND_PATH_FAILED: "FIND_PATH_FAILED",
    NO_POLYGON_PATH_FOUND: "NO_POLYGON_PATH_FOUND",
    NO_CLOSEST_POINT_ON_LAST_POLYGON_FOUND: "NO_CLOSEST_POINT_ON_LAST_POLYGON_FOUND",
};

export type ComputePathErrorType = (typeof ComputePathError)[keyof typeof ComputePathError];

/**
 * Result of a path computation.
 */
export type ComputePathResult = {
    /**
     * Indicates whether the path computation was successful.
     */
    success: boolean;
    /**
     * The error message if the path computation failed.
     */
    error?: {
        /**
         * A descriptive error message.
         */
        name?: string;
        /**
         * The type of error that occurred during path computation.
         * @remarks This will be one of the values from `ComputePathError`
         */
        type?: ComputePathErrorType;
        /**
         * Status describing the error.
         */
        status?: number;
    };
    /**
     * The computed path as an array of Vector3 points.
     */
    path: IVector3Like[];
};

/**
 * Intermediates generated during the NavMesh creation process.
 * @remarks This is only available if the `keepIntermediates` parameter is set to true in the `INavMeshParametersV2`.
 * It can be used for debugging or visualization purposes.
 */
export type GeneratorIntermediates = SoloNavMeshGeneratorIntermediates | TiledNavMeshGeneratorIntermediates | TileCacheGeneratorIntermediates | null;
