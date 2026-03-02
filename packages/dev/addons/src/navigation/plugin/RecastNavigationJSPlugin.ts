import type { TileCacheMeshProcess, NavMesh, QueryFilter, TileCache, NavMeshQuery } from "@recast-navigation/core";

import type { ICrowd, INavigationEnginePlugin, IObstacle } from "core/Navigation/INavigationEngine";
import { Logger } from "core/Misc/logger";
import type { Mesh } from "core/Meshes/mesh";
import type { Scene } from "core/scene";
import { TmpVectors, Vector3 } from "core/Maths/math";
import type { IVector3Like } from "core/Maths/math.like";
import type { Nullable } from "core/types";

import type { CreateNavMeshResult, GeneratorIntermediates, INavMeshParametersV2, RecastInjection } from "../types";
import { RecastJSCrowd } from "./RecastJSCrowd";
import { ConvertNavPathPoints } from "../common/convert";
import { ComputeSmoothPath } from "../common/smooth-path";
import { CreateDebugNavMesh } from "../debug/simple-debug";
import { GetRecast } from "../factory/common";
import { InjectGenerators } from "../generator/injection";
import { DefaultMaxObstacles } from "../common/config";
import { CreateDefaultTileCacheMeshProcess, WaitForFullTileCacheUpdate } from "../common/tile-cache";

/**
 * Navigation plugin for Babylon.js. It is a simple wrapper around the recast-navigation-js library. Not all features are implemented.
 * @remarks This plugin provides navigation mesh generation and pathfinding capabilities using the recast-navigation-js library
 * @remarks It supports both single-threaded and multi-threaded generation of navigation meshes.
 * @remarks The plugin can be used to create navigation meshes from meshes in a scene, compute paths, and manage crowd agents, etc.
 * @remarks It also provides methods for creating obstacles and querying the navigation mesh.
 * @see https://github.com/isaac-mason/recast-navigation-js
 */
export class RecastNavigationJSPluginV2 implements INavigationEnginePlugin {
    /**
     *  Creates a navigation mesh - will be injected by the factory
     * @param meshes array of all the geometry used to compute the navigation mesh
     * @param parameters bunch of parameters used to filter geometry
     * @returns the created navmesh and navmesh query
     */
    createNavMeshImpl: (meshes: Array<Mesh>, parameters: INavMeshParametersV2) => CreateNavMeshResult;

    /**
     * Creates a navigation mesh - will be injected by the factory
     * @param meshes array of all the geometry used to compute the navigation mesh
     * @param parameters bunch of parameters used to filter geometry
     * @returns the created navmesh and navmesh query
     */
    createNavMeshAsyncImpl: (meshes: Array<Mesh>, parameters: INavMeshParametersV2) => Promise<CreateNavMeshResult>;

    /**
     * recast-navigation-js injection
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public bjsRECAST: RecastInjection;

    /**
     * plugin name
     */
    public name: string = "RecastNavigationJSPlugin";

    /**
     * the navmesh created
     */
    public navMesh?: NavMesh;

    /**
     * The navmesh query created from the navmesh
     * @remarks This is used to query the navmesh for pathfinding and other navigation tasks
     */
    public get navMeshQuery(): NavMeshQuery {
        return this._navMeshQuery;
    }

    private _navMeshQuery!: NavMeshQuery;

    /**
     * Intermediates generated during the navmesh creation
     * @remarks This is used for debugging and visualization purposes.
     * @remarks You have access to vertices, indices and vertex colors to visualize the navmesh creation process.
     * @remarks This is only available if the `keepIntermediates` parameter is set
     * @remarks to true during navmesh generation.
     */
    private _intermediates?: GeneratorIntermediates;

    /**
     * Gets the intermediates generated during the navmesh creation
     * @returns The generator intermediates, or undefined if not available
     */
    public get intermediates(): GeneratorIntermediates | undefined {
        return this._intermediates;
    }

    /**
     * Tile cache used for tiled navigation meshes
     * @remarks This is used to store and manage tiles of the navigation mesh for efficient path and when obstacles are used.
     */
    private _tileCache?: TileCache;

    /**
     * Gets the tile cache used for tiled navigation meshes
     * @returns The tile cache instance, or undefined if not available
     */
    public get tileCache(): TileCache | undefined {
        return this._tileCache;
    }

