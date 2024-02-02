import type { Vector3, Quaternion } from "../../Maths/math.vector";
import type { IRaycastQuery, PhysicsRaycastResult } from "../physicsRaycastResult";
import type { PhysicsBody } from "./physicsBody";
import type { PhysicsShape } from "./physicsShape";
import type { PhysicsConstraint } from "./physicsConstraint";
import type { BoundingBox } from "../../Culling/boundingBox";
import type { TransformNode } from "../../Meshes/transformNode";
import type { PhysicsMaterial } from "./physicsMaterial";
import type { Mesh } from "../../Meshes/mesh";
import type { Nullable } from "core/types";
import type { Observable } from "core/Misc/observable";

/** How a specific axis can be constrained */
export enum PhysicsConstraintAxisLimitMode {
    /*
     * The axis is not restricted at all
     */
    FREE,
    /*
     * The axis has a minimum/maximum limit
     */
    LIMITED,
    /*
     * The axis allows no relative movement of the pivots
     */
    LOCKED,
}

/** The constraint specific axis to use when setting Friction, `ConstraintAxisLimitMode`, max force, ... */
export enum PhysicsConstraintAxis {
    /*
     * Translation along the primary axis of the constraint (i.e. the
     * direction specified by PhysicsConstraintParameters.axisA/axisB)
     */
    LINEAR_X,
    /*
     * Translation along the second axis of the constraint (i.e. the
     * direction specified by PhysicsConstraintParameters.perpAxisA/perpAxisB)
     */
    LINEAR_Y,
    /*
     * Translation along the third axis of the constraint. This axis is
     * computed from the cross product of axisA/axisB and perpAxisA/perpAxisB)
     */
    LINEAR_Z,
    /*
     * Rotation around the primary axis of the constraint (i.e. the
     * axis specified by PhysicsConstraintParameters.axisA/axisB)
     */
    ANGULAR_X,
    /*
     * Rotation around the second axis of the constraint (i.e. the
     * axis specified by PhysicsConstraintParameters.perpAxisA/perpAxisB)
     */
    ANGULAR_Y,
    /*
     * Rotation around the third axis of the constraint. This axis is
     * computed from the cross product of axisA/axisB and perpAxisA/perpAxisB)
     */
    ANGULAR_Z,
    /*
     * A 3D distance limit; similar to specifying the LINEAR_X/Y/Z axes
     * individually, but the distance calculation uses all three axes
     * simultaneously, instead of individually.
     */
    LINEAR_DISTANCE,
}

/** Type of Constraint */
export enum PhysicsConstraintType {
    /**
     * A ball and socket constraint will attempt to line up the pivot
     * positions in each body, and have no restrictions on rotation
     */
    BALL_AND_SOCKET = 1,
    /**
     * A distance constraint will attempt to keep the pivot locations
     * within a specified distance.
     */
    DISTANCE = 2,
    /**
     * A hinge constraint will keep the pivot positions aligned as well
     * as two angular axes. The remaining angular axis will be free to rotate.
     */
    HINGE = 3,
    /**
     * A slider constraint allows bodies to translate along one axis and
     * rotate about the same axis. The remaining two axes are locked in
     * place
     */
    SLIDER = 4,
    /**
     * A lock constraint will attempt to keep the pivots completely lined
     * up between both bodies, allowing no relative movement.
     */
    LOCK = 5,
    /*
     * A prismatic will lock the rotations of the bodies, and allow translation
     * only along one axis
     */
    PRISMATIC = 6,
    /*
     * A generic constraint; this starts with no limits on how the bodies can
     * move relative to each other, but limits can be added via the PhysicsConstraint
     * interfaces. This can be used to specify a large variety of constraints
     */
    SIX_DOF = 7,
}

/** Type of Shape */
export enum PhysicsShapeType {
    SPHERE,
    CAPSULE,
    CYLINDER,
    BOX,
    CONVEX_HULL,
    CONTAINER,
    MESH,
    HEIGHTFIELD,
}

/** Optional motor which attempts to move a body at a specific velocity, or at a specific position */
export enum PhysicsConstraintMotorType {
    NONE,
    VELOCITY,
    POSITION,
}

export enum PhysicsEventType {
    COLLISION_STARTED = "COLLISION_STARTED",
    COLLISION_CONTINUED = "COLLISION_CONTINUED",
    COLLISION_FINISHED = "COLLISION_FINISHED",
    TRIGGER_ENTERED = "TRIGGER_ENTERED",
    TRIGGER_EXITED = "TRIGGER_EXITED",
}

