import { INavigationEnginePlugin, ICrowd, IAgentParameters, INavMeshParameters, IObstacle } from "../../Navigation/INavigationEngine";
import { Logger } from "../../Misc/logger";
import { VertexData } from "../../Meshes/mesh.vertexData";
import { Mesh } from "../../Meshes/mesh";
import { Scene } from "../../scene";
import { Epsilon, Vector3, Matrix } from '../../Maths/math';
import { TransformNode } from "../../Meshes/transformNode";
import { Observer } from "../../Misc/observable";
import { Nullable } from "../../types";
import { VertexBuffer } from "../../Buffers/buffer";

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

    private _maximumSubStepCount: number = 10;
    private _timeStep: number = 1 / 60;

    private _tempVec1: any;
    private _tempVec2: any;

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
        this.setTimeStep();

        this._tempVec1 = new this.bjsRECAST.Vec3();
        this._tempVec2 = new this.bjsRECAST.Vec3();
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
    getMaximumSubStepCount(): number
    {
        return this._maximumSubStepCount;
    }

    /**
     * Creates a navigation mesh
     * @param meshes array of all the geometry used to compute the navigation mesh
     * @param parameters bunch of parameters used to filter geometry
     */
    createNavMesh(meshes: Array<Mesh>, parameters: INavMeshParameters): void {
        const rc = new this.bjsRECAST.rcConfig();
        rc.cs = parameters.cs;
        rc.ch = parameters.ch;
        rc.borderSize = parameters.borderSize ? parameters.borderSize : 0;
        rc.tileSize = parameters.tileSize ? parameters.tileSize : 0;
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

                var worldMatrices = [];
                const worldMatrix = mesh.computeWorldMatrix(true);

                if (mesh.hasThinInstances) {
                    let thinMatrices = (mesh as Mesh).thinInstanceGetWorldMatrices();
                    for (let instanceIndex = 0; instanceIndex < thinMatrices.length; instanceIndex++) {
                        const tmpMatrix = new Matrix();
                        let thinMatrix = thinMatrices[instanceIndex];
                        thinMatrix.multiplyToRef(worldMatrix, tmpMatrix);
                        worldMatrices.push(tmpMatrix);
                    }
                } else {
                    worldMatrices.push(worldMatrix);
                }

                for (let matrixIndex = 0; matrixIndex < worldMatrices.length; matrixIndex ++) {
                    const wm = worldMatrices[matrixIndex];
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
        this._tempVec1.x = position.x;
        this._tempVec1.y = position.y;
        this._tempVec1.z = position.z;
        var ret = this.navMesh.getClosestPoint(this._tempVec1);
        var pr = new Vector3(ret.x, ret.y, ret.z);
        return pr;
    }

    /**
     * Get a navigation mesh constrained position, closest to the parameter position
     * @param position world position
     * @param result output the closest point to position constrained by the navigation mesh
     */
    getClosestPointToRef(position: Vector3, result: Vector3) : void {
        this._tempVec1.x = position.x;
        this._tempVec1.y = position.y;
        this._tempVec1.z = position.z;
        var ret = this.navMesh.getClosestPoint(this._tempVec1);
        result.set(ret.x, ret.y, ret.z);
    }

    /**
     * Get a navigation mesh constrained position, within a particular radius
     * @param position world position
     * @param maxRadius the maximum distance to the constrained world position
     * @returns the closest point to position constrained by the navigation mesh
     */
    getRandomPointAround(position: Vector3, maxRadius: number): Vector3 {
        this._tempVec1.x = position.x;
        this._tempVec1.y = position.y;
        this._tempVec1.z = position.z;
        var ret = this.navMesh.getRandomPointAround(this._tempVec1, maxRadius);
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
        this._tempVec1.x = position.x;
        this._tempVec1.y = position.y;
        this._tempVec1.z = position.z;
        var ret = this.navMesh.getRandomPointAround(this._tempVec1, maxRadius);
        result.set(ret.x, ret.y, ret.z);
    }

    /**
     * Compute the final position from a segment made of destination-position
     * @param position world position
     * @param destination world position
     * @returns the resulting point along the navmesh
     */
    moveAlong(position: Vector3, destination: Vector3): Vector3 {
        this._tempVec1.x = position.x;
        this._tempVec1.y = position.y;
        this._tempVec1.z = position.z;
        this._tempVec2.x = destination.x;
        this._tempVec2.y = destination.y;
        this._tempVec2.z = destination.z;
        var ret = this.navMesh.moveAlong(this._tempVec1, this._tempVec2);
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
        this._tempVec1.x = position.x;
        this._tempVec1.y = position.y;
        this._tempVec1.z = position.z;
        this._tempVec2.x = destination.x;
        this._tempVec2.y = destination.y;
        this._tempVec2.z = destination.z;
        var ret = this.navMesh.moveAlong(this._tempVec1, this._tempVec2);
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
        this._tempVec1.x = start.x;
        this._tempVec1.y = start.y;
        this._tempVec1.z = start.z;
        this._tempVec2.x = end.x;
        this._tempVec2.y = end.y;
        this._tempVec2.z = end.z;
        let navPath = this.navMesh.computePath(this._tempVec1, this._tempVec2);
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
        this._tempVec1.x = extent.x;
        this._tempVec1.y = extent.y;
        this._tempVec1.z = extent.z;
        this.navMesh.setDefaultQueryExtent(this._tempVec1);
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
     * Creates a cylinder obstacle and add it to the navigation
     * @param position world position
     * @param radius cylinder radius
     * @param height cylinder height
     * @returns the obstacle freshly created
     */
    addCylinderObstacle(position: Vector3, radius: number, height: number): IObstacle
    {
        this._tempVec1.x = position.x;
        this._tempVec1.y = position.y;
        this._tempVec1.z = position.z;
        return this.navMesh.addCylinderObstacle(this._tempVec1, radius, height);
    }

    /**
     * Creates an oriented box obstacle and add it to the navigation
     * @param position world position
     * @param extent box size
     * @param angle angle in radians of the box orientation on Y axis
     * @returns the obstacle freshly created
     */
    addBoxObstacle(position: Vector3, extent: Vector3, angle: number): IObstacle
    {
        this._tempVec1.x = position.x;
        this._tempVec1.y = position.y;
        this._tempVec1.z = position.z;
        this._tempVec2.x = extent.x;
        this._tempVec2.y = extent.y;
        this._tempVec2.z = extent.z;
        return this.navMesh.addBoxObstacle(this._tempVec1, this._tempVec2, angle);
    }

    /**
     * Removes an obstacle created by addCylinderObstacle or addBoxObstacle
     * @param obstacle obstacle to remove from the navigation
     */
    removeObstacle(obstacle: IObstacle): void
    {
        this.navMesh.removeObstacle(obstacle);
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
     * Returns the agent next target point on the path
     * @param index agent index returned by addAgent
     * @returns world space position
     */
    getAgentNextTargetPath(index: number): Vector3 {
        var pathTargetPos = this.recastCrowd.getAgentNextTargetPath(index);
        return new Vector3(pathTargetPos.x, pathTargetPos.y, pathTargetPos.z);
    }

    /**
     * Returns the agent next target point on the path
     * @param index agent index returned by addAgent
     * @param result output world space position
     */
    getAgentNextTargetPathToRef(index: number, result: Vector3): void {
        var pathTargetPos = this.recastCrowd.getAgentNextTargetPath(index);
        result.set(pathTargetPos.x, pathTargetPos.y, pathTargetPos.z);
    }

    /**
     * Gets the agent state
     * @param index agent index returned by addAgent
     * @returns agent state
     */
    getAgentState(index: number): number {
        return this.recastCrowd.getAgentState(index);
    }

    /**
     * returns true if the agent in over an off mesh link connection
     * @param index agent index returned by addAgent
     * @returns true if over an off mesh link connection
     */
    overOffmeshConnection(index: number): boolean {
        return this.recastCrowd.overOffmeshConnection(index);
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
        // update obstacles
        this.bjsRECASTPlugin.navMesh.update();
        // update crowd
        var timeStep = this.bjsRECASTPlugin.getTimeStep();
        var maxStepCount = this.bjsRECASTPlugin.getMaximumSubStepCount();
        if (timeStep <= Epsilon) {
            this.recastCrowd.update(deltaTime);
        } else {
            var iterationCount = Math.floor(deltaTime / timeStep);
            if (maxStepCount && iterationCount > maxStepCount) {
                iterationCount = maxStepCount;
            }
            if (iterationCount < 1) {
                iterationCount = 1;
            }

            var step = deltaTime / iterationCount;
            for (let i = 0; i < iterationCount; i++) {
                this.recastCrowd.update(step);
            }
        }

        // update transforms
        for (let index = 0; index < this.agents.length; index++) {
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
     * Get the next corner points composing the path (max 4 points)
     * @param index agent index returned by addAgent
     * @returns array containing world position composing the path
     */
    getCorners(index: number): Vector3[]
    {
        let pt: number;
        const navPath = this.recastCrowd.getPath(index);
        const pointCount = navPath.getPointCount();
        var positions = [];
        for (pt = 0; pt < pointCount; pt++)
        {
            let p = navPath.getPoint(pt);
            positions.push(new Vector3(p.x, p.y, p.z));
        }
        return positions;
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