    // Crowd specific properties
    private _maximumSubStepCount: number = 10;
    private _timeStep: number = 1 / 60;
    private _timeFactor: number = 1;

    private _crowd?: ICrowd;

    /**
     * Creates a RecastNavigationJSPluginV2 instance
     * @param recastInjection The recast-navigation-js injection containing core and generators
     */
    public constructor(recastInjection?: RecastInjection) {
        if (!recastInjection) {
            recastInjection = GetRecast();
            InjectGenerators(this);
        }

        this.bjsRECAST = recastInjection;

        if (!this.isSupported()) {
            Logger.Error("RecastJS is not available. Please make sure you included the js file.");
            return;
        }
        this.setTimeStep();
    }

    /**
     * Set the time step of the navigation tick update.
     * Default is 1/60.
     * A value of 0 will disable fixed time update
     * @param newTimeStep the new timestep to apply to this world.
     */
    public setTimeStep(newTimeStep: number = 1 / 60): void {
        this._timeStep = newTimeStep;
    }

    /**
     * Get the time step of the navigation tick update.
     * @returns the current time step
     */
    public getTimeStep(): number {
        return this._timeStep;
    }

    /**
     * If delta time in navigation tick update is greater than the time step
     * a number of sub iterations are done. If more iterations are need to reach deltatime
     * they will be discarded.
     * A value of 0 will set to no maximum and update will use as many substeps as needed
     * @param newStepCount the maximum number of iterations
     */
    public setMaximumSubStepCount(newStepCount: number = 10): void {
        this._maximumSubStepCount = newStepCount;
    }

    /**
     * Get the maximum number of iterations per navigation tick update
     * @returns the maximum number of iterations
     */
    public getMaximumSubStepCount(): number {
        return this._maximumSubStepCount;
    }

    /**
     * Time factor applied when updating crowd agents (default 1). A value of 0 will pause crowd updates.
     * @param value the time factor applied at update
     */
    public set timeFactor(value: number) {
        this._timeFactor = Math.max(value, 0);
    }

    /**
     * Get the time factor used for crowd agent update
     * @returns the time factor
     */
    public get timeFactor(): number {
        return this._timeFactor;
    }

    /**
     * Creates a navigation mesh - will be injected by the factory
     * @param meshes array of all the geometry used to compute the navigation mesh
     * @param parameters bunch of parameters used to filter geometry
     * @returns the created navmesh and navmesh query
     * @throws Error if the function is not injected yet or if the navmesh is not created
     */
    public createNavMesh(meshes: Array<Mesh>, parameters: INavMeshParametersV2): CreateNavMeshResult {
        if (!this.createNavMeshImpl) {
            throw new Error("Function not injected yet. Use the factory to create the plugin.");
        }

        this._preprocessParameters(parameters);

        const result = this.createNavMeshImpl(meshes, parameters);
        return this._processNavMeshResult(result);
    }

    /**
     * Creates a navigation mesh asynchronously - will be injected by the factory
     * @param meshes array of all the geometry used to compute the navigation mesh
     * @param parameters bunch of parameters used to filter geometry
     * @returns the created navmesh and navmesh query
     * @throws Error if the function is not injected yet or if the navmesh is not created
     */
    public async createNavMeshAsync(meshes: Array<Mesh>, parameters: INavMeshParametersV2): Promise<CreateNavMeshResult> {
        if (!this.createNavMeshAsyncImpl) {
            throw new Error("Function not injected yet. Use the factory to create the plugin.");
        }

        this._preprocessParameters(parameters);

        const result = await this.createNavMeshAsyncImpl(meshes, parameters);
        return this._processNavMeshResult(result);
    }

    /**
     * Create a navigation mesh debug mesh
     * @param scene is where the mesh will be added
     * @returns debug display mesh
     */
    public createDebugNavMesh(scene: Scene): Mesh {
        if (!this.navMesh) {
            throw new Error("There is no navMesh generated.");
        }

        if (this.navMesh && this._tileCache) {
            WaitForFullTileCacheUpdate(this.navMesh, this._tileCache);
        }

        return CreateDebugNavMesh(this.navMesh, scene);
    }