/**
 * Base collision object
 */
export interface IBasePhysicsCollisionEvent {
    /**
     * 1st physics body that collided
     */
    collider: PhysicsBody;
    /**
     * 2nd physics body that collided
     */
    collidedAgainst: PhysicsBody;
    /**
     * index in instances array for the collider
     */
    colliderIndex: number;
    /**
     * index in instances array for the collidedAgainst
     */
    collidedAgainstIndex: number;
    /**
     * Event type
     */
    type: PhysicsEventType;
}

/**
 * Collision object that is the parameter when notification for collision fires.
 */
export interface IPhysicsCollisionEvent extends IBasePhysicsCollisionEvent {
    /**
     * World position where the collision occured
     */
    point: Nullable<Vector3>;
    /**
     * Penetration distance
     */
    distance: number;
    /**
     * Impulse value computed by the solver response
     */
    impulse: number;
    /**
     * Collision world normal direction
     */
    normal: Nullable<Vector3>;
}

/**
 * Parameters used to describe the Shape
 */
export interface PhysicsShapeParameters {
    /**
     * Shape center position
     */
    center?: Vector3;
    /**
     * Radius for cylinder, shape and capsule
     */
    radius?: number;
    /**
     * First point position that defines the cylinder or capsule
     */
    pointA?: Vector3;
    /**
     * Second point position that defines the cylinder or capsule
     */
    pointB?: Vector3;
    /**
     * Shape orientation
     */
    rotation?: Quaternion;
    /**
     * Dimesion extention for the box
     */
    extents?: Vector3;
    /**
     * Mesh used for Mesh shape or convex hull. It can be different than the mesh the body is attached to.
     */
    mesh?: Mesh;
    /**
     * Use children hierarchy
     */
    includeChildMeshes?: boolean;
    /**
     * The size of the heightfield in the X axis
     */
    heightFieldSizeX?: number;
    /**
     * The size of the heightfield in the Z axis
     */
    heightFieldSizeZ?: number;
    /**
     * The number of samples along the X axis
     */
    numHeightFieldSamplesX?: number;
    /**
     * The number of samples along the Z axis
     */
    numHeightFieldSamplesZ?: number;
    /**
     * The data for the heightfield
     */
    heightFieldData?: Float32Array;
}

/**
 * Parameters used to describe a Constraint
 */
export interface PhysicsConstraintParameters {
    /**
     * Location of the constraint pivot in the space of first body
     */
    pivotA?: Vector3;
    /**
     * Location of the constraint pivot in the space of the second body
     */
    pivotB?: Vector3;
    /**
     * An axis in the space of the first body which determines how
     * distances/angles are measured for LINEAR_X/ANGULAR_X limits.
     */
    axisA?: Vector3;
    /**
     * An axis in the space of the second body which determines how
     * distances/angles are measured for LINEAR_X/ANGULAR_X limits.
     */
    axisB?: Vector3;

    /**
     * An axis in the space of the first body which determines how
     * distances/angles are measured for LINEAR_Y/ANGULAR_Y limits.
     */
    perpAxisA?: Vector3;

    /**
     * An axis in the space of the second body which determines how
     * distances/angles are measured for LINEAR_Y/ANGULAR_Y limits.
     */
    perpAxisB?: Vector3;

    /**
     * The maximum distance that can seperate the two pivots.
     * Only used for DISTANCE constraints
     */
    maxDistance?: number;

    /**
     * Determines if the connected bodies should collide. Generally,
     * it is preferable to set this to false, especially if the constraint
     * positions the bodies so that they overlap. Otherwise, the constraint
     * will "fight" the collision detection and may cause jitter.
     */
    collision?: boolean;
}

/**
 * Parameters used to describe mass and inertia of the Physics Body
 */
export interface PhysicsMassProperties {
    /**
     * The center of mass, in local space. This is The
     * point the body will rotate around when applying
     * an angular velocity.
     *
     * If not provided, the physics engine will compute
     * an appropriate value.
     */
    centerOfMass?: Vector3;
    /**
     * The total mass of this object, in kilograms. This
     * affects how easy it is to move the body. A value
     * of zero will be used as an infinite mass.
     *
     * If not provided, the physics engine will compute
     * an appropriate value.
     */
    mass?: number;
    /**
     * The principal moments of inertia of this object
     * for a unit mass. This determines how easy it is
     * for the body to rotate. A value of zero on any
     * axis will be used as infinite interia about that
     * axis.
     *
     * If not provided, the physics engine will compute
     * an appropriate value.
     */
    inertia?: Vector3;
    /**
     * The rotation rotating from inertia major axis space
     * to parent space (i.e., the rotation which, when
     * applied to the 3x3 inertia tensor causes the inertia
     * tensor to become a diagonal matrix). This determines
     * how the values of inertia are aligned with the parent
     * object.
     *
     * If not provided, the physics engine will compute
     * an appropriate value.
     */
    inertiaOrientation?: Quaternion;
}

