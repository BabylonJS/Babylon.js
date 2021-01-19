import { TransformNode } from "../Meshes/transformNode";
import { Vector3 } from "../Maths/math";
import { Mesh } from "../Meshes/mesh";
import { Scene } from "../scene";

/**
 * Navigation plugin interface to add navigation constrained by a navigation mesh
 */
export interface INavigationEnginePlugin {
    /**
     * plugin name
     */
    name: string;

    /**
     * Creates a navigation mesh
     * @param meshes array of all the geometry used to compute the navigation mesh
     * @param parameters bunch of parameters used to filter geometry
     */
    createNavMesh(meshes: Array<Mesh>, parameters: INavMeshParameters): void;

    /**
     * Create a navigation mesh debug mesh
     * @param scene is where the mesh will be added
     * @returns debug display mesh
     */
    createDebugNavMesh(scene: Scene): Mesh;

    /**
     * Get a navigation mesh constrained position, closest to the parameter position
     * @param position world position
     * @returns the closest point to position constrained by the navigation mesh
     */
    getClosestPoint(position: Vector3): Vector3;

    /**
     * Get a navigation mesh constrained position, closest to the parameter position
     * @param position world position
     * @param result output the closest point to position constrained by the navigation mesh
     */
    getClosestPointToRef(position: Vector3, result: Vector3): void;

    /**
     * Get a navigation mesh constrained position, within a particular radius
     * @param position world position
     * @param maxRadius the maximum distance to the constrained world position
     * @returns the closest point to position constrained by the navigation mesh
     */
    getRandomPointAround(position: Vector3, maxRadius: number): Vector3;

    /**
     * Get a navigation mesh constrained position, within a particular radius
     * @param position world position
     * @param maxRadius the maximum distance to the constrained world position
     * @param result output the closest point to position constrained by the navigation mesh
     */
    getRandomPointAroundToRef(position: Vector3, maxRadius: number, result: Vector3): void;

    /**
     * Compute the final position from a segment made of destination-position
     * @param position world position
     * @param destination world position
     * @returns the resulting point along the navmesh
     */
    moveAlong(position: Vector3, destination: Vector3): Vector3;

    /**
     * Compute the final position from a segment made of destination-position
     * @param position world position
     * @param destination world position
     * @param result output the resulting point along the navmesh
     */
    moveAlongToRef(position: Vector3, destination: Vector3, result: Vector3): void;

    /**
     * Compute a navigation path from start to end. Returns an empty array if no path can be computed
     * @param start world position
     * @param end world position
     * @returns array containing world position composing the path
     */
    computePath(start: Vector3, end: Vector3): Vector3[];

    /**
     * If this plugin is supported
     * @returns true if plugin is supported
     */
    isSupported(): boolean;

    /**
     * Create a new Crowd so you can add agents
     * @param maxAgents the maximum agent count in the crowd
     * @param maxAgentRadius the maximum radius an agent can have
     * @param scene to attach the crowd to
     * @returns the crowd you can add agents to
     */
    createCrowd(maxAgents: number, maxAgentRadius: number, scene: Scene): ICrowd;

    /**
     * Set the Bounding box extent for doing spatial queries (getClosestPoint, getRandomPointAround, ...)
     * The queries will try to find a solution within those bounds
     * default is (1,1,1)
     * @param extent x,y,z value that define the extent around the queries point of reference
     */
    setDefaultQueryExtent(extent: Vector3): void;

    /**
     * Get the Bounding box extent specified by setDefaultQueryExtent
     * @returns the box extent values
     */
    getDefaultQueryExtent(): Vector3;

    /**
     * build the navmesh from a previously saved state using getNavmeshData
     * @param data the Uint8Array returned by getNavmeshData
     */
    buildFromNavmeshData(data: Uint8Array): void;

    /**
     * returns the navmesh data that can be used later. The navmesh must be built before retrieving the data
     * @returns data the Uint8Array that can be saved and reused
     */
    getNavmeshData(): Uint8Array;

    /**
     * Get the Bounding box extent result specified by setDefaultQueryExtent
     * @param result output the box extent values
     */
    getDefaultQueryExtentToRef(result: Vector3): void;

    /**
     * Set the time step of the navigation tick update.
     * Default is 1/60.
     * A value of 0 will disable fixed time update
     * @param newTimeStep the new timestep to apply to this world.
     */
    setTimeStep(newTimeStep: number): void;

