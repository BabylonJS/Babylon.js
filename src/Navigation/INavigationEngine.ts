//import { Nullable } from "../types";
//import { Vector3, Quaternion } from "../Maths/math";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import { Scene } from "../scene";


/** @hidden */
export interface INavigationEnginePlugin {
    name: string;
    createMavMesh(mesh: AbstractMesh): void;
    createDebugNavMesh(scene: Scene): Mesh;
    dispose(): void;
    isSupported(): boolean;
    check(): void;
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
    check(): void;
}