    /**
     * Get a navigation mesh constrained position, closest to the parameter position
     * @param position world position
     * @returns the closest point to position constrained by the navigation mesh
     */
    public getClosestPoint(
        position: IVector3Like,
        options?: {
            /**
             * The polygon filter to apply to the query.
             */
            filter?: QueryFilter;
            /**
             * Half extents for the search box
             */
            halfExtents?: IVector3Like;
        }
    ): Vector3 {
        const ret = this._navMeshQuery.findClosestPoint(position, options);
        const pr = new Vector3(ret.point.x, ret.point.y, ret.point.z);
        return pr;
    }

    /**
     * Get a navigation mesh constrained position, closest to the parameter position
     * @param position world position
     * @param result output the closest point to position constrained by the navigation mesh
     */
    public getClosestPointToRef(
        position: IVector3Like,
        result: Vector3,
        options?: {
            /**
             * The polygon filter to apply to the query.
             */
            filter?: QueryFilter;
            /**
             * Half extents for the search box
             */
            halfExtents?: IVector3Like;
        }
    ): void {
        const ret = this._navMeshQuery.findClosestPoint(position, options);
        result.set(ret.point.x, ret.point.y, ret.point.z);
    }

    /**
     * Get a navigation mesh constrained position, within a particular radius
     * @param position world position
     * @param maxRadius the maximum distance to the constrained world position
     * @returns the closest point to position constrained by the navigation mesh
     */
    public getRandomPointAround(
        position: IVector3Like,
        maxRadius: number,
        options?: {
            startRef?: number;
            /**
             * The polygon filter to apply to the query.
             */
            filter?: QueryFilter;
            /**
             * Half extents for the search box
             */
            halfExtents?: IVector3Like;
        }
    ): Vector3 {
        const ret = this._navMeshQuery.findRandomPointAroundCircle(position, maxRadius, options);
        const pr = new Vector3(ret.randomPoint.x, ret.randomPoint.y, ret.randomPoint.z);
        return pr;
    }

    /**
     * Get a navigation mesh constrained position, within a particular radius
     * @param position world position
     * @param maxRadius the maximum distance to the constrained world position
     * @param result output the closest point to position constrained by the navigation mesh
     */
    public getRandomPointAroundToRef(
        position: IVector3Like,
        maxRadius: number,
        result: Vector3,
        options?: {
            startRef?: number;
            /**
             * The polygon filter to apply to the query.
             */
            filter?: QueryFilter;
            /**
             * Half extents for the search box
             */
            halfExtents?: IVector3Like;
        }
    ): void {
        const ret = this._navMeshQuery.findRandomPointAroundCircle(position, maxRadius, options);
        result.set(ret.randomPoint.x, ret.randomPoint.y, ret.randomPoint.z);
    }

    /**
     * Compute the final position from a segment made of destination-position
     * @param position position to start from
     * @param destination position to go to
     * @param startRef the reference id of the start polygon
     * @param options options for the function
     * @returns the resulting point along the navmesh
     */
    public moveAlong(
        position: IVector3Like,
        destination: IVector3Like,
        startRef = 0,
        options?: {
            /**
             * The polygon filter to apply to the query.
             */
            filter?: QueryFilter;
            /**
             * The maximum number of polygons the output visited array can hold.
             */
            maxVisitedSize?: number;
        }
    ): Vector3 {
        const ret = this._navMeshQuery.moveAlongSurface(startRef, position, destination, options);
        const pr = new Vector3(ret.resultPosition.x, ret.resultPosition.y, ret.resultPosition.z);
        return pr;
    }

    /**
     * Compute the final position from a segment made of destination-position
     * @param position world position
     * @param destination world position
     * @param result output the resulting point along the navmesh
     * @param startRef the reference id of the start polygon.
     * @param options options for the function
     */
    public moveAlongToRef(
        position: IVector3Like,
        destination: IVector3Like,
        result: Vector3,
        startRef = 0,
        options?: {
            /**
             * The polygon filter to apply to the query.
             */
            filter?: QueryFilter;
            maxVisitedSize?: number;
        }
    ): void {
        const ret = this._navMeshQuery.moveAlongSurface(startRef, position, destination, options);
        result.set(ret.resultPosition.x, ret.resultPosition.y, ret.resultPosition.z);
    }

