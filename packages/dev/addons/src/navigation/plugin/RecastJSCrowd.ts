import type { Crowd } from "@recast-navigation/core";

import type { Nullable } from "core/types";
import type { IVector3Like } from "core/Maths/math.like";
import type { TransformNode } from "core/Meshes/transformNode";
import type { ICrowd } from "core/Navigation/INavigationEngine";
import { Vector3 } from "core/Maths/math.vector";
import { Epsilon } from "core/Maths/math.constants";
import type { Observer } from "core/Misc/observable";
import { Observable } from "core/Misc/observable";
import type { Scene } from "core/scene";

import type { RecastNavigationJSPluginV2 } from "./RecastNavigationJSPlugin";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import { ToCrowdAgentParams } from "../common/config";
import type { IAgentParametersV2 } from "../types";
import { GetRecast } from "../factory/common";

/**
 * Recast Detour crowd implementation
 * This class provides methods to manage a crowd of agents, allowing them to navigate a navigation mesh.
 * It supports adding agents, updating their parameters, moving them to destinations, and checking their states.
 * The crowd is updated in the scene's animation loop, and it notifies observers when agents reach their destinations.
 */
export class RecastJSCrowd implements ICrowd {
    /**
     * Recast plugin
     */
    public get navigationPlugin(): RecastNavigationJSPluginV2 {
        return this._navigationPlugin;
    }

    /**
     * Link to the detour crowd
     */
    public get recastCrowd(): Crowd {
        return this._recastCrowd;
    }

    /**
     * One transform per agent
     */
    public get transforms(): TransformNode[] {
        return this._transforms;
    }

    /**
     * All agents created
     */
    public get agents(): readonly number[] {
        return Object.freeze(this._agents);
    }

    /**
     * Agents reach radius
     */
    public get reachRadii(): readonly number[] {
        return Object.freeze(this._reachRadii);
    }

    private _navigationPlugin: RecastNavigationJSPluginV2;
    private _recastCrowd: Crowd;
    private _transforms: TransformNode[] = [];
    private _agents: number[] = [];
    private _reachRadii: number[] = [];

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

    private _engine: AbstractEngine;

    /**
     * Observer for crowd updates
     */
    private _onBeforeAnimationsObserver: Nullable<Observer<Scene>> = null;

