import type { Nullable } from "../../types";
import { Vector3 } from "../../Maths/math.vector";
import type { IPhysicsEngine } from "../IPhysicsEngine";
import type { IPhysicsEnginePlugin } from "./IPhysicsEnginePlugin";
import { PhysicsRaycastResult } from "../physicsRaycastResult";
import { _WarnImport } from "../../Misc/devTools";

/**
 * Class used to control physics engine
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine
 */
/** @internal */
export class PhysicsEngine implements IPhysicsEngine {
    /** @internal */
    /**
     * Global value used to control the smallest number supported by the simulation
     */
    public static Epsilon = 0.001;

    //private _impostors: Array<PhysicsImpostor> = [];
    //private _joints: Array<PhysicsImpostorJoint> = [];
    private _subTimeStep: number = 0;
    //private _uniqueIdCounter = 0;

    /**
     * Gets the gravity vector used by the simulation
     */
    public gravity: Vector3;

    public getPluginVersion(): number {
        return this._physicsPlugin.getPluginVersion();
    }
    /**
     * Factory used to create the default physics plugin.
     * @returns The default physics plugin
     */
    public static DefaultPluginFactory(): IPhysicsEnginePlugin {
        throw _WarnImport("");
    }

    /**
     * Creates a new Physics Engine
     * @param gravity defines the gravity vector used by the simulation
     * @param _physicsPlugin defines the plugin to use (CannonJS by default)
     */
    constructor(gravity: Nullable<Vector3>, private _physicsPlugin: IPhysicsEnginePlugin = PhysicsEngine.DefaultPluginFactory()) {
        gravity = gravity || new Vector3(0, -9.807, 0);
        this.setGravity(gravity);
        this.setTimeStep();
    }

    /**
     * Sets the gravity vector used by the simulation
     * @param gravity defines the gravity vector to use
     */
    public setGravity(gravity: Vector3): void {
        this.gravity = gravity;
        this._physicsPlugin.setGravity(this.gravity);
    }

    /**
     * Set the time step of the physics engine.
     * Default is 1/60.
     * To slow it down, enter 1/600 for example.
     * To speed it up, 1/30
     * @param newTimeStep defines the new timestep to apply to this world.
     */
    public setTimeStep(newTimeStep: number = 1 / 60) {
        this._physicsPlugin.setTimeStep(newTimeStep);
    }

    /**
     * Get the time step of the physics engine.
     * @returns the current time step
     */
    public getTimeStep(): number {
        return this._physicsPlugin.getTimeStep();
    }

    /**
     * Set the sub time step of the physics engine.
     * Default is 0 meaning there is no sub steps
     * To increase physics resolution precision, set a small value (like 1 ms)
     * @param subTimeStep defines the new sub timestep used for physics resolution.
     */
    public setSubTimeStep(subTimeStep: number = 0) {
        this._subTimeStep = subTimeStep;
    }

    /**
     * Get the sub time step of the physics engine.
     * @returns the current sub time step
     */
    public getSubTimeStep() {
        return this._subTimeStep;
    }

    /**
     * Release all resources
     */
    public dispose(): void {
        this._physicsPlugin.dispose();
    }

    /**
     * Gets the name of the current physics plugin
     * @returns the name of the plugin
     */
    public getPhysicsPluginName(): string {
        return this._physicsPlugin.name;
    }

    /**
     * Adding a new impostor for the impostor tracking.
     * This will be done by the impostor itself.
     * @param impostor the impostor to add
     */

    /**
     * Called by the scene. No need to call it.
     * @param delta defines the timespan between frames
     */
    public _step(delta: number) {
        //check if any mesh has no body / requires an update
        /*this._impostors.forEach((impostor) => {
            if (impostor.isBodyInitRequired()) {
                this._physicsPlugin.generatePhysicsBody(impostor);
            }
        });
*/
        if (delta > 0.1) {
            delta = 0.1;
        } else if (delta <= 0) {
            delta = 1.0 / 60.0;
        }

        this._physicsPlugin.executeStep(delta);
    }

    /**
     * Gets the current plugin used to run the simulation
     * @returns current plugin
     */
    public getPhysicsPlugin(): IPhysicsEnginePlugin {
        return this._physicsPlugin;
    }

    /**
     * Does a raycast in the physics world
     * @param from when should the ray start?
     * @param to when should the ray end?
     * @param result resulting PhysicsRaycastResult
     */
    public raycastToRef(from: Vector3, to: Vector3, result: PhysicsRaycastResult): void {
        this._physicsPlugin.raycast(from, to, result);
    }

    /**
     * Does a raycast in the physics world
     * @param from when should the ray start?
     * @param to when should the ray end?
     * @returns PhysicsRaycastResult
     */
    public raycast(from: Vector3, to: Vector3): PhysicsRaycastResult {
        const result = new PhysicsRaycastResult();
        this._physicsPlugin.raycast(from, to, result);
        return result;
    }
}
