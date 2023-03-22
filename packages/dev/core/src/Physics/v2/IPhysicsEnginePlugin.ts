import type { Vector3, Quaternion } from "../../Maths/math.vector";
import type { PhysicsRaycastResult } from "../physicsRaycastResult";
import type { PhysicsBody } from "./physicsBody";
import type { PhysicsShape } from "./physicsShape";
import type { PhysicsConstraint } from "./physicsConstraint";
import type { BoundingBox } from "../../Culling/boundingBox";
import type { TransformNode } from "../../Meshes/transformNode";
import type { PhysicsMaterial } from "./physicsMaterial";
import type { Mesh } from "../../Meshes/mesh";
import type { Nullable } from "core/types";
import type { Observable } from "core/Misc/observable";

/** @internal */
export enum ConstraintAxisLimitMode {
    FREE,
    LIMITED,
    LOCKED,
    NONE,
}

/** @internal */
export enum ConstraintAxis {
    LINEAR_X,
    LINEAR_Y,
    LINEAR_Z,
    ANGULAR_X,
    ANGULAR_Y,
    ANGULAR_Z,
    LINEAR_DISTANCE,
}

/** @internal */
export enum ConstraintType {
    BALL_AND_SOCKET = 1,
    DISTANCE = 2,
    HINGE = 3,
    SLIDER = 4,
    LOCK = 5,
    PRISMATIC = 6,
}

/** @internal */
export enum ShapeType {
    SPHERE,
    CAPSULE,
    CYLINDER,
    BOX,
    CONVEX_HULL,
    CONTAINER,
    MESH,
    HEIGHTFIELD,
}

/** @internal */
export enum ConstraintMotorType {
    NONE,
    VELOCITY,
    POSITION,
}

/**
 * Collision object that is the parameter when notification for collision fires.
 */
export interface IPhysicsCollisionEvent {
    /**
     * 1st physics body that collided
     */
    collider: PhysicsBody;
    /**
     * 2nd physics body that collided
     */
    collidedAgainst: PhysicsBody;
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

/** @internal */
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
     *
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
}

/** @internal */
export interface PhysicsConstraintParameters {
    /**
     * Pivot vector for 1st body
     */
    pivotA?: Vector3;
    /**
     * Pivot vector for 2nd body
     */
    pivotB?: Vector3;
    /**
     * Axis vector for 1st body
     */
    axisA?: Vector3;
    /**
     * Axis vector for 2nd body
     */
    axisB?: Vector3;
    /**
     * Maximum distance between both bodies
     */
    maxDistance?: number;
    /**
     * Can connected bodies collide?
     */
    collision?: boolean;
}

/**
 *
 */
/** @internal */
export interface MassProperties {
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

export enum PhysicsMotionType {
    STATIC,
    ANIMATED,
    DYNAMIC,
}

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
    onCollisionObservable: Observable<{
        collider: PhysicsBody;
        collidedAgainst: PhysicsBody;
        point: Nullable<Vector3>;
        distance: number;
        impulse: number;
        normal: Nullable<Vector3>;
    }>;

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
    addNodeShape(body: PhysicsBody, shapeNode: TransformNode): void;
    setShape(body: PhysicsBody, shape: PhysicsShape): void;
    getShape(body: PhysicsBody): PhysicsShape;
    getShapeType(shape: PhysicsShape): ShapeType;
    setFilterGroup(body: PhysicsBody, group: number): void;
    getFilterGroup(body: PhysicsBody): number;
    setEventMask(body: PhysicsBody, eventMask: number): void;
    getEventMask(body: PhysicsBody): number;
    setMotionType(body: PhysicsBody, motionType: PhysicsMotionType): void;
    getMotionType(body: PhysicsBody): PhysicsMotionType;
    computeMassProperties(body: PhysicsBody): MassProperties;
    setMassProperties(body: PhysicsBody, massProps: MassProperties): void;
    getMassProperties(body: PhysicsBody): MassProperties;
    setLinearDamping(body: PhysicsBody, damping: number): void;
    getLinearDamping(body: PhysicsBody): number;
    setAngularDamping(body: PhysicsBody, damping: number): void;
    getAngularDamping(body: PhysicsBody): number;
    setLinearVelocity(body: PhysicsBody, linVel: Vector3): void;
    getLinearVelocityToRef(body: PhysicsBody, linVel: Vector3): void;
    applyImpulse(body: PhysicsBody, impulse: Vector3, location: Vector3): void;
    applyForce(body: PhysicsBody, force: Vector3, location: Vector3): void;
    setAngularVelocity(body: PhysicsBody, angVel: Vector3): void;
    getAngularVelocityToRef(body: PhysicsBody, angVel: Vector3): void;
    getBodyGeometry(body: PhysicsBody): {};
    disposeBody(body: PhysicsBody): void;
    setCollisionCallbackEnabled(body: PhysicsBody, enabled: boolean): void;
    addConstraint(body: PhysicsBody, childBody: PhysicsBody, constraint: PhysicsConstraint): void;
    getCollisionObservable(body: PhysicsBody): Observable<IPhysicsCollisionEvent>;

    // shape
    initShape(shape: PhysicsShape, type: ShapeType, options: PhysicsShapeParameters): void;
    setFilterLayer(shape: PhysicsShape, layer: number): void;
    getFilterLayer(shape: PhysicsShape): number;
    setMaterial(shape: PhysicsShape, material: PhysicsMaterial): void;
    setDensity(shape: PhysicsShape, density: number): void;
    getDensity(shape: PhysicsShape): number;
    addChild(shape: PhysicsShape, newChild: PhysicsShape, childTransform: TransformNode): void;
    removeChild(shape: PhysicsShape, childIndex: number): void;
    getNumChildren(shape: PhysicsShape): number;
    getBoundingBox(shape: PhysicsShape): BoundingBox;
    disposeShape(shape: PhysicsShape): void;

    // constraint
    initConstraint(constraint: PhysicsConstraint, body: PhysicsBody, childBody: PhysicsBody): void;
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
    raycast(from: Vector3, to: Vector3, result: PhysicsRaycastResult): void;

    dispose(): void;
}