    /**
     * Fires each time an agent is in reach radius of its destination
     */
    public onReachTargetObservable = new Observable<{
        /**
         * The index of the agent that reached its target
         */
        agentIndex: number;
        /**
         * The destination that the agent reached
         */
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
    public constructor(plugin: RecastNavigationJSPluginV2, maxAgents: number, maxAgentRadius: number, scene: Scene) {
        this._navigationPlugin = plugin;

        if (!plugin.navMesh) {
            throw new Error("There is no NavMesh generated.");
        }

        this._recastCrowd = new (GetRecast().Crowd)(plugin.navMesh, {
            maxAgents,
            maxAgentRadius,
        });

        this._scene = scene;
        this._engine = scene.getEngine();

        this._onBeforeAnimationsObserver = scene.onBeforeAnimationsObservable.add(() => {
            this.update(this._engine.getDeltaTime() * 0.001 * plugin.timeFactor);
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
    public addAgent(pos: IVector3Like, parameters: IAgentParametersV2, transform: TransformNode): number {
        const agentParams = ToCrowdAgentParams(parameters);

        const agent = this._recastCrowd.addAgent({ x: pos.x, y: pos.y, z: pos.z }, agentParams);

        this._transforms.push(transform);
        this._agents.push(agent.agentIndex);
        this._reachRadii.push(parameters.reachRadius ? parameters.reachRadius : parameters.radius);
        this._agentDestinationArmed.push(false);
        this._agentDestination.push(new Vector3(0, 0, 0));

        return agent.agentIndex;
    }

    /**
     * Returns the agent position in world space
     * @param index agent index returned by addAgent
     * @returns world space position
     */
    public getAgentPosition(index: number): Vector3 {
        const agentPos = this._recastCrowd.getAgent(index)?.position() ?? Vector3.ZeroReadOnly;
        return new Vector3(agentPos.x, agentPos.y, agentPos.z);
    }

    /**
     * Returns the agent position result in world space
     * @param index agent index returned by addAgent
     * @param result output world space position
     */
    public getAgentPositionToRef(index: number, result: Vector3): void {
        const agentPos = this._recastCrowd.getAgent(index)?.position() ?? Vector3.ZeroReadOnly;
        result.set(agentPos.x, agentPos.y, agentPos.z);
    }

    /**
     * Returns the agent velocity in world space
     * @param index agent index returned by addAgent
     * @returns world space velocity
     */
    public getAgentVelocity(index: number): Vector3 {
        const agentVel = this._recastCrowd.getAgent(index)?.velocity() ?? Vector3.ZeroReadOnly;
        return new Vector3(agentVel.x, agentVel.y, agentVel.z);
    }

    /**
     * Returns the agent velocity result in world space
     * @param index agent index returned by addAgent
     * @param result output world space velocity
     */
    public getAgentVelocityToRef(index: number, result: Vector3): void {
        const agentVel = this._recastCrowd.getAgent(index)?.velocity() ?? Vector3.ZeroReadOnly;
        result.set(agentVel.x, agentVel.y, agentVel.z);
    }

    /**
     * Returns the agent next target point on the path
     * @param index agent index returned by addAgent
     * @returns world space position
     */
    public getAgentNextTargetPath(index: number): Vector3 {
        const pathTargetPos = this._recastCrowd.getAgent(index)?.nextTargetInPath() ?? Vector3.ZeroReadOnly;
        return new Vector3(pathTargetPos.x, pathTargetPos.y, pathTargetPos.z);
    }

    /**
     * Returns the agent next target point on the path
     * @param index agent index returned by addAgent
     * @param result output world space position
     */
    public getAgentNextTargetPathToRef(index: number, result: Vector3): void {
        const pathTargetPos = this._recastCrowd.getAgent(index)?.nextTargetInPath() ?? Vector3.ZeroReadOnly;
        result.set(pathTargetPos.x, pathTargetPos.y, pathTargetPos.z);
    }

    /**
     * Gets the agent state
     * @param index agent index returned by addAgent
     * @returns agent state, 0 = DT_CROWDAGENT_STATE_INVALID, 1 = DT_CROWDAGENT_STATE_WALKING, 2 = DT_CROWDAGENT_STATE_OFFMESH
     */
    public getAgentState(index: number): number {
        return this._recastCrowd.getAgent(index)?.state() ?? 0; // invalid
    }

    /**
     * returns true if the agent in over an off mesh link connection
     * @param index agent index returned by addAgent
     * @returns true if over an off mesh link connection
     */
    public overOffmeshConnection(index: number): boolean {
        return this._recastCrowd.getAgent(index)?.overOffMeshConnection() ?? false;
    }

    /**
     * Asks a particular agent to go to a destination. That destination is constrained by the navigation mesh
     * @param index agent index returned by addAgent
     * @param destination targeted world position
     */
    public agentGoto(index: number, destination: IVector3Like): void {
        this._recastCrowd.getAgent(index)?.requestMoveTarget(destination);

        // arm observer
        const item = this._agents.indexOf(index);
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
    public agentTeleport(index: number, destination: IVector3Like): void {
        this._recastCrowd.getAgent(index)?.teleport(destination);
    }

    /**
     * Update agent parameters
     * @param index agent index returned by addAgent
     * @param parameters agent parameters
     */
    public updateAgentParameters(index: number, parameters: IAgentParametersV2): void {
        const agent = this._recastCrowd.getAgent(index);
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
    public removeAgent(index: number): void {
        this._recastCrowd.removeAgent(index);

        const item = this._agents.indexOf(index);
        if (item > -1) {
            this._agents.splice(item, 1);
            this._transforms.splice(item, 1);
            this._reachRadii.splice(item, 1);
            this._agentDestinationArmed.splice(item, 1);
            this._agentDestination.splice(item, 1);
        }
    }

    /**
     * get the list of all agents attached to this crowd
     * @returns list of agent indices
     */
    public getAgents(): number[] {
        return this._agents;
    }

    /**
     * Tick update done by the Scene. Agent position/velocity/acceleration is updated by this function
     * @param deltaTime in seconds
     */
    public update(deltaTime: number): void {
        if (deltaTime <= Epsilon) {
            return;
        }

        // update crowd
        const timeStep = this._navigationPlugin.getTimeStep();
        const maxStepCount = this._navigationPlugin.getMaximumSubStepCount();
        if (timeStep <= Epsilon) {
            this._recastCrowd.update(deltaTime);
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
                this._recastCrowd.update(step);
            }
        }

        // update transforms
        for (let index = 0; index < this._agents.length; index++) {
            // update transform position
            const agentIndex = this._agents[index];
            const agentPosition = this.getAgentPosition(agentIndex);
            this._transforms[index].position = agentPosition;
            // check agent reach destination
            if (this._agentDestinationArmed[index]) {
                const dx = agentPosition.x - this._agentDestination[index].x;
                const dz = agentPosition.z - this._agentDestination[index].z;
                const radius = this._reachRadii[index];
                const groundY = this._agentDestination[index].y - this._reachRadii[index];
                const ceilingY = this._agentDestination[index].y + this._reachRadii[index];
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
        this._navigationPlugin.setDefaultQueryExtent(extent);
    }

    /**
     * Get the Bounding box extent specified by setDefaultQueryExtent
     * @returns the box extent values
     */
    getDefaultQueryExtent(): Vector3 {
        const p = this._navigationPlugin.getDefaultQueryExtent();
        return new Vector3(p.x, p.y, p.z);
    }

    /**
     * Get the Bounding box extent result specified by setDefaultQueryExtent
     * @param result output the box extent values
     */
    getDefaultQueryExtentToRef(result: Vector3): void {
        const p = this._navigationPlugin.getDefaultQueryExtent();
        result.set(p.x, p.y, p.z);
    }

    /**
     * Get the next corner points composing the path (max 4 points)
     * @param index agent index returned by addAgent
     * @returns array containing world position composing the path
     */
    public getCorners(index: number): Vector3[] {
        const corners = this._recastCrowd.getAgent(index)?.corners();
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
    public dispose(): void {
        this._recastCrowd.destroy();

        if (this._onBeforeAnimationsObserver) {
            this._scene.onBeforeAnimationsObservable.remove(this._onBeforeAnimationsObserver);
            this._onBeforeAnimationsObserver = null;
        }

        this.onReachTargetObservable.clear();
    }
}