/**
 * Indicates how the body will behave.
 */
export enum PhysicsMotionType {
    STATIC,
    ANIMATED,
    DYNAMIC,
}

/**
 * Represents a pair of bodies connected by a constraint.
 */
export type ConstrainedBodyPair = { parentBody: PhysicsBody; parentBodyIndex: number; childBody: PhysicsBody; childBodyIndex: number };

/** @internal */
export interface IPhysicsEnginePluginV2 {
    /**
     * Physics plugin world instance
     */
    world: any;
    /**
     * Physics plugin name
     */
    name: string;

    /**
     * Collision observable
     */
    onCollisionObservable: Observable<IPhysicsCollisionEvent>;
    /**
     * Collision ended observable
     */
    onCollisionEndedObservable: Observable<IBasePhysicsCollisionEvent>;
    /**
     * Trigger observable
     */
    onTriggerCollisionObservable: Observable<IBasePhysicsCollisionEvent>;

    setGravity(gravity: Vector3): void;
    setTimeStep(timeStep: number): void;
    getTimeStep(): number;
    executeStep(delta: number, bodies: Array<PhysicsBody>): void; //not forgetting pre and post events
    getPluginVersion(): number;

    // body
    initBody(body: PhysicsBody, motionType: PhysicsMotionType, position: Vector3, orientation: Quaternion): void;
    initBodyInstances(body: PhysicsBody, motionType: PhysicsMotionType, mesh: Mesh): void;
    updateBodyInstances(body: PhysicsBody, mesh: Mesh): void;
    removeBody(body: PhysicsBody): void;
    sync(body: PhysicsBody): void;
    syncTransform(body: PhysicsBody, transformNode: TransformNode): void;
    setShape(body: PhysicsBody, shape: Nullable<PhysicsShape>): void;
    getShape(body: PhysicsBody): Nullable<PhysicsShape>;
    getShapeType(shape: PhysicsShape): PhysicsShapeType;
    setEventMask(body: PhysicsBody, eventMask: number, instanceIndex?: number): void;
    getEventMask(body: PhysicsBody, instanceIndex?: number): number;
    setMotionType(body: PhysicsBody, motionType: PhysicsMotionType, instanceIndex?: number): void;
    getMotionType(body: PhysicsBody, instanceIndex?: number): PhysicsMotionType;
    computeMassProperties(body: PhysicsBody, instanceIndex?: number): PhysicsMassProperties;
    setMassProperties(body: PhysicsBody, massProps: PhysicsMassProperties, instanceIndex?: number): void;
    getMassProperties(body: PhysicsBody, instanceIndex?: number): PhysicsMassProperties;
    setLinearDamping(body: PhysicsBody, damping: number, instanceIndex?: number): void;
    getLinearDamping(body: PhysicsBody, instanceIndex?: number): number;
    setAngularDamping(body: PhysicsBody, damping: number, instanceIndex?: number): void;
    getAngularDamping(body: PhysicsBody, instanceIndex?: number): number;
    setLinearVelocity(body: PhysicsBody, linVel: Vector3, instanceIndex?: number): void;
    getLinearVelocityToRef(body: PhysicsBody, linVel: Vector3, instanceIndex?: number): void;
    applyImpulse(body: PhysicsBody, impulse: Vector3, location: Vector3, instanceIndex?: number): void;
    applyForce(body: PhysicsBody, force: Vector3, location: Vector3, instanceIndex?: number): void;
    setAngularVelocity(body: PhysicsBody, angVel: Vector3, instanceIndex?: number): void;
    getAngularVelocityToRef(body: PhysicsBody, angVel: Vector3, instanceIndex?: number): void;
    getBodyGeometry(body: PhysicsBody): {};
    disposeBody(body: PhysicsBody): void;
    setCollisionCallbackEnabled(body: PhysicsBody, enabled: boolean, instanceIndex?: number): void;
    setCollisionEndedCallbackEnabled(body: PhysicsBody, enabled: boolean, instanceIndex?: number): void;
    addConstraint(body: PhysicsBody, childBody: PhysicsBody, constraint: PhysicsConstraint, instanceIndex?: number, childInstanceIndex?: number): void;
    getCollisionObservable(body: PhysicsBody, instanceIndex?: number): Observable<IPhysicsCollisionEvent>;
    getCollisionEndedObservable(body: PhysicsBody, instanceIndex?: number): Observable<IBasePhysicsCollisionEvent>;
    setGravityFactor(body: PhysicsBody, factor: number, instanceIndex?: number): void;
    getGravityFactor(body: PhysicsBody, instanceIndex?: number): number;
    setTargetTransform(body: PhysicsBody, position: Vector3, rotation: Quaternion, instanceIndex?: number): void;

