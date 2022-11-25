//import type { Nullable } from "../types";
import type { Vector3 } from "../Maths/math.vector";
//import type { AbstractMesh } from "../Meshes/abstractMesh";
//import type { PhysicsImpostor, IPhysicsEnabledObject } from "./physicsImpostor";
//import type { PhysicsJoint, IMotorEnabledJoint } from "./physicsJoint";
import type { PhysicsRaycastResult } from "./physicsRaycastResult";

/**
 * Interface used to define a physics engine
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine
 */
export interface IPhysicsEngine {
    /**
     * Gets the gravity vector used by the simulation
     */
    gravity: Vector3;

    /**
     * Sets the gravity vector used by the simulation
     * @param gravity defines the gravity vector to use
     */
    setGravity(gravity: Vector3): void;

    /**
     * Set the time step of the physics engine.
     * Default is 1/60.
     * To slow it down, enter 1/600 for example.
     * To speed it up, 1/30
     * @param newTimeStep the new timestep to apply to this world.
     */
    setTimeStep(newTimeStep: number): void;

    /**
     * Get the time step of the physics engine.
     * @returns the current time step
     */
    getTimeStep(): number;

    /**
     * Set the sub time step of the physics engine.
     * Default is 0 meaning there is no sub steps
     * To increase physics resolution precision, set a small value (like 1 ms)
     * @param subTimeStep defines the new sub timestep used for physics resolution.
     */
    setSubTimeStep(subTimeStep: number): void;

    /**
     * Get the sub time step of the physics engine.
     * @returns the current sub time step
     */
    getSubTimeStep(): number;

    /**
     * Release all resources
     */
    dispose(): void;

    /**
     * Gets the name of the current physics plugin
     * @returns the name of the plugin
     */
    getPhysicsPluginName(): string;

    /**
     * Adding a new impostor for the impostor tracking.
     * This will be done by the impostor itself.
     * @param impostor the impostor to add
     */
    //addImpostor(impostor: PhysicsImpostor): void;

    /**
     * Remove an impostor from the engine.
     * This impostor and its mesh will not longer be updated by the physics engine.
     * @param impostor the impostor to remove
     */
    //removeImpostor(impostor: PhysicsImpostor): void;

    /**
     * Add a joint to the physics engine
     * @param mainImpostor defines the main impostor to which the joint is added.
     * @param connectedImpostor defines the impostor that is connected to the main impostor using this joint
     * @param joint defines the joint that will connect both impostors.
     */
    //addJoint(mainImpostor: PhysicsImpostor, connectedImpostor: PhysicsImpostor, joint: PhysicsJoint): void;

    /**
     * Removes a joint from the simulation
     * @param mainImpostor defines the impostor used with the joint
     * @param connectedImpostor defines the other impostor connected to the main one by the joint
     * @param joint defines the joint to remove
     */
    //removeJoint(mainImpostor: PhysicsImpostor, connectedImpostor: PhysicsImpostor, joint: PhysicsJoint): void;

    /**
     * Gets the current plugin used to run the simulation
     * @returns current plugin
     */
    getPhysicsPlugin(): any;

    /**
     * Gets the list of physic impostors
     * @returns an array of PhysicsImpostor
     */
    //getImpostors(): Array<PhysicsImpostor>;

    /**
     * Gets the impostor for a physics enabled object
     * @param object defines the object impersonated by the impostor
     * @returns the PhysicsImpostor or null if not found
     */
    //getImpostorForPhysicsObject(object: IPhysicsEnabledObject): Nullable<PhysicsImpostor>;

    /**
     * Gets the impostor for a physics body object
     * @param body defines physics body used by the impostor
     * @returns the PhysicsImpostor or null if not found
     */
    //getImpostorWithPhysicsBody(body: any): Nullable<PhysicsImpostor>;

    /**
     * Does a raycast in the physics world
     * @param from when should the ray start?
     * @param to when should the ray end?
     * @returns PhysicsRaycastResult
     */
    raycast(from: Vector3, to: Vector3): PhysicsRaycastResult;

    /**
     * Called by the scene. No need to call it.
     * @param delta defines the timespan between frames
     */
    _step(delta: number): void;
}
