import { INavigationEnginePlugin, ICrowd, IAgentParameters, INavMeshParameters } from "../../Navigation/INavigationEngine";
import { Logger } from "../../Misc/logger";
import { VertexData } from "../../Meshes/mesh.vertexData";
import { Mesh } from "../../Meshes/mesh";
import { Scene } from "../../scene";
import { Vector3 } from '../../Maths/math';
import { TransformNode } from "../../Meshes/transformNode";
import { Observer } from "../../Misc/observable";
import { Nullable } from "../../types";
import { VertexBuffer } from "../../Meshes/buffer";

declare var Recast: any;

/**
 * RecastJS navigation plugin
 */
export class RecastJSPlugin implements INavigationEnginePlugin {
    /**
     * Reference to the Recast library
     */
    public bjsRECAST: any = {};

    /**
     * plugin name
     */
    public name: string = "RecastJSPlugin";

    /**
     * the first navmesh created. We might extend this to support multiple navmeshes
     */
    public navMesh: any;

    /**
     * Initializes the recastJS plugin
     * @param recastInjection can be used to inject your own recast reference
     */
    public constructor(recastInjection: any = Recast) {
        if (typeof recastInjection === "function") {
            recastInjection(this.bjsRECAST);
        } else {
            this.bjsRECAST = recastInjection;
        }

        if (!this.isSupported()) {
            Logger.Error("RecastJS is not available. Please make sure you included the js file.");
            return;
        }
    }