    // shape
    initShape(shape: PhysicsShape, type: PhysicsShapeType, options: PhysicsShapeParameters): void;
    setShapeFilterMembershipMask(shape: PhysicsShape, membershipMask: number): void;
    getShapeFilterMembershipMask(shape: PhysicsShape): number;
    setShapeFilterCollideMask(shape: PhysicsShape, collideMask: number): void;
    getShapeFilterCollideMask(shape: PhysicsShape): number;
    setMaterial(shape: PhysicsShape, material: PhysicsMaterial): void;
    getMaterial(shape: PhysicsShape): PhysicsMaterial;
    setDensity(shape: PhysicsShape, density: number): void;
    getDensity(shape: PhysicsShape): number;
    addChild(shape: PhysicsShape, newChild: PhysicsShape, translation?: Vector3, rotation?: Quaternion, scale?: Vector3): void;
    removeChild(shape: PhysicsShape, childIndex: number): void;
    getNumChildren(shape: PhysicsShape): number;
    getBoundingBox(shape: PhysicsShape): BoundingBox;
    disposeShape(shape: PhysicsShape): void;
    setTrigger(shape: PhysicsShape, isTrigger: boolean): void;

    // constraint
    initConstraint(constraint: PhysicsConstraint, body: PhysicsBody, childBody: PhysicsBody): void;
    setEnabled(constraint: PhysicsConstraint, isEnabled: boolean): void;
    getEnabled(constraint: PhysicsConstraint): boolean;
    setCollisionsEnabled(constraint: PhysicsConstraint, isEnabled: boolean): void;
    getCollisionsEnabled(constraint: PhysicsConstraint): boolean;
    setAxisFriction(constraint: PhysicsConstraint, axis: PhysicsConstraintAxis, friction: number): void;
    getAxisFriction(constraint: PhysicsConstraint, axis: PhysicsConstraintAxis): Nullable<number>;
    setAxisMode(constraint: PhysicsConstraint, axis: PhysicsConstraintAxis, limitMode: PhysicsConstraintAxisLimitMode): void;
    getAxisMode(constraint: PhysicsConstraint, axis: PhysicsConstraintAxis): Nullable<PhysicsConstraintAxisLimitMode>;
    setAxisMinLimit(constraint: PhysicsConstraint, axis: PhysicsConstraintAxis, minLimit: number): void;
    getAxisMinLimit(constraint: PhysicsConstraint, axis: PhysicsConstraintAxis): Nullable<number>;
    setAxisMaxLimit(constraint: PhysicsConstraint, axis: PhysicsConstraintAxis, limit: number): void;
    getAxisMaxLimit(constraint: PhysicsConstraint, axis: PhysicsConstraintAxis): Nullable<number>;
    setAxisMotorType(constraint: PhysicsConstraint, axis: PhysicsConstraintAxis, motorType: PhysicsConstraintMotorType): void;
    getAxisMotorType(constraint: PhysicsConstraint, axis: PhysicsConstraintAxis): Nullable<PhysicsConstraintMotorType>;
    setAxisMotorTarget(constraint: PhysicsConstraint, axis: PhysicsConstraintAxis, target: number): void;
    getAxisMotorTarget(constraint: PhysicsConstraint, axis: PhysicsConstraintAxis): Nullable<number>;
    setAxisMotorMaxForce(constraint: PhysicsConstraint, axis: PhysicsConstraintAxis, maxForce: number): void;
    getAxisMotorMaxForce(constraint: PhysicsConstraint, axis: PhysicsConstraintAxis): Nullable<number>;
    disposeConstraint(constraint: PhysicsConstraint): void;
    getBodiesUsingConstraint(constraint: PhysicsConstraint): ConstrainedBodyPair[];

    // raycast
    raycast(from: Vector3, to: Vector3, result: PhysicsRaycastResult, query?: IRaycastQuery): void;

    dispose(): void;
}
