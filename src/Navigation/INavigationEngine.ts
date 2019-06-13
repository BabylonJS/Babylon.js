import { TransformNode } from "../Meshes/transformNode";
import { Vector3 } from "../Maths/math";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import { Scene } from "../scene";


/** @hidden */
export interface INavigationEnginePlugin {
    name: string;
    createMavMesh(mesh: AbstractMesh): void;
    createDebugNavMesh(scene: Scene): Mesh;
    getClosestPoint(position: Vector3): Vector3;
    dispose(): void;
    isSupported(): boolean;
    check(): void;

    createCrowd(maxAgents: number, maxAgentRadius: number, scene: Scene) : ICrowd;
}

/**
 * Interface used to define a navigation engine
 */
export interface INavigationEngine {
    
    /**
     * Release all resources
     */
    dispose(): void;

    /**
     * Builds a navmesh from a mesh
     */
    createMavMesh(mesh: AbstractMesh): void;
    createDebugNavMesh(scene: Scene): Mesh;
    getClosestPoint(position: Vector3): Vector3;
    check(): void;

    createCrowd(maxAgents: number, maxAgentRadius: number, scene: Scene) : ICrowd;
}

export interface ICrowd {
    addAgent(pos: Vector3, transform:TransformNode): number;
    getAgentPosition(index: number): Vector3
	removeAgent(index:number): void;
    update(deltaTime: number): void;
    agentGoto(index: number, destination: Vector3): void;
}