    /**
     * Get the time step of the navigation tick update.
     * @returns the current time step
     */
    getTimeStep(): number;

    /**
     * If delta time in navigation tick update is greater than the time step
     * a number of sub iterations are done. If more iterations are need to reach deltatime
     * they will be discarded.
     * A value of 0 will set to no maximum and update will use as many substeps as needed
     * @param newStepCount the maximum number of iterations
     */
    setMaximumSubStepCount(newStepCount: number): void;

    /**
     * Get the maximum number of iterations per navigation tick update
     * @returns the maximum number of iterations
     */
    getMaximumSubStepCount(): number;

    /**
     * Creates a cylinder obstacle and add it to the navigation
     * @param position world position
     * @param radius cylinder radius
     * @param height cylinder height
     * @returns the obstacle freshly created
     */
    addCylinderObstacle(position: Vector3, radius: number, height: number): IObstacle;

    /**
     * Creates an oriented box obstacle and add it to the navigation
     * @param position world position
     * @param extent box size
     * @param angle angle in radians of the box orientation on Y axis
     * @returns the obstacle freshly created
     */
    addBoxObstacle(position: Vector3, extent: Vector3, angle: number): IObstacle;

    /**
     * Removes an obstacle created by addCylinderObstacle or addBoxObstacle
     * @param obstacle obstacle to remove from the navigation
     */
    removeObstacle(obstacle: IObstacle): void;

    /**
     * Release all resources
     */
    dispose(): void;
}

/**
 * Obstacle interface
 */
export interface IObstacle {
}

/**
 * Crowd Interface. A Crowd is a collection of moving agents constrained by a navigation mesh
 */
export interface ICrowd {
    /**
     * Add a new agent to the crowd with the specified parameter a corresponding transformNode.
     * You can attach anything to that node. The node position is updated in the scene update tick.
     * @param pos world position that will be constrained by the navigation mesh
     * @param parameters agent parameters
     * @param transform hooked to the agent that will be update by the scene
     * @returns agent index
     */
    addAgent(pos: Vector3, parameters: IAgentParameters, transform: TransformNode): number;

    /**
     * Returns the agent position in world space
     * @param index agent index returned by addAgent
     * @returns world space position
     */
    getAgentPosition(index: number): Vector3;

    /**
     * Gets the agent position result in world space
     * @param index agent index returned by addAgent
     * @param result output world space position
     */
    getAgentPositionToRef(index: number, result: Vector3): void;

    /**
     * Gets the agent velocity in world space
     * @param index agent index returned by addAgent
     * @returns world space velocity
     */
    getAgentVelocity(index: number): Vector3;

    /**
     * Gets the agent velocity result in world space
     * @param index agent index returned by addAgent
     * @param result output world space velocity
     */
    getAgentVelocityToRef(index: number, result: Vector3): void;

    /**
     * Gets the agent next target point on the path
     * @param index agent index returned by addAgent
     * @returns world space position
     */
    getAgentNextTargetPath(index: number): Vector3;

    /**
     * Gets the agent state
     * @param index agent index returned by addAgent
     * @returns agent state
     */
    getAgentState(index: number): number;

    /**
     * returns true if the agent in over an off mesh link connection
     * @param index agent index returned by addAgent
     * @returns true if over an off mesh link connection
     */
    overOffmeshConnection(index: number): boolean;

    /**
     * Gets the agent next target point on the path
     * @param index agent index returned by addAgent
     * @param result output world space position
     */
    getAgentNextTargetPathToRef(index: number, result: Vector3): void;

    /**
     * remove a particular agent previously created
     * @param index agent index returned by addAgent
     */
    removeAgent(index: number): void;

    /**
     * get the list of all agents attached to this crowd
     * @returns list of agent indices
     */
    getAgents() : number[];

    /**
     * Tick update done by the Scene. Agent position/velocity/acceleration is updated by this function
     * @param deltaTime in seconds
     */
    update(deltaTime: number): void;

    /**
     * Asks a particular agent to go to a destination. That destination is constrained by the navigation mesh
     * @param index agent index returned by addAgent
     * @param destination targeted world position
     */
    agentGoto(index: number, destination: Vector3): void;

    /**
     * Teleport the agent to a new position
     * @param index agent index returned by addAgent
     * @param destination targeted world position
     */
    agentTeleport(index: number, destination: Vector3): void;