    /**
     * Creates a navigation mesh
     * @param meshes array of all the geometry used to compute the navigatio mesh
     * @param parameters bunch of parameters used to filter geometry
     */
    createNavMesh(meshes: Array<Mesh>, parameters: INavMeshParameters): void {
        const rc = new this.bjsRECAST.rcConfig();
        rc.cs = parameters.cs;
        rc.ch = parameters.ch;
        rc.borderSize = 0;
        rc.tileSize = 0;
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

        var index: number;
        var tri: number;
        var pt: number;

        var indices = [];
        var positions = [];
        var offset = 0;
        for (index = 0; index < meshes.length; index++) {
            if (meshes[index]) {
                var mesh = meshes[index];

                const meshIndices = mesh.getIndices();
                if (!meshIndices) {
                    continue;
                }
                const meshPositions = mesh.getVerticesData(VertexBuffer.PositionKind, false, false);
                if (!meshPositions) {
                    continue;
                }

                const wm = mesh.computeWorldMatrix(false);

                for (tri = 0; tri < meshIndices.length; tri++) {
                    indices.push(meshIndices[tri] + offset);
                }

                var transformed = Vector3.Zero();
                var position = Vector3.Zero();
                for (pt = 0; pt < meshPositions.length; pt += 3) {
                    Vector3.FromArrayToRef(meshPositions, pt, position);
                    Vector3.TransformCoordinatesToRef(position, wm, transformed);
                    positions.push(transformed.x, transformed.y, transformed.z);
                }

                offset += meshPositions.length / 3;
            }
        }

        this.navMesh.build(positions, offset, indices, indices.length, rc);
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
     * @param result output the closest point to position constrained by the navigation mesh
     */
    getClosestPointToRef(position: Vector3, result: Vector3) : void {
        var p = new this.bjsRECAST.Vec3(position.x, position.y, position.z);
        var ret = this.navMesh.getClosestPoint(p);
        result.set(ret.x, ret.y, ret.z);
    }

    /**
     * Get a navigation mesh constrained position, within a particular radius
     * @param position world position
     * @param maxRadius the maximum distance to the constrained world position
     * @returns the closest point to position constrained by the navigation mesh
     */
    getRandomPointAround(position: Vector3, maxRadius: number): Vector3 {
        var p = new this.bjsRECAST.Vec3(position.x, position.y, position.z);
        var ret = this.navMesh.getRandomPointAround(p, maxRadius);
        var pr = new Vector3(ret.x, ret.y, ret.z);
        return pr;
    }

    /**
     * Get a navigation mesh constrained position, within a particular radius
     * @param position world position
     * @param maxRadius the maximum distance to the constrained world position
     * @param result output the closest point to position constrained by the navigation mesh
     */
    getRandomPointAroundToRef(position: Vector3, maxRadius: number, result: Vector3): void {
        var p = new this.bjsRECAST.Vec3(position.x, position.y, position.z);
        var ret = this.navMesh.getRandomPointAround(p, maxRadius);
        result.set(ret.x, ret.y, ret.z);
    }

    /**
     * Compute the final position from a segment made of destination-position
     * @param position world position
     * @param destination world position
     * @returns the resulting point along the navmesh
     */
    moveAlong(position: Vector3, destination: Vector3): Vector3 {
        var p = new this.bjsRECAST.Vec3(position.x, position.y, position.z);
        var d = new this.bjsRECAST.Vec3(destination.x, destination.y, destination.z);
        var ret = this.navMesh.moveAlong(p, d);
        var pr = new Vector3(ret.x, ret.y, ret.z);
        return pr;
    }

    /**
     * Compute the final position from a segment made of destination-position
     * @param position world position
     * @param destination world position
     * @param result output the resulting point along the navmesh
     */
    moveAlongToRef(position: Vector3, destination: Vector3, result: Vector3): void {
        var p = new this.bjsRECAST.Vec3(position.x, position.y, position.z);
        var d = new this.bjsRECAST.Vec3(destination.x, destination.y, destination.z);
        var ret = this.navMesh.moveAlong(p, d);
        result.set(ret.x, ret.y, ret.z);
    }

    /**
     * Compute a navigation path from start to end. Returns an empty array if no path can be computed
     * @param start world position
     * @param end world position
     * @returns array containing world position composing the path
     */
    computePath(start: Vector3, end: Vector3): Vector3[]
    {
        var pt: number;
        let startPos = new this.bjsRECAST.Vec3(start.x, start.y, start.z);
        let endPos = new this.bjsRECAST.Vec3(end.x, end.y, end.z);
        let navPath = this.navMesh.computePath(startPos, endPos);
        let pointCount = navPath.getPointCount();
        var positions = [];
        for (pt = 0; pt < pointCount; pt++)
        {
            let p = navPath.getPoint(pt);
            positions.push(new Vector3(p.x, p.y, p.z));
        }
        return positions;
    }

    /**
     * Create a new Crowd so you can add agents
     * @param maxAgents the maximum agent count in the crowd
     * @param maxAgentRadius the maximum radius an agent can have
     * @param scene to attach the crowd to
     * @returns the crowd you can add agents to
     */
    createCrowd(maxAgents: number, maxAgentRadius: number, scene: Scene) : ICrowd
    {
        var crowd = new RecastJSCrowd(this, maxAgents, maxAgentRadius, scene);
        return crowd;
    }

    /**
     * Set the Bounding box extent for doing spatial queries (getClosestPoint, getRandomPointAround, ...)
     * The queries will try to find a solution within those bounds
     * default is (1,1,1)
     * @param extent x,y,z value that define the extent around the queries point of reference
     */
    setDefaultQueryExtent(extent: Vector3): void
    {
        let ext = new this.bjsRECAST.Vec3(extent.x, extent.y, extent.z);
        this.navMesh.setDefaultQueryExtent(ext);
    }

    /**
     * Get the Bounding box extent specified by setDefaultQueryExtent
     * @returns the box extent values
     */
    getDefaultQueryExtent(): Vector3
    {
        let p = this.navMesh.getDefaultQueryExtent();
        return new Vector3(p.x, p.y, p.z);
    }

    /**
     * build the navmesh from a previously saved state using getNavmeshData
     * @param data the Uint8Array returned by getNavmeshData
     */
    buildFromNavmeshData(data: Uint8Array): void
    {
        var nDataBytes = data.length * data.BYTES_PER_ELEMENT;
        var dataPtr = this.bjsRECAST._malloc(nDataBytes);

        var dataHeap = new Uint8Array(this.bjsRECAST.HEAPU8.buffer, dataPtr, nDataBytes);
        dataHeap.set(data);

        let buf = new this.bjsRECAST.NavmeshData();
        buf.dataPointer = dataHeap.byteOffset;
        buf.size = data.length;
        this.navMesh = new this.bjsRECAST.NavMesh();
        this.navMesh.buildFromNavmeshData(buf);

        // Free memory
        this.bjsRECAST._free(dataHeap.byteOffset);
    }

    /**
     * returns the navmesh data that can be used later. The navmesh must be built before retrieving the data
     * @returns data the Uint8Array that can be saved and reused
     */
    getNavmeshData(): Uint8Array
    {
        let navmeshData = this.navMesh.getNavmeshData();
        var arrView = new Uint8Array(this.bjsRECAST.HEAPU8.buffer, navmeshData.dataPointer, navmeshData.size);
        var ret = new Uint8Array(navmeshData.size);
        ret.set(arrView);
        this.navMesh.freeNavmeshData(navmeshData);
        return ret;
    }

    /**
     * Get the Bounding box extent result specified by setDefaultQueryExtent
     * @param result output the box extent values
     */
    getDefaultQueryExtentToRef(result: Vector3): void
    {
        let p = this.navMesh.getDefaultQueryExtent();
        result.set(p.x, p.y, p.z);
    }

    /**
     * Disposes
     */
    public dispose() {

    }

    /**
     * If this plugin is supported
     * @returns true if plugin is supported
     */
    public isSupported(): boolean {
        return this.bjsRECAST !== undefined;
    }
}

/**
 * Recast detour crowd implementation
 */
export class RecastJSCrowd implements ICrowd {
    /**
     * Recast/detour plugin
     */
    public bjsRECASTPlugin: RecastJSPlugin;
    /**
     * Link to the detour crowd
     */
    public recastCrowd: any = {};
    /**
     * One transform per agent
     */
    public transforms: TransformNode[] = new Array<TransformNode>();
    /**
     * All agents created
     */
    public agents: number[] = new Array<number>();
    /**
     * Link to the scene is kept to unregister the crowd from the scene
     */
    private _scene: Scene;

