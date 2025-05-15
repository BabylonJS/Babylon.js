import type { ICrowd, IAgentParameters, INavMeshParameters0, IObstacle, INavigationEnginePlugin } from "../INavigationEngine";
import { Logger } from "../../Misc/logger";
import { VertexData } from "../../Meshes/mesh.vertexData";
import { Mesh } from "../../Meshes/mesh";
import type { Scene } from "../../scene";
import { Epsilon, Matrix, Vector3 } from "../../Maths/math";
import type { TransformNode } from "../../Meshes/transformNode";
import type { Observer } from "../../Misc/observable";
import { Observable } from "../../Misc/observable";
import type { Nullable } from "../../types";
import { VertexBuffer } from "../../Buffers/buffer";
import type { IVector3Like } from "../../Maths/math.like";

type TiledParams = INavMeshParameters0 & { tileSize: number; expectedLayersPerTile: number };

type SoloNavMeshGeneratorConfig = any;
type SoloNavMeshGeneratorIntermediates = any;
type TiledNavMeshGeneratorConfig = any;
// type TiledNavMeshGeneratorIntermediates = any;

// // eslint-disable-next-line @typescript-eslint/naming-convention
// type generateSoloNavMesh = any;
// // eslint-disable-next-line @typescript-eslint/naming-convention
// type generateTileCache = any;
// // eslint-disable-next-line @typescript-eslint/naming-convention
// type generateTiledNavMesh = any;

type NavMesh = any;
type QueryFilter = any;
type TileCache = any;

type Crowd = any;
const Detour: any = {};
type NavMeshQuery = any;
// // eslint-disable-next-line @typescript-eslint/naming-convention
// type exportNavMesh = any;
// // eslint-disable-next-line @typescript-eslint/naming-convention
// type getNavMeshPositionsAndIndices = any;
// // eslint-disable-next-line @typescript-eslint/naming-convention
// type getRandomSeed = any;
// // eslint-disable-next-line @typescript-eslint/naming-convention
// type importNavMesh = any;
// // eslint-disable-next-line @typescript-eslint/naming-convention
// type setRandomSeed = any;

// import type { SoloNavMeshGeneratorConfig, SoloNavMeshGeneratorIntermediates, TiledNavMeshGeneratorConfig, TiledNavMeshGeneratorIntermediates } from "recast-navigation/generators";
// import { generateSoloNavMesh, generateTileCache, generateTiledNavMesh } from "recast-navigation/generators";
// import type { NavMesh, QueryFilter, TileCache } from "recast-navigation";
// import { Crowd, Detour, exportNavMesh, getNavMeshPositionsAndIndices, getRandomSeed, importNavMesh, NavMeshQuery, setRandomSeed } from "recast-navigation";

// eslint-disable-next-line @typescript-eslint/naming-convention
declare let Recast: any;
// eslint-disable-next-line @typescript-eslint/naming-convention
declare let RecastGenerators: any;

// interface INavMeshParameters {
//   expectedLayersPerTile: number;
//   maxLayers: number;
// }

type ComputeSmoothPathErrorType = (typeof ComputePathError)[keyof typeof ComputePathError];

type ComputeSmoothPathResult = {
    success: boolean;
    error?: {
        type: ComputeSmoothPathErrorType;
        status?: number;
    };
    path: Vector3[];
};

type GetSteerTargetResult =
    | {
          success: false;
      }
    | {
          success: true;
          steerPos: Vector3;
          steerPosFlag: number;
          steerPosRef: number;
          points: Vector3[];
      };

const ComputePathError = {
    START_NEAREST_POLY_FAILED: "START_NEAREST_POLY_FAILED",
    END_NEAREST_POLY_FAILED: "END_NEAREST_POLY_FAILED",
    FIND_PATH_FAILED: "FIND_PATH_FAILED",
    NO_POLYGON_PATH_FOUND: "NO_POLYGON_PATH_FOUND",
    NO_CLOSEST_POINT_ON_LAST_POLYGON_FOUND: "NO_CLOSEST_POINT_ON_LAST_POLYGON_FOUND",
};

/**
 * RecastJS navigation plugin
 */
export class RecastJSPlugin implements INavigationEnginePlugin {
    /**
     * Reference to the Recast library
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public bjsRECAST: any = {};

    /**
     * plugin name
     */
    public name: string = "RecastJSPlugin";

    /**
     * the first navmesh created. We might extend this to support multiple navmeshes
     */
    public navMesh?: NavMesh;
    /**
     *
     */
    public navMeshQuery!: NavMeshQuery;

    /**
     *
     */
    public intermediates?: SoloNavMeshGeneratorIntermediates;

    private _maximumSubStepCount: number = 10;
    private _timeStep: number = 1 / 60;
    private _timeFactor: number = 1;

    private _tileCache?: TileCache;

    private _worker: Nullable<Worker> = null;

    // TODO: Nullable?
    private _positions: Float32Array = new Float32Array();
    private _indices: Uint32Array = new Uint32Array();

    public get positions() {
        return this._positions;
    }

    public get indices() {
        return this._indices;
    }

    private _tmpDelta = new Vector3();
    private _tmpMoveTarget = new Vector3();
    // private _tempVec1: any;
    // private _tempVec2: any;

    /**
     * Initializes the recastJS plugin
     * @param recastInjection can be used to inject your own recast reference
     * @param recastGeneratorsInjection can be used to inject your own generators
     */
    public constructor(recastInjection: any = Recast, recastGeneratorsInjection: any = RecastGenerators) {
        if (typeof recastInjection === "function") {
            Logger.Error("RecastJS is not ready. Please make sure you await Recast() before using the plugin.");
        } else {
            this.bjsRECAST = { ...recastInjection, ...recastGeneratorsInjection };
        }

        if (!this.isSupported()) {
            Logger.Error("RecastJS is not available. Please make sure you included the js file.");
            return;
        }
        this.setTimeStep();

        // TODO: use these wherever possible
        // this._tempVec1 = new this.bjsRECAST.vec3();
        // this._tempVec2 = new this.bjsRECAST.vec3();
    }

    createNavMeshWorker(_meshes: Array<Mesh>, _parameters: INavMeshParameters0, _completion: (data?: Uint8Array) => void): void {
        // TODO: implement
        throw new Error("Method not implemented.");
    }

    /**
     * Set worker URL to be used when generating a new navmesh
     * @param workerURL url string
     * @returns boolean indicating if worker is created
     */
    public setWorkerURL(workerURL: string | URL): boolean {
        if (window && window.Worker) {
            this._worker = new Worker(workerURL, {
                type: "module",
            });
            return true;
        }
        return false;
    }

    public setWorker(worker: Worker): boolean {
        if (window && window.Worker) {
            this._worker = worker;
            return true;
        }
        return false;
    }

    /**
     * Set the time step of the navigation tick update.
     * Default is 1/60.
     * A value of 0 will disable fixed time update
     * @param newTimeStep the new timestep to apply to this world.
     */
    setTimeStep(newTimeStep: number = 1 / 60): void {
        this._timeStep = newTimeStep;
    }

    /**
     * Get the time step of the navigation tick update.
     * @returns the current time step
     */
    getTimeStep(): number {
        return this._timeStep;
    }

    /**
     * If delta time in navigation tick update is greater than the time step
     * a number of sub iterations are done. If more iterations are need to reach deltatime
     * they will be discarded.
     * A value of 0 will set to no maximum and update will use as many substeps as needed
     * @param newStepCount the maximum number of iterations
     */
    setMaximumSubStepCount(newStepCount: number = 10): void {
        this._maximumSubStepCount = newStepCount;
    }

