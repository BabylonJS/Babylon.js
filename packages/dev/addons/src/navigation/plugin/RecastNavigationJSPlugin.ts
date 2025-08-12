import type { SoloNavMeshGeneratorIntermediates, TiledNavMeshGeneratorIntermediates } from "@recast-navigation/generators";
import { generateTileCache } from "@recast-navigation/generators";
import type { NavMesh, QueryFilter, TileCache } from "@recast-navigation/core";
import { exportNavMesh, getRandomSeed, importNavMesh, NavMeshQuery, setRandomSeed } from "@recast-navigation/core";

import type { ICrowd, IObstacle } from "core/Navigation/INavigationEngine";
import { Logger } from "core/Misc/logger";
import type { Mesh } from "core/Meshes/mesh";
import type { Scene } from "core/scene";
import { Vector3 } from "core/Maths/math";
import type { IVector3Like } from "core/Maths/math.like";

import type { CreateNavMeshresult, INavigationEnginePluginV2, INavMeshParametersV2 } from "../types";
import { RecastJSCrowd } from "./RecastJSCrowd";
import { convertNavPathPoints } from "../common/convert";
import { computePathSmooth } from "../common/smooth-path";
import { createDebugNavMesh } from "../common/common";

/**
 * RecastJS navigation plugin
 */
export class RecastNavigationJSPluginV2 implements INavigationEnginePluginV2 {
    /**
     *  Creates a navigation mesh - will be injected by the factory
     * @param meshes array of all the geometry used to compute the navigation mesh
     * @param parameters bunch of parameters used to filter geometry
     * @returns the created navmesh and navmesh query
     */
    createNavMeshImpl: (meshes: Array<Mesh>, parameters: INavMeshParametersV2) => CreateNavMeshresult;
    /**
     *  Creates a navigation mesh - will be injected by the factory
     * @param meshes array of all the geometry used to compute the navigation mesh
     * @param parameters bunch of parameters used to filter geometry
     * @returns the created navmesh and navmesh query
     */
    createNavMeshAsyncImpl: (meshes: Array<Mesh>, parameters: INavMeshParametersV2) => Promise<CreateNavMeshresult>;

    /**
     * plugin name
     */
    public name: string = "RecastNavigationJSPlugin";

    /**
     * the first navmesh created. We might extend this to support multiple navmeshes
     */
    public navMesh?: NavMesh;
    /**
     *
     */
    public navMeshQuery!: NavMeshQuery;

    private _maximumSubStepCount: number = 10;
    private _timeStep: number = 1 / 60;
    private _timeFactor: number = 1;

    private _tileCache?: TileCache;

    private _positions: Float32Array = new Float32Array();
    private _indices: Uint32Array = new Uint32Array();

    /**
     *
     */
    public intermediates?: SoloNavMeshGeneratorIntermediates | TiledNavMeshGeneratorIntermediates;

    /**
     * Link to the scene is kept to unregister the crowd from the scene
     */
    private _scene: Scene;

    /**
     * Initializes the recastJS plugin
     * @param scene the scene to which the plugin is attached
     */
    public constructor(scene: Scene) {
        this._scene = scene;
    }

