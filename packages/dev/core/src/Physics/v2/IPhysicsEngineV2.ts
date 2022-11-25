import type { Vector3, Quaternion } from "../../Maths/math.vector";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import type { PhysicsRaycastResult } from "../physicsRaycastResult";
import type { PhysicsBody } from "./physicsBody";
import type { PhysicsShape } from "./physicsShape";
import type { PhysicsConstraint } from "./physicsConstraint";
import type { BoundingBox } from "../../Culling/boundingBox";
import type { TransformNode } from "../../Meshes/transformNode";
import type { PhysicsMaterial } from "./physicsMaterial";
//import type { PhysicsAggregate } from "./physicsAggregate";

export enum ConstraintAxisLimitMode {
    FREE,
    LIMITED,
    LOCKED,
    NONE,
}

export enum ConstraintAxis {
    LINEAR_X,
    LINEAR_Y,
    LINEAR_Z,
    ANGULAR_X,
    ANGULAR_Y,
    ANGULAR_Z,
    LINEAR_DISTANCE,
}
export enum ConstraintType {
    BALL_AND_SOCKET,
    DISTANCE,
    HINGE,
    SLIDER,
    LOCK,
}

export enum ShapeType {
    SPHERE,
    CAPSULE,
    CYLINDER,
    BOX,
    CONVEX_HULL,
    CONTAINER,
    MESH,
}

export enum ConstraintMotorType {
    NONE,
    VELOCITY,
    POSITION,
}

export interface PhysicsShapeParameters {
    center?: Vector3;
    radius?: number;
    pointA?: Vector3;
    pointB?: Vector3;
    rotation?: Quaternion;
    extents?: Vector3;
    mesh?: AbstractMesh;
}

export interface PhysicsConstraintParameters {
    pivotA?: Vector3;
    pivotB?: Vector3;
    axisA?: Vector3;
    axisB?: Vector3;
}

/**
 *
 */
export interface MassProperties {
    /**
     *
     */
    centerOfMass: Vector3;
    /**
     *
     */
    mass: number;
    /**
     *
     */
    intertia: Vector3;
    /**
     *
     */
    inertiaOrientation: Quaternion;
}

/** @internal */
export interface IPhysicsEnginePluginV2 {
    /**
     *
     */
    world: any;
    /**
     *
     */
    name: string;
    setGravity(gravity: Vector3): void;
    setTimeStep(timeStep: number): void;
    getTimeStep(): number;
    executeStep(delta: number): void; //not forgetting pre and post events

    // body
    initBody(body: PhysicsBody): void;
    setShape(body: PhysicsBody, shape: PhysicsShape): void;
    getShape(body: PhysicsBody): PhysicsShape;
    setFilterGroup(body: PhysicsBody, group: number): void;
    getFilterGroup(body: PhysicsBody): number;
    setEventMask(body: PhysicsBody, eventMask: number): void;
    getEventMask(body: PhysicsBody): number;
    setMassProperties(body: PhysicsBody, massProps: MassProperties): void;
    getMassProperties(body: PhysicsBody): MassProperties;
    setLinearDamping(body: PhysicsBody, damping: number): void;
    getLinearDamping(body: PhysicsBody): number;
    setAngularDamping(body: PhysicsBody, damping: number): void;
    getAngularDamping(body: PhysicsBody): number;
    setLinearVelocity(body: PhysicsBody, linVel: Vector3): void;
    getLinearVelocity(body: PhysicsBody): Vector3;
    applyImpulse(body: PhysicsBody, location: Vector3, impulse: Vector3): void;
    setAngularVelocity(body: PhysicsBody, angVel: Vector3): void;
    getAngularVelocity(body: PhysicsBody): Vector3;
    disposeBody(body: PhysicsBody): void;