    /**
     * Compute a navigation path from start to end. Returns an empty array if no path can be computed
     * Path is straight.
     * @param start world position
     * @param end world position
     * @param options options for the function
     * @returns array containing world position composing the path
     */
    public computePath(
        start: IVector3Like,
        end: IVector3Like,
        options?: {
            /**
             * The polygon filter to apply to the query.
             */
            filter?: QueryFilter;
            /**
             * Half extents for the search box
             */
            halfExtents?: IVector3Like;
            maxPathPolys?: number;
            maxStraightPathPoints?: number;
        }
    ): Vector3[] {
        return ConvertNavPathPoints(this._navMeshQuery.computePath(start, end, options));
    }

    /**
     * Compute a navigation path from start to end. Returns an empty array if no path can be computed.
     * Path follows navigation mesh geometry.
     * @param start world position
     * @param end world position
     * @param options options to configure the path computation
     * @returns array containing world position composing the path
     */
    public computePathSmooth(
        start: Vector3,
        end: Vector3,
        options?: {
            /**
             * The polygon filter to apply to the query.
             */
            filter?: QueryFilter;
            /**
             * Half extents for the search box
             */
            halfExtents?: IVector3Like;
            maxPathPolys?: number;
            maxSmoothPathPoints?: number;
            stepSize?: number;
            slop?: number;
        }
    ): Vector3[] {
        if (!this.navMesh) {
            Logger.Error("No navmesh available. Cannot compute smooth path.");
            return [];
        }
        return ComputeSmoothPath(this.navMesh, this._navMeshQuery, start, end, options);
    }

    /**
     * Create a new Crowd so you can add agents
     * @param maxAgents the maximum agent count in the crowd
     * @param maxAgentRadius the maximum radius an agent can have
     * @param scene to attach the crowd to
     * @returns the crowd you can add agents to
     */
    public createCrowd(maxAgents: number, maxAgentRadius: number, scene: Scene): ICrowd {
        const crowd = new RecastJSCrowd(this, maxAgents, maxAgentRadius, scene);
        this._crowd = crowd;
        return crowd;
    }

    /**
     * Set the Bounding box extent for doing spatial queries (getClosestPoint, getRandomPointAround, ...)
     * The queries will try to find a solution within those bounds
     * default is (1,1,1)
     * @param extent x,y,z value that define the extent around the queries point of reference
     */
    public setDefaultQueryExtent(extent: IVector3Like): void {
        this._navMeshQuery.defaultQueryHalfExtents = extent;
    }

    /**
     * Get the Bounding box extent specified by setDefaultQueryExtent
     * @returns the box extent values
     */
    public getDefaultQueryExtent(): Vector3 {
        return new Vector3(this._navMeshQuery.defaultQueryHalfExtents.x, this._navMeshQuery.defaultQueryHalfExtents.y, this._navMeshQuery.defaultQueryHalfExtents.z);
    }

    /**
     * Get the Bounding box extent result specified by setDefaultQueryExtent
     * @param result output the box extent values
     */
    public getDefaultQueryExtentToRef(result: Vector3): void {
        result.set(this._navMeshQuery.defaultQueryHalfExtents.x, this._navMeshQuery.defaultQueryHalfExtents.y, this._navMeshQuery.defaultQueryHalfExtents.z);
    }

    /**
     * build the navmesh from a previously saved state using getNavmeshData
     * @param data the Uint8Array returned by getNavmeshData
     */
    public buildFromNavmeshData(data: Uint8Array): void {
        const result = this.bjsRECAST.importNavMesh(data);
        this.navMesh = result.navMesh;
        this._navMeshQuery = new this.bjsRECAST.NavMeshQuery(this.navMesh);
    }

    /**
     * returns the navmesh data that can be used later. The navmesh must be built before retrieving the data
     * @returns data the Uint8Array that can be saved and reused
     */
    public getNavmeshData(): Uint8Array {
        if (!this.navMesh) {
            throw new Error("There is no NavMesh generated.");
        }
        return this.bjsRECAST.exportNavMesh(this.navMesh);
    }