    /**
     * Creates a navigation mesh - will be injected by the factory
     * @param start the start position of the navmesh
     * @param end the end position of the navmesh
     * @param options options to configure the path computation
     * @returns array containing world position composing the path
     */
    public computePathSmooth(
        start: Vector3,
        end: Vector3,
        options?: { filter?: QueryFilter; halfExtents?: IVector3Like; maxPathPolys?: number; maxSmoothPathPoints?: number; stepSize?: number; slop?: number }
    ): Vector3[] {
        if (!this.navMesh) {
            Logger.Error("No navmesh available. Cannot compute smooth path.");
            return [];
        }
        return computePathSmooth(this.navMesh, this.navMeshQuery, start, end, options);
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
    public createNavMesh(meshes: Array<Mesh>, parameters: INavMeshParametersV2): CreateNavMeshresult {
        if (!this.createNavMeshImpl) {
            throw new Error("Function not injected yet. Use the factory to create the plugin.");
        }

        const result = this.createNavMeshImpl(meshes, parameters);

        if (!result?.navMesh) {
            throw new Error("Unable to create navmesh. No navMesh returned.");
        }

        this.navMesh = result.navMesh;
        this.navMeshQuery = result.navMeshQuery;

        return {
            navMesh: result.navMesh,
            navMeshQuery: result.navMeshQuery,
        };
    }
    /**
     * Creates a navigation mesh - will be injected by the factory
     * @param meshes array of all the geometry used to compute the navigation mesh
     * @param parameters bunch of parameters used to filter geometry
     * @returns the created navmesh and navmesh query
     * @throws Error if the function is not injected yet or if the navmesh is not created
     */
    public async createNavMeshAsync(meshes: Array<Mesh>, parameters: INavMeshParametersV2): Promise<CreateNavMeshresult> {
        if (!this.createNavMeshAsyncImpl) {
            throw new Error("Function not injected yet. Use the factory to create the plugin.");
        }

        const result = await this.createNavMeshAsyncImpl(meshes, parameters);

        if (!result?.navMesh) {
            throw new Error("Unable to create navmesh. No navMesh returned.");
        }

        this.navMesh = result.navMesh;
        this.navMeshQuery = result.navMeshQuery;

        return {
            navMesh: result.navMesh,
            navMeshQuery: result.navMeshQuery,
        };
    }

    /**
     * Create a navigation mesh debug mesh
     * @param scene is where the mesh will be added
     * @returns debug display mesh
     */
    public createDebugNavMesh(scene?: Scene): Mesh {
        if (!this.navMesh) {
            throw new Error("There is no NavMesh generated.");
        }

        return createDebugNavMesh(this.navMesh, scene ?? this._scene);
    }

    /**
     * Get a navigation mesh constrained position, closest to the parameter position
     * @param position world position
     * @returns the closest point to position constrained by the navigation mesh
     */
    public getClosestPoint(
        position: IVector3Like,
        options?: {
            filter?: QueryFilter;
            halfExtents?: Vector3;
        }
    ): Vector3 {
        const ret = this.navMeshQuery.findClosestPoint(position, options);
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
            filter?: QueryFilter;
            halfExtents?: Vector3;
        }
    ): void {
        const ret = this.navMeshQuery.findClosestPoint(position, options);
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
            filter?: QueryFilter;
            halfExtents?: Vector3;
        }
    ): Vector3 {
        const ret = this.navMeshQuery.findRandomPointAroundCircle(position, maxRadius, options);
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
            filter?: QueryFilter;
            halfExtents?: Vector3;
        }
    ): void {
        const ret = this.navMeshQuery.findRandomPointAroundCircle(position, maxRadius, options);
        result.set(ret.randomPoint.x, ret.randomPoint.y, ret.randomPoint.z);
    }

    /**
     * Compute the final position from a segment made of destination-position
     * @param position world position
     * @param destination world position
     * @returns the resulting point along the navmesh
     */
    public moveAlong(position: IVector3Like, destination: IVector3Like): Vector3 {
        const ret = this.navMeshQuery.moveAlongSurface(0, position, destination);
        const pr = new Vector3(ret.resultPosition.x, ret.resultPosition.y, ret.resultPosition.z);
        return pr;
    }

    /**
     * Compute the final position from a segment made of destination-position
     * @param position world position
     * @param destination world position
     * @param result output the resulting point along the navmesh
     */
    public moveAlongToRef(position: IVector3Like, destination: IVector3Like, result: Vector3): void {
        const ret = this.navMeshQuery.moveAlongSurface(0, position, destination);
        result.set(ret.resultPosition.x, ret.resultPosition.y, ret.resultPosition.z);
    }

    /**
     * Compute a navigation path from start to end. Returns an empty array if no path can be computed
     * Path is straight.
     * @param start world position
     * @param end world position
     * @returns array containing world position composing the path
     */
    public computePath(start: IVector3Like, end: IVector3Like): Vector3[] {
        return convertNavPathPoints(
            this.navMeshQuery.computePath(start, end, {
                // halfExtents: new Vector3(3, 3, 3),
            })
        );
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
        return crowd;
    }

    /**
     * Set the Bounding box extent for doing spatial queries (getClosestPoint, getRandomPointAround, ...)
     * The queries will try to find a solution within those bounds
     * default is (1,1,1)
     * @param extent x,y,z value that define the extent around the queries point of reference
     */
    public setDefaultQueryExtent(extent: IVector3Like): void {
        this.navMeshQuery.defaultQueryHalfExtents = extent;
    }

    /**
     * Get the Bounding box extent specified by setDefaultQueryExtent
     * @returns the box extent values
     */
    public getDefaultQueryExtent(): Vector3 {
        return new Vector3(this.navMeshQuery.defaultQueryHalfExtents.x, this.navMeshQuery.defaultQueryHalfExtents.y, this.navMeshQuery.defaultQueryHalfExtents.z);
    }

    /**
     * Get the Bounding box extent result specified by setDefaultQueryExtent
     * @param result output the box extent values
     */
    public getDefaultQueryExtentToRef(result: Vector3): void {
        result.set(this.navMeshQuery.defaultQueryHalfExtents.x, this.navMeshQuery.defaultQueryHalfExtents.y, this.navMeshQuery.defaultQueryHalfExtents.z);
    }

    /**
     * build the navmesh from a previously saved state using getNavmeshData
     * @param data the Uint8Array returned by getNavmeshData
     */
    public buildFromNavmeshData(data: Uint8Array): void {
        const result = importNavMesh(data);
        this.navMesh = result.navMesh;
        this.navMeshQuery = new NavMeshQuery(this.navMesh);
    }

    /**
     * returns the navmesh data that can be used later. The navmesh must be built before retrieving the data
     * @returns data the Uint8Array that can be saved and reused
     */
    public getNavmeshData(): Uint8Array {
        if (!this.navMesh) {
            throw new Error("There is no NavMesh generated.");
        }
        return exportNavMesh(this.navMesh);
    }

    /**
     * Disposes
     */
    public dispose() {
        // nothing to dispose - mimics the behavior of the original navgiation plugin
    }

    private _createTileCache(tileSize = 32) {
        if (!this._tileCache) {
            const { success, navMesh, tileCache } = generateTileCache(this._positions, this._indices, {
                tileSize,
            });
            if (!success) {
                Logger.Error("Unable to generateTileCache.");
            } else {
                this._tileCache = tileCache;
                this.navMesh = navMesh;
            }
        }
    }

    /**
     * Creates a cylinder obstacle and add it to the navigation
     * @param position world position
     * @param radius cylinder radius
     * @param height cylinder height
     * @returns the obstacle freshly created
     */
    public addCylinderObstacle(position: IVector3Like, radius: number, height: number): IObstacle {
        this._createTileCache();
        return this._tileCache?.addCylinderObstacle(position, radius, height) ?? (null as unknown as IObstacle);
    }

    /**
     * Creates an oriented box obstacle and add it to the navigation
     * @param position world position
     * @param extent box size
     * @param angle angle in radians of the box orientation on Y axis
     * @returns the obstacle freshly created
     */
    public addBoxObstacle(position: IVector3Like, extent: IVector3Like, angle: number): IObstacle {
        this._createTileCache();
        return this._tileCache?.addBoxObstacle(position, extent, angle) ?? (null as unknown as IObstacle);
    }

    /**
     * Removes an obstacle created by addCylinderObstacle or addBoxObstacle
     * @param obstacle obstacle to remove from the navigation
     */
    public removeObstacle(obstacle: IObstacle): void {
        this._tileCache?.removeObstacle(obstacle);
    }

    /**
     * If this plugin is supported
     * @returns true if plugin is supported
     */
    public isSupported(): boolean {
        return true;
    }

    /**
     * Returns the seed used for randomized functions like `getRandomPointAround`
     * @returns seed number
     */
    public getRandomSeed(): number {
        return getRandomSeed();
    }

    /**
     * Set the seed used for randomized functions like `getRandomPointAround`
     * @param seed number used as seed for random functions
     */
    public setRandomSeed(seed: number): void {
        setRandomSeed(seed);
    }
}