    /**
     * Update agent parameters
     * @param index agent index returned by addAgent
     * @param parameters agent parameters
     */
    updateAgentParameters(index: number, parameters: IAgentParameters): void;

    /**
     * Set the Bounding box extent for doing spatial queries (getClosestPoint, getRandomPointAround, ...)
     * The queries will try to find a solution within those bounds
     * default is (1,1,1)
     * @param extent x,y,z value that define the extent around the queries point of reference
     */
    setDefaultQueryExtent(extent: Vector3): void;

    /**
     * Get the Bounding box extent specified by setDefaultQueryExtent
     * @returns the box extent values
     */
    getDefaultQueryExtent(): Vector3;

    /**
     * Get the Bounding box extent result specified by setDefaultQueryExtent
     * @param result output the box extent values
     */
    getDefaultQueryExtentToRef(result: Vector3): void;

    /**
     * Get the next corner points composing the path (max 4 points)
     * @param index agent index returned by addAgent
     * @returns array containing world position composing the path
     */
    getCorners(index: number): Vector3[];

    /**
     * Release all resources
     */
    dispose() : void;
}

/**
 * Configures an agent
 */
export interface IAgentParameters {
    /**
     *  Agent radius. [Limit: >= 0]
     */
    radius: number;

    /**
     * Agent height. [Limit: > 0]
     */
    height: number;

    /**
     *  Maximum allowed acceleration. [Limit: >= 0]
     */
    maxAcceleration: number;

    /**
     * Maximum allowed speed. [Limit: >= 0]
     */
    maxSpeed: number;

    /**
     * Defines how close a collision element must be before it is considered for steering behaviors. [Limits: > 0]
     */
    collisionQueryRange: number;

    /**
     * The path visibility optimization range. [Limit: > 0]
     */
    pathOptimizationRange: number;

    /**
     * How aggressive the agent manager should be at avoiding collisions with this agent. [Limit: >= 0]
     */
    separationWeight: number;
}

/**
 * Configures the navigation mesh creation
 */
export interface INavMeshParameters {
    /**
     * The xz-plane cell size to use for fields. [Limit: > 0] [Units: wu]
     */
    cs: number;

    /**
     * The y-axis cell size to use for fields. [Limit: > 0] [Units: wu]
     */
    ch: number;

    /**
     * The maximum slope that is considered walkable. [Limits: 0 <= value < 90] [Units: Degrees]
     */
    walkableSlopeAngle: number;

    /**
     * Minimum floor to 'ceiling' height that will still allow the floor area to
     * be considered walkable. [Limit: >= 3] [Units: vx]
     */
    walkableHeight: number;

    /**
     * Maximum ledge height that is considered to still be traversable. [Limit: >=0] [Units: vx]
     */
    walkableClimb: number;

    /**
     * The distance to erode/shrink the walkable area of the heightfield away from
     * obstructions.  [Limit: >=0] [Units: vx]
     */
    walkableRadius: number;

    /**
     * The maximum allowed length for contour edges along the border of the mesh. [Limit: >=0] [Units: vx]
     */
    maxEdgeLen: number;

    /**
     * The maximum distance a simplified contour's border edges should deviate
     * the original raw contour. [Limit: >=0] [Units: vx]
     */
    maxSimplificationError: number;

    /**
     * The minimum number of cells allowed to form isolated island areas. [Limit: >=0] [Units: vx]
     */
    minRegionArea: number;

    /**
     * Any regions with a span count smaller than this value will, if possible,
     * be merged with larger regions. [Limit: >=0] [Units: vx]
     */
    mergeRegionArea: number;

    /**
     * The maximum number of vertices allowed for polygons generated during the
     * contour to polygon conversion process. [Limit: >= 3]
     */
    maxVertsPerPoly: number;

    /**
     * Sets the sampling distance to use when generating the detail mesh.
     * (For height detail only.) [Limits: 0 or >= 0.9] [Units: wu]
     */
    detailSampleDist: number;

    /**
     * The maximum distance the detail mesh surface should deviate from heightfield
     * data. (For height detail only.) [Limit: >=0] [Units: wu]
     */
    detailSampleMaxError: number;

    /**
     * If using obstacles, the navmesh must be subdivided internaly by tiles.
     * This member defines the tile cube side length in world units.
     * If no obstacles are needed, leave it undefined or 0.
     */
    tileSize: number;

    /**
    * The size of the non-navigable border around the heightfield.
    */
    borderSize: number;
}
