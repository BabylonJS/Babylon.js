import { Nullable } from "../types";
import { Vector3, Quaternion } from "../Maths/math.vector";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { PhysicsImpostor, IPhysicsEnabledObject } from "./physicsImpostor";
import { PhysicsJoint, IMotorEnabledJoint } from "./physicsJoint";
import { PhysicsRaycastResult } from "./physicsRaycastResult";

/**
 * Interface used to describe a physics joint
 */
export interface PhysicsImpostorJoint {
    /** Defines the main impostor to which the joint is linked */
    mainImpostor: PhysicsImpostor;
    /** Defines the impostor that is connected to the main impostor using this joint */
    connectedImpostor: PhysicsImpostor;
    /** Defines the joint itself */
    joint: PhysicsJoint;
}

/** @hidden */
export interface IPhysicsEnginePlugin {
    world: any;
    name: string;
    setGravity(gravity: Vector3): void;
    setTimeStep(timeStep: number): void;
    getTimeStep(): number;
    executeStep(delta: number, impostors: Array<PhysicsImpostor>): void; //not forgetting pre and post events
    applyImpulse(impostor: PhysicsImpostor, force: Vector3, contactPoint: Vector3): void;
    applyForce(impostor: PhysicsImpostor, force: Vector3, contactPoint: Vector3): void;
    generatePhysicsBody(impostor: PhysicsImpostor): void;
    removePhysicsBody(impostor: PhysicsImpostor): void;
    generateJoint(joint: PhysicsImpostorJoint): void;
    removeJoint(joint: PhysicsImpostorJoint): void;
    isSupported(): boolean;
    setTransformationFromPhysicsBody(impostor: PhysicsImpostor): void;
    setPhysicsBodyTransformation(impostor: PhysicsImpostor, newPosition: Vector3, newRotation: Quaternion): void;
    setLinearVelocity(impostor: PhysicsImpostor, velocity: Nullable<Vector3>): void;
    setAngularVelocity(impostor: PhysicsImpostor, velocity: Nullable<Vector3>): void;
    getLinearVelocity(impostor: PhysicsImpostor): Nullable<Vector3>;
    getAngularVelocity(impostor: PhysicsImpostor): Nullable<Vector3>;
    setBodyMass(impostor: PhysicsImpostor, mass: number): void;
    getBodyMass(impostor: PhysicsImpostor): number;
    getBodyFriction(impostor: PhysicsImpostor): number;
    setBodyFriction(impostor: PhysicsImpostor, friction: number): void;
    getBodyRestitution(impostor: PhysicsImpostor): number;
    setBodyRestitution(impostor: PhysicsImpostor, restitution: number): void;
    getBodyPressure?(impostor: PhysicsImpostor): number;
    setBodyPressure?(impostor: PhysicsImpostor, pressure: number): void;
    getBodyStiffness?(impostor: PhysicsImpostor): number;
    setBodyStiffness?(impostor: PhysicsImpostor, stiffness: number): void;
    getBodyVelocityIterations?(impostor: PhysicsImpostor): number;
    setBodyVelocityIterations?(impostor: PhysicsImpostor, velocityIterations: number): void;
    getBodyPositionIterations?(impostor: PhysicsImpostor): number;
    setBodyPositionIterations?(impostor: PhysicsImpostor, positionIterations: number): void;
    appendAnchor?(impostor: PhysicsImpostor, otherImpostor: PhysicsImpostor, width: number, height: number, influence: number, noCollisionBetweenLinkedBodies: boolean): void;
    appendHook?(impostor: PhysicsImpostor, otherImpostor: PhysicsImpostor, length: number, influence: number, noCollisionBetweenLinkedBodies: boolean): void;
    sleepBody(impostor: PhysicsImpostor): void;
    wakeUpBody(impostor: PhysicsImpostor): void;
    raycast(from: Vector3, to: Vector3): PhysicsRaycastResult;
    //Joint Update
    updateDistanceJoint(joint: PhysicsJoint, maxDistance: number, minDistance?: number): void;
    setMotor(joint: IMotorEnabledJoint, speed: number, maxForce?: number, motorIndex?: number): void;
    setLimit(joint: IMotorEnabledJoint, upperLimit: number, lowerLimit?: number, motorIndex?: number): void;
    getRadius(impostor: PhysicsImpostor): number;
    getBoxSizeToRef(impostor: PhysicsImpostor, result: Vector3): void;
    syncMeshWithImpostor(mesh: AbstractMesh, impostor: PhysicsImpostor): void;
    dispose(): void;
}

/**
 * Interface used to define a physics engine
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine
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
    setSubTimeStep(subTimeStep: number) : void;

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
    addImpostor(impostor: PhysicsImpostor): void;

    /**
     * Remove an impostor from the engine.
     * This impostor and its mesh will not longer be updated by the physics engine.
     * @param impostor the impostor to remove
     */
    removeImpostor(impostor: PhysicsImpostor): void;

    /**
     * Add a joint to the physics engine
     * @param mainImpostor defines the main impostor to which the joint is added.
     * @param connectedImpostor defines the impostor that is connected to the main impostor using this joint
     * @param joint defines the joint that will connect both impostors.
     */
    addJoint(mainImpostor: PhysicsImpostor, connectedImpostor: PhysicsImpostor, joint: PhysicsJoint): void;

    /**
     * Removes a joint from the simulation
     * @param mainImpostor defines the impostor used with the joint
     * @param connectedImpostor defines the other impostor connected to the main one by the joint
     * @param joint defines the joint to remove
     */
    removeJoint(mainImpostor: PhysicsImpostor, connectedImpostor: PhysicsImpostor, joint: PhysicsJoint): void;

    /**
     * Gets the current plugin used to run the simulation
     * @returns current plugin
     */
    getPhysicsPlugin(): IPhysicsEnginePlugin;

    /**
     * Gets the list of physic impostors
     * @returns an array of PhysicsImpostor
     */
    getImpostors(): Array<PhysicsImpostor>;

    /**
     * Gets the impostor for a physics enabled object
     * @param object defines the object impersonated by the impostor
     * @returns the PhysicsImpostor or null if not found
     */
    getImpostorForPhysicsObject(object: IPhysicsEnabledObject): Nullable<PhysicsImpostor>;

    /**
     * Gets the impostor for a physics body object
     * @param body defines physics body used by the impostor
     * @returns the PhysicsImpostor or null if not found
     */
    getImpostorWithPhysicsBody(body: any): Nullable<PhysicsImpostor>;

    /**
     * Does a raycast in the physics world
     * @param from when should the ray start?
     * @param to when should the ray end?
     * @returns PhysicsRaycastResult
     */
    raycast(from: Vector3, to: Vector3): PhysicsRaycastResult;

    /**
     * Called by the scene. No need to call it.
     * @param delta defines the timespam between frames
     */
    _step(delta: number): void;
}
