import { INavigationEnginePlugin, ICrowd, AgentParameters, NavMeshParameters } from "../../Navigation/INavigationEngine";
import { Logger } from "../../Misc/logger";
import { VertexData } from "../../Meshes/mesh.vertexData";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { Mesh } from "../../Meshes/mesh";
import { Scene } from "../../scene";
import { Vector3 } from '../../Maths/math';
import { TransformNode } from "../../Meshes/transformNode";

declare var Recast: any;

/**
 * RecastJS navigation plugin
 */
export class RecastJSPlugin implements INavigationEnginePlugin {
    /**
     * Reference to the Recast library
     */
    public bjsRECAST: any = {};
    public name: string = "RecastJSPlugin";
    public navMesh: any;

    /**
     * Initializes the recastJS plugin
     */
    public constructor(recastInjection: any = Recast) {
        if (typeof recastInjection === "function") {
            recastInjection(this.bjsRECAST);
        } else {
            this.bjsRECAST = recastInjection();
        }

        if (!this.isSupported()) {
            Logger.Error("RecastJS is not available. Please make sure you included the js file.");
            return;
        }
    }

    /**
     * Creates a navigation mesh
     * @param mesh of all the geometry used to compute the navigatio mesh
     * @param parameters bunch of parameters used to filter geometry
     */
    createMavMesh(mesh: AbstractMesh, parameters: NavMeshParameters): void {
        var rc = new this.bjsRECAST.rcConfig();
        rc.cs = parameters.cs;
        rc.ch = parameters.ch;
        rc.walkableSlopeAngle = parameters.walkableSlopeAngle;
        rc.walkableHeight = parameters.walkableHeight;
        rc.walkableClimb = parameters.walkableClimb;
        rc.walkableRadius = parameters.walkableRadius;
        rc.maxEdgeLen = parameters.maxEdgeLen;
        rc.maxSimplificationError = parameters.maxSimplificationError;
        rc.minRegionArea = parameters.minRegionArea;
        rc.mergeRegionArea = parameters.mergeRegionArea;
        rc.maxVertsPerPoly = parameters.maxVertsPerPoly;
        rc.detailSampleDist = parameters.detailSampleDist;
        rc.detailSampleMaxError = parameters.detailSampleMaxError;

        this.navMesh = new this.bjsRECAST.NavMesh();
        var meshIndices = mesh.getIndices();
        var positions = mesh.getVerticesData('position');
        this.navMesh.build(positions, mesh.getTotalVertices(), meshIndices, mesh.getTotalIndices(), rc);
    }

    /**
     * Create a navigation mesh debug mesh
     * @param scene is where the mesh will be added
     * @returns debug display mesh
     */
    createDebugNavMesh(scene: Scene): Mesh {
        var tri: number;
        var pt: number;
        var debugNavMesh = this.navMesh.getDebugNavMesh();
        let triangleCount = debugNavMesh.getTriangleCount();

        var indices = [];
        var positions = [];
        for (tri = 0; tri < triangleCount * 3; tri++)
        {
            indices.push(tri);
        }
        for (tri = 0; tri < triangleCount; tri++)
        {
            for (pt = 0; pt < 3 ; pt++)
            {
                let point = debugNavMesh.getTriangle(tri).getPoint(pt);
                positions.push(point.x, point.y, point.z);
            }
        }

        var mesh = new Mesh("NavMeshDebug", scene);
        var vertexData = new VertexData();

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
    getClosestPoint(position: Vector3) : Vector3
    {
        var p = new this.bjsRECAST.Vec3(position.x, position.y, position.z);
        var ret = this.navMesh.getClosestPoint(p);
        var pr = new Vector3(ret.x, ret.y, ret.z);
        return pr;
    }

    /**
     * Get a navigation mesh constrained position, closest to the parameter position
     * @param position world position
     * @returns the closest point to position constrained by the navigation mesh
     */
    getRandomPointAround(position: Vector3, maxRadius: number): Vector3 {
        var p = new this.bjsRECAST.Vec3(position.x, position.y, position.z);
        var ret = this.navMesh.getRandomPointAround(p, maxRadius);
        var pr = new Vector3(ret.x, ret.y, ret.z);
        return pr;
    }

    /**
     * Get a navigation mesh constrained position, closest to the parameter position
     * @param position world position
     * @returns the closest point to position constrained by the navigation mesh
     */
    createCrowd(maxAgents: number, maxAgentRadius: number, scene: Scene) : ICrowd
    {
        var crowd = new RecastJSCrowd(this, maxAgents, maxAgentRadius, scene);
        scene.addCrowd(crowd);
        return crowd;
    }

    /**
     * Disposes
     */
    public dispose() {

    }

    public isSupported(): boolean {
        return this.bjsRECAST !== undefined;
    }
}

export class RecastJSCrowd implements ICrowd {
    public bjsRECASTPlugin: RecastJSPlugin;
    public recastCrowd: any = {};
    public transforms: TransformNode[];
    public agents: number[];
    private scene: Scene;