    /**
     * Observer for crowd updates
     */
    private _onBeforeAnimationsObserver: Nullable<Observer<Scene>> = null;

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
        this.recastCrowd = new this.bjsRECASTPlugin.bjsRECAST.Crowd(maxAgents, maxAgentRadius, this.bjsRECASTPlugin.navMesh.getNavMesh());
        this._scene = scene;

        this._onBeforeAnimationsObserver = scene.onBeforeAnimationsObservable.add(() => {
            this.update(scene.getEngine().getDeltaTime() * 0.001);
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
    addAgent(pos: Vector3, parameters: IAgentParameters, transform: TransformNode): number
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
     * Returns the agent position in world space
     * @param index agent index returned by addAgent
     * @returns world space position
     */
    getAgentPosition(index: number): Vector3 {
        var agentPos = this.recastCrowd.getAgentPosition(index);
        return new Vector3(agentPos.x, agentPos.y, agentPos.z);
    }

    /**
     * Returns the agent position result in world space
     * @param index agent index returned by addAgent
     * @param result output world space position
     */
    getAgentPositionToRef(index: number, result: Vector3): void {
        var agentPos = this.recastCrowd.getAgentPosition(index);
        result.set(agentPos.x, agentPos.y, agentPos.z);
    }

    /**
     * Returns the agent velocity in world space
     * @param index agent index returned by addAgent
     * @returns world space velocity
     */
    getAgentVelocity(index: number): Vector3 {
        var agentVel = this.recastCrowd.getAgentVelocity(index);
        return new Vector3(agentVel.x, agentVel.y, agentVel.z);
    }

    /**
     * Returns the agent velocity result in world space
     * @param index agent index returned by addAgent
     * @param result output world space velocity
     */
    getAgentVelocityToRef(index: number, result: Vector3): void {
        var agentVel = this.recastCrowd.getAgentVelocity(index);
        result.set(agentVel.x, agentVel.y, agentVel.z);
    }

    /**
     * Asks a particular agent to go to a destination. That destination is constrained by the navigation mesh
     * @param index agent index returned by addAgent
     * @param destination targeted world position
     */
    agentGoto(index: number, destination: Vector3): void {
        this.recastCrowd.agentGoto(index, new this.bjsRECASTPlugin.bjsRECAST.Vec3(destination.x, destination.y, destination.z));
    }

    /**
     * Teleport the agent to a new position
     * @param index agent index returned by addAgent
     * @param destination targeted world position
     */
    agentTeleport(index: number, destination: Vector3): void {
        this.recastCrowd.agentTeleport(index, new this.bjsRECASTPlugin.bjsRECAST.Vec3(destination.x, destination.y, destination.z));
    }

    /**
     * Update agent parameters
     * @param index agent index returned by addAgent
     * @param parameters agent parameters
     */
    updateAgentParameters(index: number, parameters: IAgentParameters): void {
        var agentParams = this.recastCrowd.getAgentParameters(index);

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

        this.recastCrowd.setAgentParameters(index, agentParams);
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
        for (let index = 0; index < this.agents.length; index++)
        {
            this.transforms[index].position = this.getAgentPosition(this.agents[index]);
        }
    }

    /**
     * Set the Bounding box extent for doing spatial queries (getClosestPoint, getRandomPointAround, ...)
     * The queries will try to find a solution within those bounds
     * default is (1,1,1)
     * @param extent x,y,z value that define the extent around the queries point of reference
     */
    setDefaultQueryExtent(extent: Vector3): void
    {
        let ext = new this.bjsRECASTPlugin.bjsRECAST.Vec3(extent.x, extent.y, extent.z);
        this.recastCrowd.setDefaultQueryExtent(ext);
    }

    /**
     * Get the Bounding box extent specified by setDefaultQueryExtent
     * @returns the box extent values
     */
    getDefaultQueryExtent(): Vector3
    {
        let p = this.recastCrowd.getDefaultQueryExtent();
        return new Vector3(p.x, p.y, p.z);
    }

    /**
     * Get the Bounding box extent result specified by setDefaultQueryExtent
     * @param result output the box extent values
     */
    getDefaultQueryExtentToRef(result: Vector3): void
    {
        let p = this.recastCrowd.getDefaultQueryExtent();
        result.set(p.x, p.y, p.z);
    }

    /**
     * Release all resources
     */
    dispose() : void
    {
        this.recastCrowd.destroy();
        this._scene.onBeforeAnimationsObservable.remove(this._onBeforeAnimationsObserver);
        this._onBeforeAnimationsObserver = null;
    }
}