    /**
     * build the tile cache from a previously saved state using getTileCacheData
     * @param tileCacheData the data returned by getTileCacheData
     * @param tileCacheMeshProcess optional process to apply to each tile created
     */
    public buildFromTileCacheData(tileCacheData: Uint8Array, tileCacheMeshProcess?: TileCacheMeshProcess): void {
        const result = this.bjsRECAST.importTileCache(tileCacheData, tileCacheMeshProcess ?? CreateDefaultTileCacheMeshProcess([]));
        this.navMesh = result.navMesh;
        this._tileCache = result.tileCache;
        this._navMeshQuery = new this.bjsRECAST.NavMeshQuery(this.navMesh);
    }

    /**
     * returns the tile cache data that can be used later. The tile cache must be built before retrieving the data
     * @returns the tile cache data that can be used later. The tile cache must be built before retrieving the data
     * @throws Error if there is no TileCache generated
     * @remarks The returned data can be used to rebuild the tile cache later using buildFromTileCacheData
     */
    public getTileCacheData(): Uint8Array {
        if (!this.navMesh || !this._tileCache) {
            throw new Error("There is no TileCache generated.");
        }
        return this.bjsRECAST.exportTileCache(this.navMesh, this._tileCache);
    }

    /**
     * Disposes
     */
    public dispose() {
        this._crowd?.dispose();
        this.navMesh?.destroy();
        this._navMeshQuery?.destroy();
        this._tileCache?.destroy();
    }

    /**
     * Creates a cylinder obstacle and add it to the navigation
     * @param position world position
     * @param radius cylinder radius
     * @param height cylinder height
     * @param doNotWaitForCacheUpdate if true the function will not wait for the tile cache to be fully updated before returning
     * @returns the obstacle freshly created
     */
    public addCylinderObstacle(position: IVector3Like, radius: number, height: number, doNotWaitForCacheUpdate = false): Nullable<IObstacle> {
        const obstacleResult = this._tileCache?.addCylinderObstacle(position, radius, height);
        if (!obstacleResult?.success) {
            return null;
        }

        if (!doNotWaitForCacheUpdate && this.navMesh && this._tileCache) {
            WaitForFullTileCacheUpdate(this.navMesh, this._tileCache);
        }

        return (obstacleResult.obstacle as IObstacle) ?? null;
    }

    /**
     * Creates an oriented box obstacle and add it to the navigation
     * @param position world position
     * @param extent box size
     * @param angle angle in radians of the box orientation on Y axis
     * @param doNotWaitForCacheUpdate if true the function will not wait for the tile cache to be fully updated before returning
     * @returns the obstacle freshly created
     */
    public addBoxObstacle(position: IVector3Like, extent: IVector3Like, angle: number, doNotWaitForCacheUpdate = false): Nullable<IObstacle> {
        const obstacleResult = this._tileCache?.addBoxObstacle(position, extent, angle);
        if (!obstacleResult?.success) {
            return null;
        }

        if (!doNotWaitForCacheUpdate && this.navMesh && this._tileCache) {
            WaitForFullTileCacheUpdate(this.navMesh, this._tileCache);
        }

        return (obstacleResult.obstacle as IObstacle) ?? null;
    }

    /**
     * Removes an obstacle created by addCylinderObstacle or addBoxObstacle
     * @param obstacle obstacle to remove from the navigation
     * @param doNotWaitForCacheUpdate if true the function will not wait for the tile cache to be fully updated before returning
     *
     */
    public removeObstacle(obstacle: IObstacle, doNotWaitForCacheUpdate = false): void {
        this._tileCache?.removeObstacle(obstacle);

        if (!doNotWaitForCacheUpdate && this.navMesh && this._tileCache) {
            WaitForFullTileCacheUpdate(this.navMesh, this._tileCache);
        }
    }

    /**
     * If this plugin is supported
     * @returns true if plugin is supported
     */
    public isSupported(): boolean {
        return !!this.bjsRECAST;
    }

    /**
     * Returns the seed used for randomized functions like `getRandomPointAround`
     * @returns seed number
     */
    public getRandomSeed(): number {
        return this.bjsRECAST.getRandomSeed();
    }

    /**
     * Set the seed used for randomized functions like `getRandomPointAround`
     * @param seed number used as seed for random functions
     */
    public setRandomSeed(seed: number): void {
        this.bjsRECAST.setRandomSeed(seed);
    }