    public constructor(plugin: RecastJSPlugin, maxAgents: number, maxAgentRadius: number, scene: Scene) {
        this.bjsRECASTPlugin = plugin;
        this.recastCrowd = new this.bjsRECASTPlugin.bjsRECAST.Crowd(maxAgents, maxAgentRadius, this.bjsRECASTPlugin.navMesh.getNavMesh());
        this.transforms = new Array<TransformNode>();
        this.agents = new Array<number>();
        this.scene = scene;
    }

    /**
     * Add a new agent to the crowd with the specified parameter a corresponding transformNode.
     * You can attach anything to that node. The node position is updated in the scene update tick.
     * @param pos world position that will be constrained by the navigation mesh
     * @param parameters agent parameters
     * @param transform hooked to the agent that will be update by the scene
     * @returns agent index
     */
    addAgent(pos: Vector3, parameters: AgentParameters, transform: TransformNode): number
    {
        var agentParams = new this.bjsRECASTPlugin.bjsRECAST.dtCrowdAgentParams();
        agentParams.radius = parameters.radius;
        agentParams.height = parameters.height;
        agentParams.maxAcceleration = parameters.maxAcceleration;
        agentParams.maxSpeed = parameters.maxSpeed;
        agentParams.collisionQueryRange = parameters.collisionQueryRange;
        agentParams.pathOptimizationRange = parameters.pathOptimizationRange;
        agentParams.separationWeight = parameters.separationWeight;
        agentParams.updateFlags = 7;
        agentParams.obstacleAvoidanceType = 0;
        agentParams.queryFilterType = 0;
        agentParams.userData = 0;

        var agentIndex = this.recastCrowd.addAgent(new this.bjsRECASTPlugin.bjsRECAST.Vec3(pos.x, pos.y, pos.z), agentParams);
        this.transforms.push(transform);
        this.agents.push(agentIndex);
        return agentIndex;
    }

    /**
     *
     * @param index agent index returned by addAgent
     * @returns world space position
     */
    getAgentPosition(index: number): Vector3 {
        var agentPos = this.recastCrowd.getAgentPosition(index);
        return new Vector3(agentPos.x, agentPos.y, agentPos.z);
    }

    /**
     *
     * @param index agent index returned by addAgent
     * @returns world space velocity
     */
    getAgentVelocity(index: number): Vector3 {
        var agentVel = this.recastCrowd.getAgentVelocity(index);
        return new Vector3(agentVel.x, agentVel.y, agentVel.z);
    }

    /**
     * Asks a particular agent to go to a destination. That destination is constrained by the navigation mesh
     * @param index agent index returned by addAgent
     * @param destination targeted world position
     * @returns the closest point to position constrained by the navigation mesh
     */
    agentGoto(index: number, destination: Vector3): void {
        this.recastCrowd.agentGoto(index, new this.bjsRECASTPlugin.bjsRECAST.Vec3(destination.x, destination.y, destination.z));
    }

    /**
     * remove a particular agent previously created
     * @param index agent index returned by addAgent
     */
    removeAgent(index: number): void {
        this.recastCrowd.removeAgent(index);

        var item = this.agents.indexOf(index);
        if (item > -1) {
            this.agents.splice(item, 1);
            this.transforms.splice(item, 1);
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
        // update crowd
        this.recastCrowd.update(deltaTime);

        // update transforms
        var index: number;
        for (index = 0; index < this.agents.length; index++)
        {
            this.transforms[index].position = this.getAgentPosition(this.agents[index]);
        }
    }

    dispose() : void
    {
        this.recastCrowd.destroy();
        this.scene.removeCrowd(this);
    }
}