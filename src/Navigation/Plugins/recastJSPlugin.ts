import { INavigationEnginePlugin, ICrowd } from "../../Navigation/INavigationEngine";
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
        this.bjsRECAST = recastInjection();

        if (!this.isSupported()) {
            Logger.Error("RecastJS is not available. Please make sure you included the js file.");
            return;
        }
        this.check();
    }

    createMavMesh(mesh: AbstractMesh): void {
        var rc = new this.bjsRECAST.rcConfig();
        this.navMesh = new this.bjsRECAST.NavMesh();
        var meshIndices = mesh.getIndices();
        var positions = mesh.getVerticesData('position');	
        this.navMesh.build(positions, mesh.getTotalVertices(), meshIndices, mesh.getTotalIndices(), rc);
    }

    createDebugNavMesh(scene: Scene): Mesh {
        var tri: number;
        var pt: number;
        var debugNavMesh = this.navMesh.getDebugNavMesh();
        let triangleCount = debugNavMesh.getTriangleCount();

        var indices = [];
        var positions = [];
        for (tri = 0; tri < triangleCount*3; tri++) 
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

    getClosestPoint(position: Vector3) : Vector3
    {
        var p = new this.bjsRECAST.Vec3(position.x, position.y, position.z);
        var ret = this.navMesh.getClosestPoint(p);
        var pr = new Vector3(ret.x, ret.y, ret.z);
        return pr;
    }

    createCrowd(maxAgents: number, maxAgentRadius: number, scene: Scene) : ICrowd
    {
        var crowd = new RecastJSCrowd(this, maxAgents, maxAgentRadius);
        scene.addCrowd(crowd);
        return crowd;
    }

    /**
     * Disposes
     */
    public dispose() {
        // Dispose of world
    }

    public check() {
    }

    public isSupported(): boolean {
        return this.bjsRECAST !== undefined;
    }
}

export class RecastJSCrowd implements ICrowd {
    public bjsRECASTPlugin: RecastJSPlugin;
    public recastCrowd: any = {};
    public transforms:TransformNode[];
    public agents:number[];
    public constructor(plugin: RecastJSPlugin, maxAgents: number, maxAgentRadius: number) {
        this.bjsRECASTPlugin = plugin;
        this.recastCrowd = new this.bjsRECASTPlugin.bjsRECAST.Crowd(maxAgents, maxAgentRadius, this.bjsRECASTPlugin.navMesh.getNavMesh());
        this.transforms = new Array<TransformNode>();
        this.agents = new Array<number>();
    }

    addAgent(pos: Vector3, transform:TransformNode): number
    {
        var agentParams = new this.bjsRECASTPlugin.bjsRECAST.dtCrowdAgentParams();
        agentParams.radius = 0.1;
        agentParams.height = 0.1;
        agentParams.maxAcceleration = 1.0;
        agentParams.maxSpeed = 1.0;
        agentParams.collisionQueryRange = 1.0;
        agentParams.pathOptimizationRange = 1.0;
        agentParams.separationWeight = 1.0;
        agentParams.updateFlags = 7;
        agentParams.obstacleAvoidanceType = 0;
        agentParams.queryFilterType = 0;
        agentParams.userData = 0;

        var agentIndex = this.recastCrowd.addAgent(new this.bjsRECASTPlugin.bjsRECAST.Vec3(pos.x, pos.y, pos.z), agentParams);
        this.transforms.push(transform);
        this.agents.push(agentIndex);
        return agentIndex;
    }

    getAgentPosition(index: number): Vector3 {
        var agentPos = this.recastCrowd.getAgentPosition(index);
        return new Vector3(agentPos.x, agentPos.y, agentPos.z);
    }

    agentGoto(index: number, destination: Vector3): void {
        this.recastCrowd.agentGoto(index, new this.bjsRECASTPlugin.bjsRECAST.Vec3(destination.x, destination.y, destination.z));
    }

    removeAgent(index: number): void {
        this.recastCrowd.removeAgent(index);
    }

    update(deltaTime: number): void {
        // update crowd
        this.recastCrowd.update(deltaTime);

        // update transforms
        var index:number;
        for (index = 0; index < this.agents.length; index++) 
        {
            this.transforms[index].position = this.getAgentPosition(this.agents[index]);
        }
    }
}