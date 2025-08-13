import type { IVector3Like } from "core/Maths/math.like";
import type { Vector3 } from "core/Maths/math.vector";
import type { Mesh } from "core/Meshes/mesh";
import type { INavigationEnginePlugin, INavMeshParameters } from "core/Navigation/INavigationEngine";
import type { Nullable } from "core/types";
import type { NavMesh, NavMeshQuery, QueryFilter } from "recast-navigation";
import type { SoloNavMeshGeneratorIntermediates, TileCacheGeneratorIntermediates, TiledNavMeshGeneratorIntermediates } from "recast-navigation/generators";

/**
 *
 */
export interface IOffMeshConnection {
    /**
     *
     */
    startPosition: IVector3Like;
    /**
     *
     */
    endPosition: IVector3Like;
    /**
     *
     */
    radius: number;
    /**
     *
     */
    bidirectional: boolean;
    /**
     *
     */
    area: number;
    /**
     *
     */
    flags: number;
    /**
     *
     */
    userId?: number;
}

export type CreateNavMeshresult = Nullable<{
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
}>;

/**
 *
 */
export interface INavMeshParametersV2 extends INavMeshParameters {
    /**
     *
     */
    offMeshConnections?: IOffMeshConnection[];
    /**
     * Whether to keep intermediate navigation mesh data for debug visualization
     */
    keepIntermediates?: boolean;
}

/**
 *
 */
export interface INavigationEnginePluginV2 extends INavigationEnginePlugin {
    /**
     *
     */
    navMesh?: NavMesh;
    /**
     *
     */
    navMeshQuery: NavMeshQuery;
    /**
     *
     */
    getClosestPoint(
        position: IVector3Like,
        options?: {
            filter?: QueryFilter;
            halfExtents?: IVector3Like;
        }
    ): Vector3;
    getClosestPointToRef(
        position: IVector3Like,
        result: Vector3,
        options?: {
            filter?: QueryFilter;
            halfExtents?: IVector3Like;
        }
    ): void;
    getRandomPointAround(
        position: IVector3Like,
        maxRadius: number,
        options?: {
            /**
             *
             */
            startRef?: number;
            filter?: QueryFilter;
            halfExtents?: IVector3Like;
        }
    ): Vector3;
    getRandomPointAroundToRef(
        position: IVector3Like,
        maxRadius: number,
        result: Vector3,
        options?: {
            startRef?: number;
            filter?: QueryFilter;
            halfExtents?: IVector3Like;
        }
    ): void;

    createNavMesh(meshes: Array<Mesh>, parameters: INavMeshParametersV2): CreateNavMeshresult;
    createNavMeshAsync(meshes: Array<Mesh>, parameters: INavMeshParametersV2, completion?: (navmeshData: Uint8Array) => void): Promise<CreateNavMeshresult>;

    computePathSmooth(
        start: Vector3,
        end: Vector3,
        options?: {
            filter?: QueryFilter;
            halfExtents?: IVector3Like;

            /**
             * @default 256
             */
            maxPathPolys?: number;

            /**
             * @default 2048
             */
            maxSmoothPathPoints?: number;

            /**
             * @default 0.5
             */
            stepSize?: number;

            /**
             * @default 0.01
             */
            slop?: number;
        }
    ): Vector3[];
}

export type SteerTargetResult =
    | {
          /**
           *
           */
          success: false;
      }
    | {
          /**
           *
           */
          success: true;
          /**
           *
           */
          steerPos: Vector3;
          /**
           *
           */
          steerPosFlag: number;
          /**
           *
           */
          steerPosRef: number;
          /**
           *
           */
          points: Vector3[];
      };

export const ComputePathError = {
    START_NEAREST_POLY_FAILED: "START_NEAREST_POLY_FAILED",
    END_NEAREST_POLY_FAILED: "END_NEAREST_POLY_FAILED",
    FIND_PATH_FAILED: "FIND_PATH_FAILED",
    NO_POLYGON_PATH_FOUND: "NO_POLYGON_PATH_FOUND",
    NO_CLOSEST_POINT_ON_LAST_POLYGON_FOUND: "NO_CLOSEST_POINT_ON_LAST_POLYGON_FOUND",
};

export type ComputeSmoothPathErrorType = (typeof ComputePathError)[keyof typeof ComputePathError];

export type ComputeSmoothPathResult = {
    /**
     *
     */
    success: boolean;
    /**
     *
     */
    error?: {
        /**
         *
         */
        type: ComputeSmoothPathErrorType;
        /**
         *
         */
        status?: number;
    };
    /**
     *
     */
    path: Vector3[];
};

export type GeneratorIntermediates = SoloNavMeshGeneratorIntermediates | TiledNavMeshGeneratorIntermediates | TileCacheGeneratorIntermediates | null;
