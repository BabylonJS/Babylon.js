import type { Vector3 } from "../Maths/math.vector";
import type { PhysicsRaycastResult } from "./physicsRaycastResult";
import type { IPhysicsEnginePlugin as IPhysicsEnginePluginV1 } from "./v1/IPhysicsEnginePlugin";
import type { IPhysicsEnginePlugin as IPhysicsEnginePluginV2 } from "./v2/IPhysicsEnginePlugin";

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
     *
     */
    getPluginVersion(): number;
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
     * Gets the current plugin used to run the simulation
     * @returns current plugin
     */
    getPhysicsPlugin(): IPhysicsEnginePluginV1 | IPhysicsEnginePluginV2 | null;

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