    /**
     * Get the maximum number of iterations per navigation tick update
     * @returns the maximum number of iterations
     */
    getMaximumSubStepCount(): number {
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

    private _getReversedIndices(mesh: Mesh) {
        const indices = mesh.getIndices(false, true);

        if (indices) {
            // Reverse the order of vertices in each triangle (3 indices per face)
            for (let i = 0; i < indices.length; i += 3) {
                // Swap the second and third index to reverse the winding order
                const temp = indices[i + 1];
                indices[i + 1] = indices[i + 2];
                indices[i + 2] = temp;
            }
        }

        return indices;
    }

    private _getPositionsAndIndices(
        meshes: Mesh[],
        positionsOffset: IVector3Like = {
            x: 0,
            y: 0,
            z: 0,
        }
    ): [positions: Float32Array, indices: Uint32Array] {
        let offset = 0;
        let index: number;
        let tri: number;
        let pt: number;
        const positions = [];
        const indices = [];

        for (index = 0; index < meshes.length; index++) {
            if (meshes[index]) {
                const mesh = meshes[index];

                const meshIndices = this._getReversedIndices(mesh);
                if (!meshIndices) {
                    continue;
                }

                const meshPositions = mesh.getVerticesData(VertexBuffer.PositionKind, false, false);
                if (!meshPositions) {
                    continue;
                }

                const worldMatrices = [];
                const worldMatrix = mesh.computeWorldMatrix(true);

                if (mesh.hasThinInstances) {
                    const thinMatrices = mesh.thinInstanceGetWorldMatrices();
                    for (let instanceIndex = 0; instanceIndex < thinMatrices.length; instanceIndex++) {
                        const tmpMatrix = new Matrix();
                        const thinMatrix = thinMatrices[instanceIndex];
                        thinMatrix.multiplyToRef(worldMatrix, tmpMatrix);
                        worldMatrices.push(tmpMatrix);
                    }
                } else {
                    worldMatrices.push(worldMatrix);
                }

                for (let matrixIndex = 0; matrixIndex < worldMatrices.length; matrixIndex++) {
                    const wm = worldMatrices[matrixIndex];
                    for (tri = 0; tri < meshIndices.length; tri++) {
                        indices.push(meshIndices[tri] + offset);
                    }

                    // TODO: use tmp vectors
                    const transformed = Vector3.Zero();
                    const position = Vector3.Zero();
                    for (pt = 0; pt < meshPositions.length; pt += 3) {
                        Vector3.FromArrayToRef(meshPositions, pt, position);
                        Vector3.TransformCoordinatesToRef(position, wm, transformed);
                        positions.push(transformed.x + positionsOffset.x, transformed.y + positionsOffset.y, transformed.z + positionsOffset.z);
                    }

                    offset += meshPositions.length / 3;
                }
            }
        }

        return [Float32Array.from(positions), Uint32Array.from(indices)];
    }

    // https://docs.recast-navigation-js.isaacmason.com/types/index.RecastConfig.html
    // Detailed config info: https://rwindegger.github.io/recastnavigation/structrcConfig.html
    private static _CreateNavMeshConfig<T extends INavMeshParameters0>(
        parameters: T
    ): T extends { tileSize: number } ? Partial<TiledNavMeshGeneratorConfig> : SoloNavMeshGeneratorConfig {
        const cfg = {
            // The size of the non-navigatable border around the heightfield.
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

            // expectedLayersPerTile: parameters.expectedLayersPerTile,

            // The maximum allowed length for contour edges along the border of the mesh.
            // [Limit: >=0]
            // [Units: vx] [12]
            maxEdgeLen: parameters.maxEdgeLen,

            // maxLayers: parameters.maxLayers,

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
        };

        if (RecastJSPlugin._IsTiledParams(parameters)) {
            return {
                ...cfg,
                expectedLayersPerTile: parameters.expectedLayersPerTile,
                maxLayers: parameters.maxLayers,
                tileSize: parameters.tileSize,
            } as Partial<TiledNavMeshGeneratorConfig>;
        }

        delete parameters.tileSize;

        // If no tileSize, return the config as SoloNavMeshGeneratorConfig
        return cfg as SoloNavMeshGeneratorConfig;
    }

    // If tileSize is present and > 0, return the config as TiledNavMeshGeneratorConfig
    private static _IsTiledParams(p: INavMeshParameters0): p is TiledParams {
        return typeof (p as any).tileSize === "number" && (p as any).tileSize > 0 && typeof (p as any).expectedLayersPerTile === "number";
    }

    /**
     * Creates a navigation mesh
     * @param meshes array of all the geometry used to compute the navigation mesh
     * @param parameters bunch of parameters used to filter geometry
     * @param completion callback when data is available from the worker. Not used without a worker
     * @param positionOffset offsets the navmesh by this value
     */
    createNavMesh(meshes: Array<Mesh>, parameters: INavMeshParameters0, completion?: (navmeshData: Uint8Array) => void, positionOffset?: IVector3Like): void {
        if (this._worker && !completion) {
            Logger.Warn("A worker is avaible but no completion callback. Defaulting to blocking navmesh creation");
        } else if (!this._worker && completion) {
            Logger.Warn("A completion callback is avaible but no worker. Defaulting to blocking navmesh creation");
        }

        if (meshes.length === 0) {
            throw new Error("At least one mesh is needed to create the nav mesh.");
        }

        const [positions, indices] = this._getPositionsAndIndices(meshes, positionOffset);

        this._positions = positions;
        this._indices = indices;

        const config = RecastJSPlugin._CreateNavMeshConfig(parameters);

        if (this._worker && completion) {
            // spawn worker and send message
            this._worker.postMessage(
                {
                    positions: this._positions,
                    indices: this._indices,
                    config,
                },
                [this._positions.buffer, this._indices.buffer]
            );
            this._worker.onmessage = (e) => {
                if (e.data?.succes === false) {
                    throw new Error(`Unable to generateSoloNavMesh:${e}`);
                } else {
                    this.buildFromNavmeshData(e.data);
                    completion(e.data);

                    if (this.navMesh) {
                        this.navMeshQuery = new this.bjsRECAST.NavMeshQuery(this.navMesh);
                    }
                }
            };
        } else {
            // blocking calls
            if (!this._positions || !this._indices) {
                throw new Error("Unable to get nav mesh. No vertices or indices.");
            }

            // generate solo or tiled navmesh
            const navMeshResult =
                "tileSize" in config
                    ? this.bjsRECAST.generateTiledNavMesh(positions, indices, config as TiledNavMeshGeneratorConfig, parameters.keepIntermediates)
                    : this.bjsRECAST.generateSoloNavMesh(positions, indices, config, parameters.keepIntermediates);

            if (!navMeshResult.success) {
                throw new Error(`Unable to generateSoloNavMesh:${navMeshResult.error}`);
            }

            this.navMesh = navMeshResult.navMesh;
            this.navMeshQuery = new this.bjsRECAST.NavMeshQuery(navMeshResult.navMesh);
            this.intermediates = navMeshResult.intermediates;
        }
    }

    /**
     * Create a navigation mesh debug mesh
     * @param scene is where the mesh will be added
     * @returns debug display mesh
     */
    createDebugNavMesh(scene: Scene): Mesh {
        if (!this.navMesh) {
            throw new Error("There is no NavMesh generated.");
        }

        const [positions, indices] = this.bjsRECAST.getNavMeshPositionsAndIndices(this.navMesh);

        const mesh = new Mesh("NavMeshDebug", scene);
        const vertexData = new VertexData();

        for (let i = 0; i < indices.length; i += 3) {
            // Swap the order of the second and third vertex in each triangle
            [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
        }

        vertexData.indices = indices;
        vertexData.positions = positions;
        vertexData.applyToMesh(mesh, false);

        return mesh;
    }

    /**
     * Get a navigation mesh constrained position, closest to the parameter position
     * @param position world position
     * @returns the closest point to position constrained by the navigation mesh
     */
    getClosestPoint(
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
    getClosestPointToRef(
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
    getRandomPointAround(
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
    getRandomPointAroundToRef(
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
    moveAlong(position: IVector3Like, destination: IVector3Like): Vector3 {
        const ret = this.navMeshQuery.moveAlongSurface(0, position, destination);
        return new Vector3(ret.resultPosition.x, ret.resultPosition.y, ret.resultPosition.z);
    }

    /**
     * Compute the final position from a segment made of destination-position
     * @param position world position
     * @param destination world position
     * @param result output the resulting point along the navmesh
     */
    moveAlongToRef(position: IVector3Like, destination: IVector3Like, result: Vector3): void {
        const ret = this.navMeshQuery.moveAlongSurface(0, position, destination);
        result.set(ret.resultPosition.x, ret.resultPosition.y, ret.resultPosition.z);
    }

    private _convertNavPathPoints(
        navPath:
            | {
                  error?: {
                      name: string;
                      status?: number;
                  };
                  path: IVector3Like[];
                  success: boolean;
              }
            | ComputeSmoothPathResult
    ): Vector3[] {
        const positions = [];

        if (navPath.success) {
            const pointCount = navPath.path.length;
            for (let pt = 0; pt < pointCount; pt++) {
                const p = navPath.path[pt];
                positions.push(new Vector3(p.x, p.y, p.z));
            }
        } else {
            Logger.Warn("Unable to convert navigation path point, because navPath generation has failed.");
        }

        return positions;
    }

    /**
     * Compute a navigation path from start to end. Returns an empty array if no path can be computed
     * Path is straight.
     * @param start world position
     * @param end world position
     * @returns array containing world position composing the path
     */
    computePath(start: IVector3Like, end: IVector3Like): Vector3[] {
        return this._convertNavPathPoints(
            this.navMeshQuery.computePath(start, end, {
                // halfExtents: new Vector3(3, 3, 3),
            })
        );
    }

    /**
     * Compute a smooth navigation path from start to end. Returns an empty array if no path can be computed
     * @param start world position
     * @param end world position
     * @param options options object
     * @returns array containing world position composing the path
     */
    computePathSmooth(
        start: IVector3Like,
        end: IVector3Like,
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
    ): Vector3[] {
        if (!this.navMesh) {
            return [];
        }

        return this._convertNavPathPoints(this._computeSmoothPath(this.navMesh, start, end, options));
    }

    private _computeSmoothPath(
        navMesh: NavMesh,
        start: IVector3Like,
        end: IVector3Like,
        options?: {
            filter?: QueryFilter;
            halfExtents?: IVector3Like;
            maxPathPolys?: number;
            maxSmoothPathPoints?: number;
            stepSize?: number;
            slop?: number;
        }
    ): ComputeSmoothPathResult {
        const filter = options?.filter ?? this.navMeshQuery.defaultFilter;
        const halfExtents = options?.halfExtents ?? this.navMeshQuery.defaultQueryHalfExtents;

        const maxSmoothPathPoints = options?.maxSmoothPathPoints ?? 2048;

        const maxPathPolys = options?.maxPathPolys ?? 256;

        const stepSize = options?.stepSize ?? 0.5;
        const slop = options?.slop ?? 0.01;

        // find nearest polygons for start and end positions
        const startNearestPolyResult = this.navMeshQuery.findNearestPoly(start, {
            filter,
            halfExtents,
        });

        if (!startNearestPolyResult.success) {
            return {
                success: false,
                error: {
                    type: ComputePathError.START_NEAREST_POLY_FAILED,
                    status: startNearestPolyResult.status,
                },
                path: [],
            };
        }

        const endNearestPolyResult = this.navMeshQuery.findNearestPoly(end, {
            filter,
            halfExtents,
        });

        if (!endNearestPolyResult.success) {
            return {
                success: false,
                error: {
                    type: ComputePathError.END_NEAREST_POLY_FAILED,
                    status: endNearestPolyResult.status,
                },
                path: [],
            };
        }

        const startRef = startNearestPolyResult.nearestRef;
        const endRef = endNearestPolyResult.nearestRef;

        // find polygon path
        const findPathResult = this.navMeshQuery.findPath(startRef, endRef, start, end, {
            filter,
            maxPathPolys,
        });

        if (!findPathResult.success) {
            return {
                success: false,
                error: {
                    type: ComputePathError.FIND_PATH_FAILED,
                    status: findPathResult.status,
                },
                path: [],
            };
        }

        if (findPathResult.polys.size <= 0) {
            return {
                success: false,
                error: {
                    type: ComputePathError.NO_POLYGON_PATH_FOUND,
                },
                path: [],
            };
        }

        const lastPoly = findPathResult.polys.get(findPathResult.polys.size - 1);

        let closestEnd = end;

        if (lastPoly !== endRef) {
            const lastPolyClosestPointResult = this.navMeshQuery.closestPointOnPoly(lastPoly, end);

            if (!lastPolyClosestPointResult.success) {
                return {
                    success: false,
                    error: {
                        type: ComputePathError.NO_CLOSEST_POINT_ON_LAST_POLYGON_FOUND,
                        status: lastPolyClosestPointResult.status,
                    },
                    path: [],
                };
            }

            closestEnd = lastPolyClosestPointResult.closestPoint;
        }

        // Iterate over the path to find a smooth path on the detail mesh
        const iterPos = new Vector3(start.x, start.y, start.z);
        const targetPos = new Vector3(closestEnd.x, closestEnd.y, closestEnd.z);

        const polys = [...findPathResult.polys.getHeapView()];
        const smoothPath: Vector3[] = [];

        smoothPath.push(iterPos.clone());

        while (polys.length > 0 && smoothPath.length < maxSmoothPathPoints) {
            // Find location to steer towards
            const steerTarget = RecastJSPlugin._GetSteerTarget(this.navMeshQuery, iterPos, targetPos, slop, polys);

            if (!steerTarget.success) {
                break;
            }

            const isEndOfPath = steerTarget.steerPosFlag & Detour.DT_STRAIGHTPATH_END;

            const isOffMeshConnection = steerTarget.steerPosFlag & Detour.DT_STRAIGHTPATH_OFFMESH_CONNECTION;

            // Find movement delta.
            const steerPos = steerTarget.steerPos;

            const delta = this._tmpDelta.copyFrom(steerPos).subtract(iterPos);

            let len = Math.sqrt(delta.dot(delta));

            // If the steer target is the end of the path or an off-mesh connection, do not move past the location.
            if ((isEndOfPath || isOffMeshConnection) && len < stepSize) {
                len = 1;
            } else {
                len = stepSize / len;
            }

            const moveTarget = this._tmpMoveTarget.copyFrom(iterPos).addInPlace(delta.scale(len));

            // Move
            const moveAlongSurface = this.navMeshQuery.moveAlongSurface(polys[0], iterPos, moveTarget, { filter, maxVisitedSize: 16 });

            if (!moveAlongSurface.success) {
                break;
            }

            const result = moveAlongSurface.resultPosition;

            RecastJSPlugin._FixupCorridor(polys, maxPathPolys, moveAlongSurface.visited);
            RecastJSPlugin._FixupShortcuts(polys, navMesh);

            const polyHeightResult = this.navMeshQuery.getPolyHeight(polys[0], result);

            if (polyHeightResult.success) {
                result.y = polyHeightResult.height;
            }

            iterPos.copyFromFloats(result.x, result.y, result.z);

            // Handle end of path and off-mesh links when close enough
            if (isEndOfPath && RecastJSPlugin._InRange(iterPos, steerTarget.steerPos, slop, 1.0)) {
                // Reached end of path
                iterPos.copyFrom(targetPos);

                if (smoothPath.length < maxSmoothPathPoints) {
                    smoothPath.push(new Vector3(iterPos.x, iterPos.y, iterPos.z));
                }

                break;
            } else if (isOffMeshConnection && RecastJSPlugin._InRange(iterPos, steerTarget.steerPos, slop, 1.0)) {
                // Reached off-mesh connection.

                // Advance the path up to and over the off-mesh connection.
                const offMeshConRef = steerTarget.steerPosRef;

                // Advance the path up to and over the off-mesh connection.
                let prevPolyRef = 0;
                let polyRef = polys[0];

                let npos = 0;

                while (npos < polys.length && polyRef !== offMeshConRef) {
                    prevPolyRef = polyRef;
                    polyRef = polys[npos];
                    npos++;
                }

                for (let i = npos; i < polys.length; i++) {
                    polys[i - npos] = polys[i];
                }
                polys.splice(npos, polys.length - npos);

                // Handle the connection
                const offMeshConnectionPolyEndPoints = navMesh.getOffMeshConnectionPolyEndPoints(prevPolyRef, polyRef);

                if (offMeshConnectionPolyEndPoints.success) {
                    if (smoothPath.length < maxSmoothPathPoints) {
                        smoothPath.push(new Vector3(iterPos.x, iterPos.y, iterPos.z));

                        // Hack to make the dotted path not visible during off-mesh connection.
                        if (smoothPath.length & 1) {
                            smoothPath.push(new Vector3(iterPos.x, iterPos.y, iterPos.z));
                        }

                        // Move position at the other side of the off-mesh link.
                        iterPos.copyFromFloats(offMeshConnectionPolyEndPoints.end.x, offMeshConnectionPolyEndPoints.end.y, offMeshConnectionPolyEndPoints.end.z);

                        const endPositionPolyHeight = this.navMeshQuery.getPolyHeight(polys[0], iterPos);

                        if (endPositionPolyHeight.success) {
                            iterPos.y = endPositionPolyHeight.height;
                        }
                    }
                }
            }

            // Store results.
            if (smoothPath.length < maxSmoothPathPoints) {
                smoothPath.push(new Vector3(iterPos.x, iterPos.y, iterPos.z));
            }
        }

        return {
            success: true,
            path: smoothPath,
        };
    }

    private static _GetSteerTarget(navMeshQuery: NavMeshQuery, start: Vector3, end: Vector3, minTargetDist: number, pathPolys: number[]): GetSteerTargetResult {
        const maxSteerPoints = 3;

        const straightPath = navMeshQuery.findStraightPath(start, end, pathPolys, {
            maxStraightPathPoints: maxSteerPoints,
        });

        if (!straightPath.success) {
            return {
                success: false,
            };
        }

        const outPoints: Vector3[] = [];
        for (let i = 0; i < straightPath.straightPathCount; i++) {
            const point = new Vector3(straightPath.straightPath.get(i * 3), straightPath.straightPath.get(i * 3 + 1), straightPath.straightPath.get(i * 3 + 2));

            outPoints.push(point);
        }

        // Find vertex far enough to steer to
        let ns = 0;
        while (ns < outPoints.length) {
            // Stop at Off-Mesh link or when point is further than slop away
            if (straightPath.straightPathFlags.get(ns) & Detour.DT_STRAIGHTPATH_OFFMESH_CONNECTION) {
                break;
            }

            const posA = outPoints[ns];
            const posB = start;

            if (!RecastJSPlugin._InRange(posA, posB, minTargetDist, 1000.0)) {
                break;
            }

            ns++;
        }

        // Failed to find good point to steer to
        if (ns >= straightPath.straightPathCount) {
            return {
                success: false,
            };
        }

        const steerPos = outPoints[ns];
        const steerPosFlag = straightPath.straightPathFlags.get(ns);
        const steerPosRef = straightPath.straightPathRefs.get(ns);

        return {
            success: true,
            steerPos,
            steerPosFlag,
            steerPosRef,
            points: outPoints,
        };
    }

    private static _InRange(a: Vector3, b: Vector3, r: number, h: number) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dz = b.z - a.z;
        return dx * dx + dz * dz < r && Math.abs(dy) < h;
    }

    private static _FixupCorridor(pathPolys: number[], maxPath: number, visitedPolyRefs: number[]) {
        let furthestPath = -1;
        let furthestVisited = -1;

        // Find furthest common polygon.
        for (let i = pathPolys.length - 1; i >= 0; i--) {
            let found = false;
            for (let j = visitedPolyRefs.length - 1; j >= 0; j--) {
                if (pathPolys[i] === visitedPolyRefs[j]) {
                    furthestPath = i;
                    furthestVisited = j;
                    found = true;
                }
            }
            if (found) {
                break;
            }
        }

        // If no intersection found just return current path.
        if (furthestPath === -1 || furthestVisited === -1) {
            return pathPolys;
        }

        // Concatenate paths.

        // Adjust beginning of the buffer to include the visited.
        const req = visitedPolyRefs.length - furthestVisited;
        const orig = Math.min(furthestPath + 1, pathPolys.length);

        let size = Math.max(0, pathPolys.length - orig);

        if (req + size > maxPath) {
            size = maxPath - req;
        }
        if (size) {
            pathPolys.splice(req, size, ...pathPolys.slice(orig, orig + size));
        }

        // Store visited
        for (let i = 0; i < req; i++) {
            pathPolys[i] = visitedPolyRefs[visitedPolyRefs.length - (1 + i)];
        }

        return pathPolys;
    }

    // eslint-disable-next-line jsdoc/require-param
    /**
     *
     * This function checks if the path has a small U-turn, that is,
     * a polygon further in the path is adjacent to the first polygon
     * in the path. If that happens, a shortcut is taken.
     * This can happen if the target (T) location is at tile boundary,
     * and we're (S) approaching it parallel to the tile edge.
     * The choice at the vertex can be arbitrary,
     *  +---+---+
     *  |:::|:::|
     *  +-S-+-T-+
     *  |:::|   | <-- the step can end up in here, resulting U-turn path.
     *  +---+---+
     */
    private static _FixupShortcuts(pathPolys: number[], navMesh: NavMesh) {
        if (pathPolys.length < 3) {
            return;
        }

        // Get connected polygons
        const maxNeis = 16;
        let nneis = 0;
        const neis: number[] = [];

        const tileAndPoly = navMesh.getTileAndPolyByRef(pathPolys[0]);

        if (!tileAndPoly.success) {
            return;
        }

        const poly = tileAndPoly.poly;
        const tile = tileAndPoly.tile;
        for (let k = poly.firstLink(); k !== Detour.DT_NULL_LINK; k = tile.links(k).next()) {
            const link = tile.links(k);

            if (link.ref() !== 0) {
                if (nneis < maxNeis) {
                    neis.push(link.ref());
                    nneis++;
                }
            }
        }

        // If any of the neighbour polygons is within the next few polygons
        // in the path, short cut to that polygon directly.
        const maxLookAhead = 6;
        let cut = 0;
        for (let i = Math.min(maxLookAhead, pathPolys.length) - 1; i > 1 && cut === 0; i--) {
            for (let j = 0; j < nneis; j++) {
                if (pathPolys[i] === neis[j]) {
                    cut = i;
                    break;
                }
            }
        }

        if (cut > 1) {
            pathPolys.splice(1, cut - 1);
        }
    }

    /**
     * Create a new Crowd so you can add agents
     * @param maxAgents the maximum agent count in the crowd
     * @param maxAgentRadius the maximum radius an agent can have
     * @param scene to attach the crowd to
     * @returns the crowd you can add agents to
     */
    createCrowd(maxAgents: number, maxAgentRadius: number, scene: Scene): ICrowd {
        return new RecastJSCrowd(this, maxAgents, maxAgentRadius, scene);
    }

    /**
     * Set the Bounding box extent for doing spatial queries (getClosestPoint, getRandomPointAround, ...)
     * The queries will try to find a solution within those bounds
     * default is (1,1,1)
     * @param extent x,y,z value that define the extent around the queries point of reference
     */
    setDefaultQueryExtent(extent: IVector3Like): void {
        this.navMeshQuery.defaultQueryHalfExtents = extent;
    }

    /**
     * Get the Bounding box extent specified by setDefaultQueryExtent
     * @returns the box extent values
     */
    getDefaultQueryExtent(): Vector3 {
        return new Vector3(this.navMeshQuery.defaultQueryHalfExtents.x, this.navMeshQuery.defaultQueryHalfExtents.y, this.navMeshQuery.defaultQueryHalfExtents.z);
    }

    /**
     * Get the Bounding box extent result specified by setDefaultQueryExtent
     * @param result output the box extent values
     */
    getDefaultQueryExtentToRef(result: Vector3): void {
        result.set(this.navMeshQuery.defaultQueryHalfExtents.x, this.navMeshQuery.defaultQueryHalfExtents.y, this.navMeshQuery.defaultQueryHalfExtents.z);
    }

    /**
     * build the navmesh from a previously saved state using getNavmeshData
     * @param data the Uint8Array returned by getNavmeshData
     */
    buildFromNavmeshData(data: Uint8Array): void {
        const result = this.bjsRECAST.importNavMesh(data);
        this.navMesh = result.navMesh;
        this.navMeshQuery = new this.bjsRECAST.NavMeshQuery(this.navMesh);
    }

    /**
     * returns the navmesh data that can be used later. The navmesh must be built before retrieving the data
     * @returns data the Uint8Array that can be saved and reused
     */
    getNavmeshData(): Uint8Array {
        if (!this.navMesh) {
            throw new Error("There is no NavMesh generated.");
        }
        return this.bjsRECAST.exportNavMesh(this.navMesh);
    }

    /**
     * Disposes
     */
    public dispose() {
        // clea up recast stuff
        this.destroy();

        // clean up babylonjs stuff
        //
    }

    /**
     * Destroys recast related raw data
     */
    public destroy() {
        if (!this.navMesh) {
            return;
        }
        this.navMeshQuery.destroy();
        this.navMesh?.destroy();
        this.navMesh = undefined;
    }

    private _createTileCache(tileSize = 32) {
        if (!this._tileCache) {
            const { success, navMesh, tileCache } = this.bjsRECAST.generateTileCache(this._positions, this._indices, {
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
     * Updates the tile cache
     */
    public updateTileCache() {
        if (!this.navMesh || !this._tileCache) {
            return;
        }

        let upToDate;
        while (!upToDate) {
            const result = this._tileCache.update(this.navMesh);
            if (!result.success) {
                Logger.Error(["Unable to update tile cache.", result.status]);
                return;
            }
            upToDate = result.upToDate;
        }

        this.navMeshQuery = new this.bjsRECAST.NavMeshQuery(this.navMesh);
    }

    /**
     * Creates a cylinder obstacle and add it to the navigation
     * @param position world position
     * @param radius cylinder radius
     * @param height cylinder height
     * @returns the obstacle freshly created
     */
    addCylinderObstacle(position: IVector3Like, radius: number, height: number): IObstacle {
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
    addBoxObstacle(position: IVector3Like, extent: IVector3Like, angle: number): IObstacle {
        this._createTileCache();

        return this._tileCache?.addBoxObstacle(position, extent, angle) ?? (null as unknown as IObstacle);
    }

    /**
     * Removes an obstacle created by addCylinderObstacle or addBoxObstacle
     * @param obstacle obstacle to remove from the navigation
     */
    removeObstacle(obstacle: IObstacle): void {
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
        return this.bjsRECAST.getRandomSeed();
    }

    /**
     * Set the seed used for randomized functions like `getRandomPointAround`
     * @param seed number used as seed for random functions
     */
    public setRandomSeed(seed: number): void {
        this.bjsRECAST.setRandomSeed(seed);
    }
}

/**
 * Recast detour crowd implementation
 */
export class RecastJSCrowd implements ICrowd {
    /**
     * Recast/detour plugin
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public bjsRECASTPlugin: RecastJSPlugin;
    /**
     * Link to the detour crowd
     */
    public recastCrowd: Crowd;
    /**
     * One transform per agent
     */
    public transforms: TransformNode[] = new Array<TransformNode>();
    /**
     * All agents created
     */
    public agents: number[] = new Array<number>();
    /**
     * agents reach radius
     */
    public reachRadii: number[] = new Array<number>();
    /**
     * true when a destination is active for an agent and notifier hasn't been notified of reach
     */
    private _agentDestinationArmed: boolean[] = new Array<boolean>();
    /**
     * agent current target
     */
    private _agentDestination: Vector3[] = new Array<Vector3>();
    /**
     * Link to the scene is kept to unregister the crowd from the scene
     */
    private _scene: Scene;

    /**
     * Observer for crowd updates
     */
    private _onBeforeAnimationsObserver: Nullable<Observer<Scene>> = null;

    /**
     * Fires each time an agent is in reach radius of its destination
     */
    public onReachTargetObservable = new Observable<{
        agentIndex: number;
        destination: Vector3;
    }>();

    /**
     * Constructor
     * @param plugin recastJS plugin
     * @param maxAgents the maximum agent count in the crowd
     * @param maxAgentRadius the maximum radius an agent can have
     * @param scene to attach the crowd to
     * @returns the crowd you can add agents to
     */
    public constructor(plugin: RecastJSPlugin, maxAgents: number, maxAgentRadius: number, scene: Scene) {
        this.bjsRECASTPlugin = plugin;

        if (!plugin.navMesh) {
            throw new Error("There is no NavMesh generated.");
        }

        this.recastCrowd = new this.bjsRECASTPlugin.bjsRECAST.Crowd(plugin.navMesh, {
            maxAgents,
            maxAgentRadius,
        });

        this._scene = scene;

        this._onBeforeAnimationsObserver = scene.onBeforeAnimationsObservable.add(() => {
            this.update(scene.getEngine().getDeltaTime() * 0.001 * plugin.timeFactor);
        });
    }

    /**
     * Add a new agent to the crowd with the specified parameter a corresponding transformNode.
     * You can attach anything to that node. The node position is updated in the scene update tick.
     * @param pos world position that will be constrained by the navigation mesh
     * @param parameters agent parameters
     * @param transform hooked to the agent that will be update by the scene
     * @returns agent index
     */
    addAgent(pos: IVector3Like, parameters: IAgentParameters, transform: TransformNode): number {
        const agentParams: IAgentParameters = {
            radius: parameters.radius,
            height: parameters.height,
            maxAcceleration: parameters.maxAcceleration,
            maxSpeed: parameters.maxSpeed,
            collisionQueryRange: parameters.collisionQueryRange,
            pathOptimizationRange: parameters.pathOptimizationRange,
            separationWeight: parameters.separationWeight,
            reachRadius: parameters.reachRadius ? parameters.reachRadius : parameters.radius,

            // updateFlags : 7,
            // obstacleAvoidanceType : 0,
            // queryFilterType : 0,
            // userData : 0,
        };

        const agent = this.recastCrowd.addAgent({ x: pos.x, y: pos.y, z: pos.z }, agentParams);

        this.transforms.push(transform);
        this.agents.push(agent.agentIndex);
        this.reachRadii.push(parameters.reachRadius ? parameters.reachRadius : parameters.radius);
        this._agentDestinationArmed.push(false);
        this._agentDestination.push(new Vector3(0, 0, 0));

        return agent.agentIndex;
    }

    /**
     * Returns the agent position in world space
     * @param index agent index returned by addAgent
     * @returns world space position
     */
    getAgentPosition(index: number): Vector3 {
        const agentPos = this.recastCrowd.getAgent(index)?.position() ?? {
            x: 0,
            y: 0,
            z: 0,
        };
        return new Vector3(agentPos.x, agentPos.y, agentPos.z);
    }

    /**
     * Returns the agent position result in world space
     * @param index agent index returned by addAgent
     * @param result output world space position
     */
    getAgentPositionToRef(index: number, result: Vector3): void {
        const agentPos = this.recastCrowd.getAgent(index)?.position() ?? {
            x: 0,
            y: 0,
            z: 0,
        };
        result.set(agentPos.x, agentPos.y, agentPos.z);
    }

    /**
     * Returns the agent velocity in world space
     * @param index agent index returned by addAgent
     * @returns world space velocity
     */
    getAgentVelocity(index: number): Vector3 {
        const agentVel = this.recastCrowd.getAgent(index)?.velocity() ?? {
            x: 0,
            y: 0,
            z: 0,
        };
        return new Vector3(agentVel.x, agentVel.y, agentVel.z);
    }

    /**
     * Returns the agent velocity result in world space
     * @param index agent index returned by addAgent
     * @param result output world space velocity
     */
    getAgentVelocityToRef(index: number, result: Vector3): void {
        const agentVel = this.recastCrowd.getAgent(index)?.velocity() ?? {
            x: 0,
            y: 0,
            z: 0,
        };
        result.set(agentVel.x, agentVel.y, agentVel.z);
    }

    /**
     * Returns the agent next target point on the path
     * @param index agent index returned by addAgent
     * @returns world space position
     */
    getAgentNextTargetPath(index: number): Vector3 {
        const pathTargetPos = this.recastCrowd.getAgent(index)?.nextTargetInPath() ?? {
            x: 0,
            y: 0,
            z: 0,
        };
        return new Vector3(pathTargetPos.x, pathTargetPos.y, pathTargetPos.z);
    }

    /**
     * Returns the agent next target point on the path
     * @param index agent index returned by addAgent
     * @param result output world space position
     */
    getAgentNextTargetPathToRef(index: number, result: Vector3): void {
        const pathTargetPos = this.recastCrowd.getAgent(index)?.nextTargetInPath() ?? {
            x: 0,
            y: 0,
            z: 0,
        };
        result.set(pathTargetPos.x, pathTargetPos.y, pathTargetPos.z);
    }

    /**
     * Gets the agent state
     * @param index agent index returned by addAgent
     * @returns agent state
     */
    getAgentState(index: number): number {
        return this.recastCrowd.getAgent(index)?.state() ?? 0; // invalid
    }

    /**
     * returns true if the agent in over an off mesh link connection
     * @param index agent index returned by addAgent
     * @returns true if over an off mesh link connection
     */
    overOffmeshConnection(index: number): boolean {
        return this.recastCrowd.getAgent(index)?.overOffMeshConnection() ?? false;
    }

    /**
     * Asks a particular agent to go to a destination. That destination is constrained by the navigation mesh
     * @param index agent index returned by addAgent
     * @param destination targeted world position
     */
    agentGoto(index: number, destination: IVector3Like): void {
        this.recastCrowd.getAgent(index)?.requestMoveTarget(destination);

        // arm observer
        const item = this.agents.indexOf(index);
        if (item > -1) {
            this._agentDestinationArmed[item] = true;
            this._agentDestination[item].set(destination.x, destination.y, destination.z);
        }
    }

    /**
     * Teleport the agent to a new position
     * @param index agent index returned by addAgent
     * @param destination targeted world position
     */
    agentTeleport(index: number, destination: IVector3Like): void {
        this.recastCrowd.getAgent(index)?.teleport(destination);
    }

    /**
     * Update agent parameters
     * @param index agent index returned by addAgent
     * @param parameters agent parameters
     */
    updateAgentParameters(index: number, parameters: IAgentParameters): void {
        const agent = this.recastCrowd.getAgent(index);
        if (!agent) {
            return;
        }

        const agentParams = agent.parameters();

        if (!agentParams) {
            return;
        }

        if (parameters.radius !== undefined) {
            agentParams.radius = parameters.radius;
        }
        if (parameters.height !== undefined) {
            agentParams.height = parameters.height;
        }
        if (parameters.maxAcceleration !== undefined) {
            agentParams.maxAcceleration = parameters.maxAcceleration;
        }
        if (parameters.maxSpeed !== undefined) {
            agentParams.maxSpeed = parameters.maxSpeed;
        }
        if (parameters.collisionQueryRange !== undefined) {
            agentParams.collisionQueryRange = parameters.collisionQueryRange;
        }
        if (parameters.pathOptimizationRange !== undefined) {
            agentParams.pathOptimizationRange = parameters.pathOptimizationRange;
        }
        if (parameters.separationWeight !== undefined) {
            agentParams.separationWeight = parameters.separationWeight;
        }

        agent.updateParameters(agentParams);
    }

    /**
     * remove a particular agent previously created
     * @param index agent index returned by addAgent
     */
    removeAgent(index: number): void {
        this.recastCrowd.removeAgent(index);

        const item = this.agents.indexOf(index);
        if (item > -1) {
            this.agents.splice(item, 1);
            this.transforms.splice(item, 1);
            this.reachRadii.splice(item, 1);
            this._agentDestinationArmed.splice(item, 1);
            this._agentDestination.splice(item, 1);
        }
    }

    /**
     * get the list of all agents attached to this crowd
     * @returns list of agent indices
     */
    getAgents(): number[] {
        return this.agents;
    }

    /**
     * Tick update done by the Scene. Agent position/velocity/acceleration is updated by this function
     * @param deltaTime in seconds
     */
    update(deltaTime: number): void {
        // update obstacles
        this.recastCrowd.update(deltaTime);

        if (deltaTime <= Epsilon) {
            return;
        }

        // update crowd
        const timeStep = this.bjsRECASTPlugin.getTimeStep();
        const maxStepCount = this.bjsRECASTPlugin.getMaximumSubStepCount();
        if (timeStep <= Epsilon) {
            this.recastCrowd.update(deltaTime);
        } else {
            let iterationCount = Math.floor(deltaTime / timeStep);
            if (maxStepCount && iterationCount > maxStepCount) {
                iterationCount = maxStepCount;
            }
            if (iterationCount < 1) {
                iterationCount = 1;
            }

            const step = deltaTime / iterationCount;
            for (let i = 0; i < iterationCount; i++) {
                this.recastCrowd.update(step);
            }
        }

        // update transforms
        for (let index = 0; index < this.agents.length; index++) {
            // update transform position
            const agentIndex = this.agents[index];
            const agentPosition = this.getAgentPosition(agentIndex);
            this.transforms[index].position = agentPosition;
            // check agent reach destination
            if (this._agentDestinationArmed[index]) {
                const dx = agentPosition.x - this._agentDestination[index].x;
                const dz = agentPosition.z - this._agentDestination[index].z;
                const radius = this.reachRadii[index];
                const groundY = this._agentDestination[index].y - this.reachRadii[index];
                const ceilingY = this._agentDestination[index].y + this.reachRadii[index];
                const distanceXZSquared = dx * dx + dz * dz;
                if (agentPosition.y > groundY && agentPosition.y < ceilingY && distanceXZSquared < radius * radius) {
                    this._agentDestinationArmed[index] = false;
                    this.onReachTargetObservable.notifyObservers({
                        agentIndex: agentIndex,
                        destination: this._agentDestination[index],
                    });
                }
            }
        }
    }

    /**
     * Set the Bounding box extent for doing spatial queries (getClosestPoint, getRandomPointAround, ...)
     * The queries will try to find a solution within those bounds
     * default is (1,1,1)
     * @param extent x,y,z value that define the extent around the queries point of reference
     */
    setDefaultQueryExtent(extent: IVector3Like): void {
        const ext = new this.bjsRECASTPlugin.bjsRECAST.vec3(extent.x, extent.y, extent.z);
        this.bjsRECASTPlugin.setDefaultQueryExtent(ext);
    }

    /**
     * Get the Bounding box extent specified by setDefaultQueryExtent
     * @returns the box extent values
     */
    getDefaultQueryExtent(): Vector3 {
        const p = this.bjsRECASTPlugin.getDefaultQueryExtent();
        return new Vector3(p.x, p.y, p.z);
    }

    /**
     * Get the Bounding box extent result specified by setDefaultQueryExtent
     * @param result output the box extent values
     */
    getDefaultQueryExtentToRef(result: Vector3): void {
        const p = this.bjsRECASTPlugin.getDefaultQueryExtent();
        result.set(p.x, p.y, p.z);
    }

    /**
     * Get the next corner points composing the path (max 4 points)
     * @param index agent index returned by addAgent
     * @returns array containing world position composing the path
     */
    getCorners(index: number): Vector3[] {
        const corners = this.recastCrowd.getAgent(index)?.corners();
        if (!corners) {
            return [];
        }

        const positions = [];
        for (let i = 0; i < corners.length; i++) {
            positions.push(new Vector3(corners[i].x, corners[i].y, corners[i].z));
        }
        return positions;
    }

    /**
     * Release all resources
     */
    dispose(): void {
        this.recastCrowd.destroy();

        if (this._onBeforeAnimationsObserver) {
            this._scene.onBeforeAnimationsObservable.remove(this._onBeforeAnimationsObserver);
            this._onBeforeAnimationsObserver = null;
        }

        this.onReachTargetObservable.clear();
    }
}

// import type { INavigationEnginePlugin, ICrowd, IAgentParameters, INavMeshParameters, IObstacle } from "../../Navigation/INavigationEngine";
// import { Logger } from "../../Misc/logger";
// import { VertexData } from "../../Meshes/mesh.vertexData";
// import { Mesh } from "../../Meshes/mesh";
// import type { Scene } from "../../scene";
// import { Epsilon, Vector3, Matrix } from "../../Maths/math";
// import type { TransformNode } from "../../Meshes/transformNode";
// import type { Observer } from "../../Misc/observable";
// import { Observable } from "../../Misc/observable";
// import type { Nullable } from "../../types";
// import { VertexBuffer } from "../../Buffers/buffer";

// // eslint-disable-next-line @typescript-eslint/naming-convention
// declare let Recast: any;

// /**
//  * RecastJS navigation plugin
//  */
// export class RecastJSPlugin implements INavigationEnginePlugin {
//     /**
//      * Reference to the Recast library
//      */
//     public bjsRECAST: any = {};

//     /**
//      * plugin name
//      */
//     public name: string = "RecastJSPlugin";

//     /**
//      * the first navmesh created. We might extend this to support multiple navmeshes
//      */
//     public navMesh: any;

//     private _maximumSubStepCount: number = 10;
//     private _timeStep: number = 1 / 60;
//     private _timeFactor: number = 1;

//     private _tempVec1: any;
//     private _tempVec2: any;

//     private _worker: Nullable<Worker> = null;

//     /**
//      * Initializes the recastJS plugin
//      * @param recastInjection can be used to inject your own recast reference
//      */
//     public constructor(recastInjection: any = Recast) {
//         if (typeof recastInjection === "function") {
//             Logger.Error("RecastJS is not ready. Please make sure you await Recast() before using the plugin.");
//         } else {
//             this.bjsRECAST = recastInjection;
//         }

//         if (!this.isSupported()) {
//             Logger.Error("RecastJS is not available. Please make sure you included the js file.");
//             return;
//         }
//         this.setTimeStep();

//         this._tempVec1 = new this.bjsRECAST.Vec3();
//         this._tempVec2 = new this.bjsRECAST.Vec3();
//     }

//     /**
//      * Set worker URL to be used when generating a new navmesh
//      * @param workerURL url string
//      * @returns boolean indicating if worker is created
//      */
//     public setWorkerURL(workerURL: string | URL): boolean {
//         if (window && window.Worker) {
//             this._worker = new Worker(workerURL);
//             return true;
//         }
//         return false;
//     }

//     /**
//      * Set the time step of the navigation tick update.
//      * Default is 1/60.
//      * A value of 0 will disable fixed time update
//      * @param newTimeStep the new timestep to apply to this world.
//      */
//     setTimeStep(newTimeStep: number = 1 / 60): void {
//         this._timeStep = newTimeStep;
//     }

//     /**
//      * Get the time step of the navigation tick update.
//      * @returns the current time step
//      */
//     getTimeStep(): number {
//         return this._timeStep;
//     }

//     /**
//      * If delta time in navigation tick update is greater than the time step
//      * a number of sub iterations are done. If more iterations are need to reach deltatime
//      * they will be discarded.
//      * A value of 0 will set to no maximum and update will use as many substeps as needed
//      * @param newStepCount the maximum number of iterations
//      */
//     setMaximumSubStepCount(newStepCount: number = 10): void {
//         this._maximumSubStepCount = newStepCount;
//     }

//     /**
//      * Get the maximum number of iterations per navigation tick update
//      * @returns the maximum number of iterations
//      */
//     getMaximumSubStepCount(): number {
//         return this._maximumSubStepCount;
//     }

//     /**
//      * Time factor applied when updating crowd agents (default 1). A value of 0 will pause crowd updates.
//      * @param value the time factor applied at update
//      */
//     public set timeFactor(value: number) {
//         this._timeFactor = Math.max(value, 0);
//     }

//     /**
//      * Get the time factor used for crowd agent update
//      * @returns the time factor
//      */
//     public get timeFactor(): number {
//         return this._timeFactor;
//     }

//     /**
//      * Creates a navigation mesh
//      * @param meshes array of all the geometry used to compute the navigation mesh
//      * @param parameters bunch of parameters used to filter geometry
//      * @param completion callback when data is available from the worker. Not used without a worker
//      */
//     createNavMesh(meshes: Array<Mesh>, parameters: INavMeshParameters, completion?: (navmeshData: Uint8Array) => void): void {
//         if (this._worker && !completion) {
//             Logger.Warn("A worker is avaible but no completion callback. Defaulting to blocking navmesh creation");
//         } else if (!this._worker && completion) {
//             Logger.Warn("A completion callback is avaible but no worker. Defaulting to blocking navmesh creation");
//         }

//         this.navMesh = new this.bjsRECAST.NavMesh();

//         let index: number;
//         let tri: number;
//         let pt: number;

//         const indices = [];
//         const positions = [];
//         let offset = 0;
//         for (index = 0; index < meshes.length; index++) {
//             if (meshes[index]) {
//                 const mesh = meshes[index];

//                 const meshIndices = mesh.getIndices();
//                 if (!meshIndices) {
//                     continue;
//                 }
//                 const meshPositions = mesh.getVerticesData(VertexBuffer.PositionKind, false, false);
//                 if (!meshPositions) {
//                     continue;
//                 }

//                 const worldMatrices = [];
//                 const worldMatrix = mesh.computeWorldMatrix(true);

//                 if (mesh.hasThinInstances) {
//                     const thinMatrices = (mesh as Mesh).thinInstanceGetWorldMatrices();
//                     for (let instanceIndex = 0; instanceIndex < thinMatrices.length; instanceIndex++) {
//                         const tmpMatrix = new Matrix();
//                         const thinMatrix = thinMatrices[instanceIndex];
//                         thinMatrix.multiplyToRef(worldMatrix, tmpMatrix);
//                         worldMatrices.push(tmpMatrix);
//                     }
//                 } else {
//                     worldMatrices.push(worldMatrix);
//                 }

//                 for (let matrixIndex = 0; matrixIndex < worldMatrices.length; matrixIndex++) {
//                     const wm = worldMatrices[matrixIndex];
//                     for (tri = 0; tri < meshIndices.length; tri++) {
//                         indices.push(meshIndices[tri] + offset);
//                     }

//                     const transformed = Vector3.Zero();
//                     const position = Vector3.Zero();
//                     for (pt = 0; pt < meshPositions.length; pt += 3) {
//                         Vector3.FromArrayToRef(meshPositions, pt, position);
//                         Vector3.TransformCoordinatesToRef(position, wm, transformed);
//                         positions.push(transformed.x, transformed.y, transformed.z);
//                     }

//                     offset += meshPositions.length / 3;
//                 }
//             }
//         }

//         if (this._worker && completion) {
//             // spawn worker and send message
//             this._worker.postMessage([positions, offset, indices, indices.length, parameters]);
//             this._worker.onmessage = function (e) {
//                 completion(e.data);
//             };
//         } else {
//             // blocking calls
//             const rc = new this.bjsRECAST.rcConfig();
//             rc.cs = parameters.cs;
//             rc.ch = parameters.ch;
//             rc.borderSize = parameters.borderSize ? parameters.borderSize : 0;
//             rc.tileSize = parameters.tileSize ? parameters.tileSize : 0;
//             rc.walkableSlopeAngle = parameters.walkableSlopeAngle;
//             rc.walkableHeight = parameters.walkableHeight;
//             rc.walkableClimb = parameters.walkableClimb;
//             rc.walkableRadius = parameters.walkableRadius;
//             rc.maxEdgeLen = parameters.maxEdgeLen;
//             rc.maxSimplificationError = parameters.maxSimplificationError;
//             rc.minRegionArea = parameters.minRegionArea;
//             rc.mergeRegionArea = parameters.mergeRegionArea;
//             rc.maxVertsPerPoly = parameters.maxVertsPerPoly;
//             rc.detailSampleDist = parameters.detailSampleDist;
//             rc.detailSampleMaxError = parameters.detailSampleMaxError;

//             this.navMesh.build(positions, offset, indices, indices.length, rc);
//         }
//     }

//     /**
//      * Create a navigation mesh debug mesh
//      * @param scene is where the mesh will be added
//      * @returns debug display mesh
//      */
//     createDebugNavMesh(scene: Scene): Mesh {
//         let tri: number;
//         let pt: number;
//         const debugNavMesh = this.navMesh.getDebugNavMesh();
//         const triangleCount = debugNavMesh.getTriangleCount();

//         const indices = [];
//         const positions = [];
//         for (tri = 0; tri < triangleCount * 3; tri++) {
//             indices.push(tri);
//         }
//         for (tri = 0; tri < triangleCount; tri++) {
//             for (pt = 0; pt < 3; pt++) {
//                 const point = debugNavMesh.getTriangle(tri).getPoint(pt);
//                 positions.push(point.x, point.y, point.z);
//             }
//         }

//         const mesh = new Mesh("NavMeshDebug", scene);
//         const vertexData = new VertexData();

//         vertexData.indices = indices;
//         vertexData.positions = positions;
//         vertexData.applyToMesh(mesh, false);
//         return mesh;
//     }

//     /**
//      * Get a navigation mesh constrained position, closest to the parameter position
//      * @param position world position
//      * @returns the closest point to position constrained by the navigation mesh
//      */
//     getClosestPoint(position: Vector3): Vector3 {
//         this._tempVec1.x = position.x;
//         this._tempVec1.y = position.y;
//         this._tempVec1.z = position.z;
//         const ret = this.navMesh.getClosestPoint(this._tempVec1);
//         const pr = new Vector3(ret.x, ret.y, ret.z);
//         return pr;
//     }

//     /**
//      * Get a navigation mesh constrained position, closest to the parameter position
//      * @param position world position
//      * @param result output the closest point to position constrained by the navigation mesh
//      */
//     getClosestPointToRef(position: Vector3, result: Vector3): void {
//         this._tempVec1.x = position.x;
//         this._tempVec1.y = position.y;
//         this._tempVec1.z = position.z;
//         const ret = this.navMesh.getClosestPoint(this._tempVec1);
//         result.set(ret.x, ret.y, ret.z);
//     }

//     /**
//      * Get a navigation mesh constrained position, within a particular radius
//      * @param position world position
//      * @param maxRadius the maximum distance to the constrained world position
//      * @returns the closest point to position constrained by the navigation mesh
//      */
//     getRandomPointAround(position: Vector3, maxRadius: number): Vector3 {
//         this._tempVec1.x = position.x;
//         this._tempVec1.y = position.y;
//         this._tempVec1.z = position.z;
//         const ret = this.navMesh.getRandomPointAround(this._tempVec1, maxRadius);
//         const pr = new Vector3(ret.x, ret.y, ret.z);
//         return pr;
//     }

//     /**
//      * Get a navigation mesh constrained position, within a particular radius
//      * @param position world position
//      * @param maxRadius the maximum distance to the constrained world position
//      * @param result output the closest point to position constrained by the navigation mesh
//      */
//     getRandomPointAroundToRef(position: Vector3, maxRadius: number, result: Vector3): void {
//         this._tempVec1.x = position.x;
//         this._tempVec1.y = position.y;
//         this._tempVec1.z = position.z;
//         const ret = this.navMesh.getRandomPointAround(this._tempVec1, maxRadius);
//         result.set(ret.x, ret.y, ret.z);
//     }

//     /**
//      * Compute the final position from a segment made of destination-position
//      * @param position world position
//      * @param destination world position
//      * @returns the resulting point along the navmesh
//      */
//     moveAlong(position: Vector3, destination: Vector3): Vector3 {
//         this._tempVec1.x = position.x;
//         this._tempVec1.y = position.y;
//         this._tempVec1.z = position.z;
//         this._tempVec2.x = destination.x;
//         this._tempVec2.y = destination.y;
//         this._tempVec2.z = destination.z;
//         const ret = this.navMesh.moveAlong(this._tempVec1, this._tempVec2);
//         const pr = new Vector3(ret.x, ret.y, ret.z);
//         return pr;
//     }

//     /**
//      * Compute the final position from a segment made of destination-position
//      * @param position world position
//      * @param destination world position
//      * @param result output the resulting point along the navmesh
//      */
//     moveAlongToRef(position: Vector3, destination: Vector3, result: Vector3): void {
//         this._tempVec1.x = position.x;
//         this._tempVec1.y = position.y;
//         this._tempVec1.z = position.z;
//         this._tempVec2.x = destination.x;
//         this._tempVec2.y = destination.y;
//         this._tempVec2.z = destination.z;
//         const ret = this.navMesh.moveAlong(this._tempVec1, this._tempVec2);
//         result.set(ret.x, ret.y, ret.z);
//     }

//     private _convertNavPathPoints(navPath: any): Vector3[] {
//         let pt: number;
//         const pointCount = navPath.getPointCount();
//         const positions = [];
//         for (pt = 0; pt < pointCount; pt++) {
//             const p = navPath.getPoint(pt);
//             positions.push(new Vector3(p.x, p.y, p.z));
//         }
//         return positions;
//     }

//     /**
//      * Compute a navigation path from start to end. Returns an empty array if no path can be computed
//      * Path is straight.
//      * @param start world position
//      * @param end world position
//      * @returns array containing world position composing the path
//      */
//     computePath(start: Vector3, end: Vector3): Vector3[] {
//         this._tempVec1.x = start.x;
//         this._tempVec1.y = start.y;
//         this._tempVec1.z = start.z;
//         this._tempVec2.x = end.x;
//         this._tempVec2.y = end.y;
//         this._tempVec2.z = end.z;
//         const navPath = this.navMesh.computePath(this._tempVec1, this._tempVec2);
//         return this._convertNavPathPoints(navPath);
//     }

//     /**
//      * Compute a navigation path from start to end. Returns an empty array if no path can be computed.
//      * Path follows navigation mesh geometry.
//      * @param start world position
//      * @param end world position
//      * @returns array containing world position composing the path
//      */
//     computePathSmooth(start: Vector3, end: Vector3): Vector3[] {
//         this._tempVec1.x = start.x;
//         this._tempVec1.y = start.y;
//         this._tempVec1.z = start.z;
//         this._tempVec2.x = end.x;
//         this._tempVec2.y = end.y;
//         this._tempVec2.z = end.z;
//         const navPath = this.navMesh.computePathSmooth(this._tempVec1, this._tempVec2);
//         return this._convertNavPathPoints(navPath);
//     }
//     /**
//      * Create a new Crowd so you can add agents
//      * @param maxAgents the maximum agent count in the crowd
//      * @param maxAgentRadius the maximum radius an agent can have
//      * @param scene to attach the crowd to
//      * @returns the crowd you can add agents to
//      */
//     createCrowd(maxAgents: number, maxAgentRadius: number, scene: Scene): ICrowd {
//         const crowd = new RecastJSCrowd(this, maxAgents, maxAgentRadius, scene);
//         return crowd;
//     }

//     /**
//      * Set the Bounding box extent for doing spatial queries (getClosestPoint, getRandomPointAround, ...)
//      * The queries will try to find a solution within those bounds
//      * default is (1,1,1)
//      * @param extent x,y,z value that define the extent around the queries point of reference
//      */
//     setDefaultQueryExtent(extent: Vector3): void {
//         this._tempVec1.x = extent.x;
//         this._tempVec1.y = extent.y;
//         this._tempVec1.z = extent.z;
//         this.navMesh.setDefaultQueryExtent(this._tempVec1);
//     }

//     /**
//      * Get the Bounding box extent specified by setDefaultQueryExtent
//      * @returns the box extent values
//      */
//     getDefaultQueryExtent(): Vector3 {
//         const p = this.navMesh.getDefaultQueryExtent();
//         return new Vector3(p.x, p.y, p.z);
//     }

//     /**
//      * build the navmesh from a previously saved state using getNavmeshData
//      * @param data the Uint8Array returned by getNavmeshData
//      */
//     buildFromNavmeshData(data: Uint8Array): void {
//         const nDataBytes = data.length * data.BYTES_PER_ELEMENT;
//         const dataPtr = this.bjsRECAST._malloc(nDataBytes);

//         const dataHeap = new Uint8Array(this.bjsRECAST.HEAPU8.buffer, dataPtr, nDataBytes);
//         dataHeap.set(data);

//         const buf = new this.bjsRECAST.NavmeshData();
//         buf.dataPointer = dataHeap.byteOffset;
//         buf.size = data.length;
//         this.navMesh = new this.bjsRECAST.NavMesh();
//         this.navMesh.buildFromNavmeshData(buf);

//         // Free memory
//         this.bjsRECAST._free(dataHeap.byteOffset);
//     }

//     /**
//      * returns the navmesh data that can be used later. The navmesh must be built before retrieving the data
//      * @returns data the Uint8Array that can be saved and reused
//      */
//     getNavmeshData(): Uint8Array {
//         const navmeshData = this.navMesh.getNavmeshData();
//         const arrView = new Uint8Array(this.bjsRECAST.HEAPU8.buffer, navmeshData.dataPointer, navmeshData.size);
//         const ret = new Uint8Array(navmeshData.size);
//         ret.set(arrView);
//         this.navMesh.freeNavmeshData(navmeshData);
//         return ret;
//     }

//     /**
//      * Get the Bounding box extent result specified by setDefaultQueryExtent
//      * @param result output the box extent values
//      */
//     getDefaultQueryExtentToRef(result: Vector3): void {
//         const p = this.navMesh.getDefaultQueryExtent();
//         result.set(p.x, p.y, p.z);
//     }

//     /**
//      * Disposes
//      */
//     public dispose() {}

//     /**
//      * Creates a cylinder obstacle and add it to the navigation
//      * @param position world position
//      * @param radius cylinder radius
//      * @param height cylinder height
//      * @returns the obstacle freshly created
//      */
//     addCylinderObstacle(position: Vector3, radius: number, height: number): IObstacle {
//         this._tempVec1.x = position.x;
//         this._tempVec1.y = position.y;
//         this._tempVec1.z = position.z;
//         return this.navMesh.addCylinderObstacle(this._tempVec1, radius, height);
//     }

//     /**
//      * Creates an oriented box obstacle and add it to the navigation
//      * @param position world position
//      * @param extent box size
//      * @param angle angle in radians of the box orientation on Y axis
//      * @returns the obstacle freshly created
//      */
//     addBoxObstacle(position: Vector3, extent: Vector3, angle: number): IObstacle {
//         this._tempVec1.x = position.x;
//         this._tempVec1.y = position.y;
//         this._tempVec1.z = position.z;
//         this._tempVec2.x = extent.x;
//         this._tempVec2.y = extent.y;
//         this._tempVec2.z = extent.z;
//         return this.navMesh.addBoxObstacle(this._tempVec1, this._tempVec2, angle);
//     }

//     /**
//      * Removes an obstacle created by addCylinderObstacle or addBoxObstacle
//      * @param obstacle obstacle to remove from the navigation
//      */
//     removeObstacle(obstacle: IObstacle): void {
//         this.navMesh.removeObstacle(obstacle);
//     }

//     /**
//      * If this plugin is supported
//      * @returns true if plugin is supported
//      */
//     public isSupported(): boolean {
//         return this.bjsRECAST !== undefined;
//     }

//     /**
//      * Returns the seed used for randomized functions like `getRandomPointAround`
//      * @returns seed number
//      */
//     public getRandomSeed(): number {
//         return this.bjsRECAST._getRandomSeed();
//     }

//     /**
//      * Set the seed used for randomized functions like `getRandomPointAround`
//      * @param seed number used as seed for random functions
//      */
//     public setRandomSeed(seed: number): void {
//         this.bjsRECAST._setRandomSeed(seed);
//     }
// }

// /**
//  * Recast detour crowd implementation
//  */
// export class RecastJSCrowd implements ICrowd {
//     /**
//      * Recast/detour plugin
//      */
//     public bjsRECASTPlugin: RecastJSPlugin;
//     /**
//      * Link to the detour crowd
//      */
//     public recastCrowd: any = {};
//     /**
//      * One transform per agent
//      */
//     public transforms: TransformNode[] = new Array<TransformNode>();
//     /**
//      * All agents created
//      */
//     public agents: number[] = new Array<number>();
//     /**
//      * agents reach radius
//      */
//     public reachRadii: number[] = new Array<number>();
//     /**
//      * true when a destination is active for an agent and notifier hasn't been notified of reach
//      */
//     private _agentDestinationArmed: boolean[] = new Array<boolean>();
//     /**
//      * agent current target
//      */
//     private _agentDestination: Vector3[] = new Array<Vector3>();
//     /**
//      * Link to the scene is kept to unregister the crowd from the scene
//      */
//     private _scene: Scene;

//     /**
//      * Observer for crowd updates
//      */
//     private _onBeforeAnimationsObserver: Nullable<Observer<Scene>> = null;

//     /**
//      * Fires each time an agent is in reach radius of its destination
//      */
//     public onReachTargetObservable = new Observable<{ agentIndex: number; destination: Vector3 }>();

//     /**
//      * Constructor
//      * @param plugin recastJS plugin
//      * @param maxAgents the maximum agent count in the crowd
//      * @param maxAgentRadius the maximum radius an agent can have
//      * @param scene to attach the crowd to
//      * @returns the crowd you can add agents to
//      */
//     public constructor(plugin: RecastJSPlugin, maxAgents: number, maxAgentRadius: number, scene: Scene) {
//         this.bjsRECASTPlugin = plugin;
//         this.recastCrowd = new this.bjsRECASTPlugin.bjsRECAST.Crowd(maxAgents, maxAgentRadius, this.bjsRECASTPlugin.navMesh.getNavMesh());
//         this._scene = scene;

//         this._onBeforeAnimationsObserver = scene.onBeforeAnimationsObservable.add(() => {
//             this.update(scene.getEngine().getDeltaTime() * 0.001 * plugin.timeFactor);
//         });
//     }

//     /**
//      * Add a new agent to the crowd with the specified parameter a corresponding transformNode.
//      * You can attach anything to that node. The node position is updated in the scene update tick.
//      * @param pos world position that will be constrained by the navigation mesh
//      * @param parameters agent parameters
//      * @param transform hooked to the agent that will be update by the scene
//      * @returns agent index
//      */
//     addAgent(pos: Vector3, parameters: IAgentParameters, transform: TransformNode): number {
//         const agentParams = new this.bjsRECASTPlugin.bjsRECAST.dtCrowdAgentParams();
//         agentParams.radius = parameters.radius;
//         agentParams.height = parameters.height;
//         agentParams.maxAcceleration = parameters.maxAcceleration;
//         agentParams.maxSpeed = parameters.maxSpeed;
//         agentParams.collisionQueryRange = parameters.collisionQueryRange;
//         agentParams.pathOptimizationRange = parameters.pathOptimizationRange;
//         agentParams.separationWeight = parameters.separationWeight;
//         agentParams.updateFlags = 7;
//         agentParams.obstacleAvoidanceType = 0;
//         agentParams.queryFilterType = 0;
//         agentParams.userData = 0;

//         const agentIndex = this.recastCrowd.addAgent(new this.bjsRECASTPlugin.bjsRECAST.Vec3(pos.x, pos.y, pos.z), agentParams);
//         this.transforms.push(transform);
//         this.agents.push(agentIndex);
//         this.reachRadii.push(parameters.reachRadius ? parameters.reachRadius : parameters.radius);
//         this._agentDestinationArmed.push(false);
//         this._agentDestination.push(new Vector3(0, 0, 0));
//         return agentIndex;
//     }

//     /**
//      * Returns the agent position in world space
//      * @param index agent index returned by addAgent
//      * @returns world space position
//      */
//     getAgentPosition(index: number): Vector3 {
//         const agentPos = this.recastCrowd.getAgentPosition(index);
//         return new Vector3(agentPos.x, agentPos.y, agentPos.z);
//     }

//     /**
//      * Returns the agent position result in world space
//      * @param index agent index returned by addAgent
//      * @param result output world space position
//      */
//     getAgentPositionToRef(index: number, result: Vector3): void {
//         const agentPos = this.recastCrowd.getAgentPosition(index);
//         result.set(agentPos.x, agentPos.y, agentPos.z);
//     }

//     /**
//      * Returns the agent velocity in world space
//      * @param index agent index returned by addAgent
//      * @returns world space velocity
//      */
//     getAgentVelocity(index: number): Vector3 {
//         const agentVel = this.recastCrowd.getAgentVelocity(index);
//         return new Vector3(agentVel.x, agentVel.y, agentVel.z);
//     }

//     /**
//      * Returns the agent velocity result in world space
//      * @param index agent index returned by addAgent
//      * @param result output world space velocity
//      */
//     getAgentVelocityToRef(index: number, result: Vector3): void {
//         const agentVel = this.recastCrowd.getAgentVelocity(index);
//         result.set(agentVel.x, agentVel.y, agentVel.z);
//     }

//     /**
//      * Returns the agent next target point on the path
//      * @param index agent index returned by addAgent
//      * @returns world space position
//      */
//     getAgentNextTargetPath(index: number): Vector3 {
//         const pathTargetPos = this.recastCrowd.getAgentNextTargetPath(index);
//         return new Vector3(pathTargetPos.x, pathTargetPos.y, pathTargetPos.z);
//     }

//     /**
//      * Returns the agent next target point on the path
//      * @param index agent index returned by addAgent
//      * @param result output world space position
//      */
//     getAgentNextTargetPathToRef(index: number, result: Vector3): void {
//         const pathTargetPos = this.recastCrowd.getAgentNextTargetPath(index);
//         result.set(pathTargetPos.x, pathTargetPos.y, pathTargetPos.z);
//     }

//     /**
//      * Gets the agent state
//      * @param index agent index returned by addAgent
//      * @returns agent state
//      */
//     getAgentState(index: number): number {
//         return this.recastCrowd.getAgentState(index);
//     }

//     /**
//      * returns true if the agent in over an off mesh link connection
//      * @param index agent index returned by addAgent
//      * @returns true if over an off mesh link connection
//      */
//     overOffmeshConnection(index: number): boolean {
//         return this.recastCrowd.overOffmeshConnection(index);
//     }

//     /**
//      * Asks a particular agent to go to a destination. That destination is constrained by the navigation mesh
//      * @param index agent index returned by addAgent
//      * @param destination targeted world position
//      */
//     agentGoto(index: number, destination: Vector3): void {
//         this.recastCrowd.agentGoto(index, new this.bjsRECASTPlugin.bjsRECAST.Vec3(destination.x, destination.y, destination.z));

//         // arm observer
//         const item = this.agents.indexOf(index);
//         if (item > -1) {
//             this._agentDestinationArmed[item] = true;
//             this._agentDestination[item].set(destination.x, destination.y, destination.z);
//         }
//     }

//     /**
//      * Teleport the agent to a new position
//      * @param index agent index returned by addAgent
//      * @param destination targeted world position
//      */
//     agentTeleport(index: number, destination: Vector3): void {
//         this.recastCrowd.agentTeleport(index, new this.bjsRECASTPlugin.bjsRECAST.Vec3(destination.x, destination.y, destination.z));
//     }

//     /**
//      * Update agent parameters
//      * @param index agent index returned by addAgent
//      * @param parameters agent parameters
//      */
//     updateAgentParameters(index: number, parameters: IAgentParameters): void {
//         const agentParams = this.recastCrowd.getAgentParameters(index);

//         if (parameters.radius !== undefined) {
//             agentParams.radius = parameters.radius;
//         }
//         if (parameters.height !== undefined) {
//             agentParams.height = parameters.height;
//         }
//         if (parameters.maxAcceleration !== undefined) {
//             agentParams.maxAcceleration = parameters.maxAcceleration;
//         }
//         if (parameters.maxSpeed !== undefined) {
//             agentParams.maxSpeed = parameters.maxSpeed;
//         }
//         if (parameters.collisionQueryRange !== undefined) {
//             agentParams.collisionQueryRange = parameters.collisionQueryRange;
//         }
//         if (parameters.pathOptimizationRange !== undefined) {
//             agentParams.pathOptimizationRange = parameters.pathOptimizationRange;
//         }
//         if (parameters.separationWeight !== undefined) {
//             agentParams.separationWeight = parameters.separationWeight;
//         }

//         this.recastCrowd.setAgentParameters(index, agentParams);
//     }

//     /**
//      * remove a particular agent previously created
//      * @param index agent index returned by addAgent
//      */
//     removeAgent(index: number): void {
//         this.recastCrowd.removeAgent(index);

//         const item = this.agents.indexOf(index);
//         if (item > -1) {
//             this.agents.splice(item, 1);
//             this.transforms.splice(item, 1);
//             this.reachRadii.splice(item, 1);
//             this._agentDestinationArmed.splice(item, 1);
//             this._agentDestination.splice(item, 1);
//         }
//     }

//     /**
//      * get the list of all agents attached to this crowd
//      * @returns list of agent indices
//      */
//     getAgents(): number[] {
//         return this.agents;
//     }

//     /**
//      * Tick update done by the Scene. Agent position/velocity/acceleration is updated by this function
//      * @param deltaTime in seconds
//      */
//     update(deltaTime: number): void {
//         // update obstacles
//         this.bjsRECASTPlugin.navMesh.update();

//         if (deltaTime <= Epsilon) {
//             return;
//         }
//         // update crowd
//         const timeStep = this.bjsRECASTPlugin.getTimeStep();
//         const maxStepCount = this.bjsRECASTPlugin.getMaximumSubStepCount();
//         if (timeStep <= Epsilon) {
//             this.recastCrowd.update(deltaTime);
//         } else {
//             let iterationCount = Math.floor(deltaTime / timeStep);
//             if (maxStepCount && iterationCount > maxStepCount) {
//                 iterationCount = maxStepCount;
//             }
//             if (iterationCount < 1) {
//                 iterationCount = 1;
//             }

//             const step = deltaTime / iterationCount;
//             for (let i = 0; i < iterationCount; i++) {
//                 this.recastCrowd.update(step);
//             }
//         }

//         // update transforms
//         for (let index = 0; index < this.agents.length; index++) {
//             // update transform position
//             const agentIndex = this.agents[index];
//             const agentPosition = this.getAgentPosition(agentIndex);
//             this.transforms[index].position = agentPosition;
//             // check agent reach destination
//             if (this._agentDestinationArmed[index]) {
//                 const dx = agentPosition.x - this._agentDestination[index].x;
//                 const dz = agentPosition.z - this._agentDestination[index].z;
//                 const radius = this.reachRadii[index];
//                 const groundY = this._agentDestination[index].y - this.reachRadii[index];
//                 const ceilingY = this._agentDestination[index].y + this.reachRadii[index];
//                 const distanceXZSquared = dx * dx + dz * dz;
//                 if (agentPosition.y > groundY && agentPosition.y < ceilingY && distanceXZSquared < radius * radius) {
//                     this._agentDestinationArmed[index] = false;
//                     this.onReachTargetObservable.notifyObservers({ agentIndex: agentIndex, destination: this._agentDestination[index] });
//                 }
//             }
//         }
//     }

//     /**
//      * Set the Bounding box extent for doing spatial queries (getClosestPoint, getRandomPointAround, ...)
//      * The queries will try to find a solution within those bounds
//      * default is (1,1,1)
//      * @param extent x,y,z value that define the extent around the queries point of reference
//      */
//     setDefaultQueryExtent(extent: Vector3): void {
//         const ext = new this.bjsRECASTPlugin.bjsRECAST.Vec3(extent.x, extent.y, extent.z);
//         this.recastCrowd.setDefaultQueryExtent(ext);
//     }

//     /**
//      * Get the Bounding box extent specified by setDefaultQueryExtent
//      * @returns the box extent values
//      */
//     getDefaultQueryExtent(): Vector3 {
//         const p = this.recastCrowd.getDefaultQueryExtent();
//         return new Vector3(p.x, p.y, p.z);
//     }

//     /**
//      * Get the Bounding box extent result specified by setDefaultQueryExtent
//      * @param result output the box extent values
//      */
//     getDefaultQueryExtentToRef(result: Vector3): void {
//         const p = this.recastCrowd.getDefaultQueryExtent();
//         result.set(p.x, p.y, p.z);
//     }

//     /**
//      * Get the next corner points composing the path (max 4 points)
//      * @param index agent index returned by addAgent
//      * @returns array containing world position composing the path
//      */
//     getCorners(index: number): Vector3[] {
//         let pt: number;
//         const navPath = this.recastCrowd.getCorners(index);
//         const pointCount = navPath.getPointCount();
//         const positions = [];
//         for (pt = 0; pt < pointCount; pt++) {
//             const p = navPath.getPoint(pt);
//             positions.push(new Vector3(p.x, p.y, p.z));
//         }
//         return positions;
//     }

//     /**
//      * Release all resources
//      */
//     dispose(): void {
//         this.recastCrowd.destroy();
//         this._scene.onBeforeAnimationsObservable.remove(this._onBeforeAnimationsObserver);
//         this._onBeforeAnimationsObserver = null;
//         this.onReachTargetObservable.clear();
//     }
// }