    // shape
    initShape(shape: PhysicsShape, type: ShapeType, options: PhysicsShapeParameters): void;
    setFilterLayer(shape: PhysicsShape, layer: number): void;
    getFilterLayer(shape: PhysicsShape): number;
    setMaterial(shape: PhysicsShape, material: PhysicsMaterial): void;
    getMaterial(shape: PhysicsShape): PhysicsMaterial;
    setDensity(shape: PhysicsShape, density: number): void;
    getDensity(shape: PhysicsShape): number;
    addChild(shape: PhysicsShape, newChild: PhysicsShape, childTransform: TransformNode): void;
    removeChild(shape: PhysicsShape, childIndex: number): void;
    getNumChildren(shape: PhysicsShape): number;
    getBoundingBox(shape: PhysicsShape): BoundingBox;
    disposeShape(shape: PhysicsShape): void;

    // material
    initMaterial(material: PhysicsMaterial): void;
    setFriction(material: PhysicsMaterial, friction: number): void;
    getFriction(material: PhysicsMaterial): number;
    setRestitution(material: PhysicsMaterial, restitution: number): void;
    getRestitution(material: PhysicsMaterial): number;
    disposeMaterial(material: PhysicsMaterial): void;

    // constraint
    initConstraint(constraint: PhysicsConstraint, type: ConstraintType, options: PhysicsConstraintParameters): void;
    setParentBody(constraint: PhysicsConstraint, body: PhysicsBody): void;
    getParentBody(constraint: PhysicsConstraint): PhysicsBody;
    setChildBody(constraint: PhysicsConstraint, body: PhysicsBody): void;
    getChildBody(constraint: PhysicsConstraint): PhysicsBody;
    setAnchorInParent(constraint: PhysicsConstraint, pivot: Vector3, axisX: Vector3, axisY: Vector3): void;
    setAnchorInChild(constraint: PhysicsConstraint, pivot: Vector3, axisX: Vector3, axisY: Vector3): void;
    setEnabled(constraint: PhysicsConstraint, isEnabled: boolean): void;
    getEnabled(constraint: PhysicsConstraint): boolean;
    setCollisionsEnabled(constraint: PhysicsConstraint, isEnabled: boolean): void;
    getCollisionsEnabled(constraint: PhysicsConstraint): boolean;
    setAxisFriction(constraint: PhysicsConstraint, axis: ConstraintAxis, friction: number): void;
    getAxisFriction(constraint: PhysicsConstraint, axis: ConstraintAxis): number;
    setAxisMode(constraint: PhysicsConstraint, axis: ConstraintAxis, limitMode: ConstraintAxisLimitMode): void;
    getAxisMode(constraint: PhysicsConstraint, axis: ConstraintAxis): ConstraintAxisLimitMode;
    setAxisMinLimit(constraint: PhysicsConstraint, axis: ConstraintAxis, minLimit: number): void;
    getAxisMinLimit(constraint: PhysicsConstraint, axis: ConstraintAxis): number;
    setAxisMaxLimit(constraint: PhysicsConstraint, axis: ConstraintAxis, limit: number): void;
    getAxisMaxLimit(constraint: PhysicsConstraint, axis: ConstraintAxis): number;
    setAxisMotorType(constraint: PhysicsConstraint, axis: ConstraintAxis, motorType: ConstraintMotorType): void;
    getAxisMotorType(constraint: PhysicsConstraint, axis: ConstraintAxis): ConstraintMotorType;
    setAxisMotorTarget(constraint: PhysicsConstraint, axis: ConstraintAxis, target: number): void;
    getAxisMotorTarget(constraint: PhysicsConstraint, axis: ConstraintAxis): number;
    setAxisMotorMaxForce(constraint: PhysicsConstraint, axis: ConstraintAxis, maxForce: number): void;
    getAxisMotorMaxForce(constraint: PhysicsConstraint, axis: ConstraintAxis): number;
    disposeConstraint(constraint: PhysicsConstraint): void;

    // raycast
    raycast(from: Vector3, to: Vector3): PhysicsRaycastResult;

    dispose(): void;
}

/**
 * Interface used to define a physics engine
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine
 */
export interface IPhysicsEngine2 {
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

    // Helpers
    /*getBodies(): Array<PhysicsBody>;
    addAggregate(impostor: PhysicsAggregate): void;
    removeAggregate(impostor: PhysicsAggregate): void;
*/
    /**
     * Gets the current plugin used to run the simulation
     * @returns current plugin
     */
    getPhysicsPlugin(): IPhysicsEnginePlugin2;

    //****************************************************************************

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