    // New functions beyond the INavigationEnginePlugin interface

    /**
     * Perform a raycast on the navmesh
     * @param start start position
     * @param end end position
     * @returns if a direct path exists between start and end, and the hit point if any
     */
    public raycast(start: IVector3Like, end: IVector3Like) {
        const nearestStartPoly = this._navMeshQuery.findNearestPoly(start);
        const raycastResult = this._navMeshQuery.raycast(nearestStartPoly.nearestRef, start, end);

        const hit = 0 < raycastResult.t && raycastResult.t < 1.0;
        if (!hit) {
            return {
                hit: false,
            };
        } else {
            TmpVectors.Vector3[0].set(start.x, start.y, start.z);
            TmpVectors.Vector3[1].set(end.x, end.y, end.z);

            const distanceToHitBorder = Vector3.Distance(TmpVectors.Vector3[0], TmpVectors.Vector3[1]) * (raycastResult?.t ?? 0);
            const direction = TmpVectors.Vector3[1].subtract(TmpVectors.Vector3[0]).normalize();
            const hitPoint = TmpVectors.Vector3[0].add(direction.multiplyByFloats(distanceToHitBorder, distanceToHitBorder, distanceToHitBorder));

            return {
                hit: true,
                hitPoint,
            };
        }
    }

    /**
     * Compute the final position from a segment made of destination-position, and return the height of the polygon
     * This is a more sophisticated version of moveAlong that will use the height of the polygon at the end position
     * @param position world position to start from
     * @param velocity velocity of the movement
     * @param options options for the function
     * @returns the resulting point along the navmesh, the polygon reference id and the height of the polygon
     */
    public moveAlongWithVelocity(
        position: IVector3Like,
        velocity: IVector3Like,
        options?: {
            /**
             * The polygon filter to apply to the query.
             */
            filter?: QueryFilter;
            /**
             * Half extents for the search box
             */
            halfExtents?: IVector3Like;
            /**
             * The maximum number of polygons the output visited array can hold.
             */
            maxVisitedSize?: number;
        }
    ) {
        const { point, polyRef } = this._navMeshQuery.findClosestPoint(
            {
                x: position.x,
                y: position.y,
                z: position.z,
            },
            options
        );

        const { resultPosition } = this._navMeshQuery.moveAlongSurface(
            polyRef,
            point,
            {
                x: point.x + velocity.x,
                y: point.y + velocity.y,
                z: point.z + velocity.z,
            },
            options
        );
        const polyHeightResult = this._navMeshQuery.getPolyHeight(polyRef, resultPosition);

        return {
            position: { x: resultPosition.x, y: polyHeightResult.success ? polyHeightResult.height : resultPosition.y, z: resultPosition.z },
            polyRef: polyRef,
            height: polyHeightResult.height,
        };
    }

    /**
     * Handles common post-processing and validation of navmesh creation results
     * @param result The partial result from navmesh creation
     * @returns The validated and complete CreateNavMeshresult
     */
    private _processNavMeshResult(result: Nullable<Partial<CreateNavMeshResult>>): CreateNavMeshResult {
        if (!result?.navMesh || !result?.navMeshQuery) {
            throw new Error("Unable to create navmesh. No navMesh or navMeshQuery returned.");
        }

        this.navMesh = result.navMesh;
        this._navMeshQuery = result.navMeshQuery;
        this._intermediates = result.intermediates;
        this._tileCache = result.tileCache;

        return {
            navMesh: result.navMesh,
            navMeshQuery: result.navMeshQuery,
            intermediates: result.intermediates,
            tileCache: result.tileCache, // tileCache is optional
        };
    }

    private _preprocessParameters(parameters: INavMeshParametersV2) {
        // if maxObstacles is not defined, set it to a default value and set a default tile size if not defined
        if (parameters.maxObstacles === undefined) {
            parameters.tileSize = parameters.tileSize ?? 32; // maxObstacles will trigger tile cache creation, so we need a tile size
            parameters.maxObstacles = DefaultMaxObstacles;
        }

        parameters.walkableSlopeAngle = Math.max(0.1, parameters.walkableSlopeAngle ?? 60);
    }
}
