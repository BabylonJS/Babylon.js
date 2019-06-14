import { TransformNode } from "../Meshes/transformNode";
import { Vector3 } from "../Maths/math";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import { Scene } from "../scene";

/**
 * Navigation plugin interface to add navigation constrained by a navigation mesh
 */
export interface INavigationEnginePlugin {
    name: string;

    /// Create a navigation mesh that will constrain a Crowd of agents
    createMavMesh(mesh: AbstractMesh, parameters: NavMeshParameters): void;

    /// Create and a to the scene a debug navmesh. Set the material to make it visible
    createDebugNavMesh(scene: Scene): Mesh;

    /// Get a navigation mesh constrained position, closest to the parameter position
    getClosestPoint(position: Vector3): Vector3;

    /// return a random position within a position centered disk 
    getRandomPointAround(position: Vector3, maxRadius: number): Vector3;

    ///
    isSupported(): boolean;

    /// Create a new Crowd so you can add agents
    createCrowd(maxAgents: number, maxAgentRadius: number, scene: Scene): ICrowd;

    ///
    dispose(): void;
}

/**
 * Crowd Interface. A Crowd is a collection of moving agents constrained by a navigation mesh
 */
export interface ICrowd {
    /// add a new agent to the crowd with the specified parameter a corresponding transformNode.
    /// You can attach anything to that node. The node position is updated in the scene update tick.
    addAgent(pos: Vector3, parameters: AgentParameters, transform: TransformNode): number;

    ///
    getAgentPosition(index: number): Vector3;

    ///
    getAgentVelocity(index: number): Vector3;

    /// remove a particular agent previously created
    removeAgent(index: number): void;

    /// get the list of all agents attached to this crowd
    getAgents() : number[];

    /// Tick update done by the Scene. Agent position/velocity/acceleration is updated by this function
    update(deltaTime: number): void;

    /// Asks a particular agent to go to a destination. That destination is constrained by the navigation mesh
    agentGoto(index: number, destination: Vector3): void;

    /// dispose
    dispose() : void;
}

export class AgentParameters {
    /// Agent radius. [Limit: >= 0]
    radius: number;

    /// Agent height. [Limit: > 0]
    height: number;

    /// Maximum allowed acceleration. [Limit: >= 0]
    maxAcceleration: number;

    /// Maximum allowed speed. [Limit: >= 0]
    maxSpeed: number;

    /// Defines how close a collision element must be before it is considered for steering behaviors. [Limits: > 0]
    collisionQueryRange: number;

    /// The path visibility optimization range. [Limit: > 0]
    pathOptimizationRange: number;

    /// How aggresive the agent manager should be at avoiding collisions with this agent. [Limit: >= 0]
    separationWeight: number;
}

export class NavMeshParameters {
    /// The xz-plane cell size to use for fields. [Limit: > 0] [Units: wu] 
	cs: number;

	/// The y-axis cell size to use for fields. [Limit: > 0] [Units: wu]
    ch: number;
    
    //constructor(): NavMeshParameters;
    /// The maximum slope that is considered walkable. [Limits: 0 <= value < 90] [Units: Degrees] 
    walkableSlopeAngle: number;

    /// Minimum floor to 'ceiling' height that will still allow the floor area to 
    /// be considered walkable. [Limit: >= 3] [Units: vx] 
    walkableHeight: number;

    /// Maximum ledge height that is considered to still be traversable. [Limit: >=0] [Units: vx] 
    walkableClimb: number;

    /// The distance to erode/shrink the walkable area of the heightfield away from 
    /// obstructions.  [Limit: >=0] [Units: vx] 
    walkableRadius: number;

    /// The maximum allowed length for contour edges along the border of the mesh. [Limit: >=0] [Units: vx] 
    maxEdgeLen: number;

    /// The maximum distance a simplfied contour's border edges should deviate 
    /// the original raw contour. [Limit: >=0] [Units: vx]
    maxSimplificationError: number;

    /// The minimum number of cells allowed to form isolated island areas. [Limit: >=0] [Units: vx] 
    minRegionArea: number;

    /// Any regions with a span count smaller than this value will, if possible, 
    /// be merged with larger regions. [Limit: >=0] [Units: vx] 
    mergeRegionArea: number;

    /// The maximum number of vertices allowed for polygons generated during the 
    /// contour to polygon conversion process. [Limit: >= 3] 
    maxVertsPerPoly: number;

    /// Sets the sampling distance to use when generating the detail mesh.
    /// (For height detail only.) [Limits: 0 or >= 0.9] [Units: wu] 
    detailSampleDist: number;

    /// The maximum distance the detail mesh surface should deviate from heightfield
    /// data. (For height detail only.) [Limit: >=0] [Units: wu] 
    detailSampleMaxError: number;
}
