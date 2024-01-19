import type { Scene } from "../../scene";
import type { Vector3 } from "../../Maths/math.vector";
import type { Nullable } from "../../types";
import type { IPhysicsEnginePluginV2, PhysicsConstraintParameters, PhysicsConstraintAxisLimitMode, PhysicsConstraintMotorType, ConstrainedBodyPair } from "./IPhysicsEnginePlugin";
import { PhysicsConstraintAxis, PhysicsConstraintType } from "./IPhysicsEnginePlugin";

/**
 * This is a holder class for the physics constraint created by the physics plugin
 * It holds a set of functions to control the underlying constraint
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine
 */
export class PhysicsConstraint {
    /**
     * V2 Physics plugin private data for a physics material
     */
    public _pluginData: any = undefined;
    /**
     * The V2 plugin used to create and manage this Physics Body
     */
    protected _physicsPlugin: IPhysicsEnginePluginV2;
    protected _options: PhysicsConstraintParameters;
    protected _type: PhysicsConstraintType;
    /**
     * @internal
     * The internal options that were used to init the constraint
     */
    public _initOptions?: PhysicsConstraintParameters;

    /**
     * Constructs a new constraint for the physics constraint.
     * @param type The type of constraint to create.
     * @param options The options for the constraint.
     * @param scene The scene the constraint belongs to.
     *
     * This code is useful for creating a new constraint for the physics engine. It checks if the scene has a physics engine, and if the plugin version is correct.
     * If all checks pass, it initializes the constraint with the given type and options.
     */
    constructor(type: PhysicsConstraintType, options: PhysicsConstraintParameters, scene: Scene) {
        if (!scene) {
            throw new Error("Missing scene parameter for constraint constructor.");
        }
        const physicsEngine = scene.getPhysicsEngine();
        if (!physicsEngine) {
            throw new Error("No Physics Engine available.");
        }
        if (physicsEngine.getPluginVersion() != 2) {
            throw new Error("Plugin version is incorrect. Expected version 2.");
        }
        const physicsPlugin = physicsEngine.getPhysicsPlugin();
        if (!physicsPlugin) {
            throw new Error("No Physics Plugin available.");
        }

        this._physicsPlugin = physicsPlugin as IPhysicsEnginePluginV2;
        this._options = options;
        this._type = type;
    }

    /**
     * Gets the type of the constraint.
     *
     * @returns The type of the constraint.
     *
     */
    public get type(): PhysicsConstraintType {
        return this._type;
    }

    /**
     * Retrieves the options of the physics constraint.
     *
     * @returns The physics constraint parameters.
     *
     */
    public get options(): PhysicsConstraintParameters {
        return this._options;
    }

    /**
     * Enable/disable the constraint
     * @param isEnabled value for the constraint
     */
    public set isEnabled(isEnabled: boolean) {
        this._physicsPlugin.setEnabled(this, isEnabled);
    }

    /**
     *
     * @returns true if constraint is enabled
     */
    public get isEnabled(): boolean {
        return this._physicsPlugin.getEnabled(this);
    }

    /**
     * Enables or disables collisions for the physics engine.
     *
     * @param isEnabled - A boolean value indicating whether collisions should be enabled or disabled.
     *
     */
    public set isCollisionsEnabled(isEnabled: boolean) {
        this._physicsPlugin.setCollisionsEnabled(this, isEnabled);
    }

    /**
     * Gets whether collisions are enabled for this physics object.
     *
     * @returns `true` if collisions are enabled, `false` otherwise.
     *
     */
    public get isCollisionsEnabled(): boolean {
        return this._physicsPlugin.getCollisionsEnabled(this);
    }

    /**
     * Gets all bodies that are using this constraint
     * @returns
     */
    public getBodiesUsingConstraint(): ConstrainedBodyPair[] {
        return this._physicsPlugin.getBodiesUsingConstraint(this);
    }

    /**
     * Disposes the constraint from the physics engine.
     *
     * This method is useful for cleaning up the physics engine when a body is no longer needed. Disposing the body will free up resources and prevent memory leaks.
     */
    public dispose(): void {
        this._physicsPlugin.disposeConstraint(this);
    }
}

/**
 * This describes a single limit used by Physics6DoFConstraint
 */
export class Physics6DoFLimit {
    /**
     * The axis ID to limit
     */
    axis: PhysicsConstraintAxis;
    /**
     * An optional minimum limit for the axis.
     * Corresponds to a distance in meters for linear axes, an angle in radians for angular axes.
     */
    minLimit?: number;
    /**
     * An optional maximum limit for the axis.
     * Corresponds to a distance in meters for linear axes, an angle in radians for angular axes.
     */
    maxLimit?: number;
    /**
     * The stiffness of the constraint.
     */
    stiffness?: number;
    /**
     * A constraint parameter that specifies damping.
     */
    damping?: number;
}

/**
 * A generic constraint, which can be used to build more complex constraints than those specified
 * in PhysicsConstraintType. The axis and pivot options in PhysicsConstraintParameters define the space
 * the constraint operates in. This constraint contains a set of limits, which restrict the
 * relative movement of the bodies in that coordinate system
 */
export class Physics6DoFConstraint extends PhysicsConstraint {
    /**
     * The collection of limits which this constraint will apply
     */
    public limits: Physics6DoFLimit[];

    constructor(constraintParams: PhysicsConstraintParameters, limits: Physics6DoFLimit[], scene: Scene) {
        super(PhysicsConstraintType.SIX_DOF, constraintParams, scene);
        this.limits = limits;
    }

    /**
     * Sets the friction of the given axis of the physics engine.
     * @param axis - The axis of the physics engine to set the friction for.
     * @param friction - The friction to set for the given axis.
     *
     */
    public setAxisFriction(axis: PhysicsConstraintAxis, friction: number): void {
        this._physicsPlugin.setAxisFriction(this, axis, friction);
    }

    /**
     * Gets the friction of the given axis of the physics engine.
     * @param axis - The axis of the physics engine.
     * @returns The friction of the given axis, or null if the constraint hasn't been initialized yet.
     *
     */
    public getAxisFriction(axis: PhysicsConstraintAxis): Nullable<number> {
        return this._physicsPlugin.getAxisFriction(this, axis);
    }

    /**
     * Sets the limit mode for the given axis of the constraint.
     * @param axis The axis to set the limit mode for.
     * @param limitMode The limit mode to set.
     *
     * This method is useful for setting the limit mode for a given axis of the constraint. This is important for
     * controlling the behavior of the physics engine when the constraint is reached. By setting the limit mode,
     * the engine can be configured to either stop the motion of the objects, or to allow them to continue
     * moving beyond the constraint.
     */
    public setAxisMode(axis: PhysicsConstraintAxis, limitMode: PhysicsConstraintAxisLimitMode): void {
        this._physicsPlugin.setAxisMode(this, axis, limitMode);
    }

    /**
     * Gets the limit mode of the given axis of the constraint.
     *
     * @param axis - The axis of the constraint.
     * @returns The limit mode of the given axis, or null if the constraint hasn't been initialized yet.
     *
     */
    public getAxisMode(axis: PhysicsConstraintAxis): Nullable<PhysicsConstraintAxisLimitMode> {
        return this._physicsPlugin.getAxisMode(this, axis);
    }

    /**
     * Sets the minimum limit of a given axis of a constraint.
     * @param axis - The axis of the constraint.
     * @param minLimit - The minimum limit of the axis.
     *
     */
    public setAxisMinLimit(axis: PhysicsConstraintAxis, minLimit: number): void {
        this._physicsPlugin.setAxisMinLimit(this, axis, minLimit);
    }

    /**
     * Gets the minimum limit of the given axis of the physics engine.
     * @param axis - The axis of the physics engine.
     * @returns The minimum limit of the given axis, or null if the constraint hasn't been initialized yet.
     *
     */
    public getAxisMinLimit(axis: PhysicsConstraintAxis): Nullable<number> {
        return this._physicsPlugin.getAxisMinLimit(this, axis);
    }

    /**
     * Sets the maximum limit of the given axis for the physics engine.
     * @param axis - The axis to set the limit for.
     * @param limit - The maximum limit of the axis.
     *
     * This method is useful for setting the maximum limit of the given axis for the physics engine,
     * which can be used to control the movement of the physics object. This helps to ensure that the
     * physics object does not move beyond the given limit.
     */
    public setAxisMaxLimit(axis: PhysicsConstraintAxis, limit: number): void {
        this._physicsPlugin.setAxisMaxLimit(this, axis, limit);
    }

    /**
     * Gets the maximum limit of the given axis of the physics engine.
     * @param axis - The axis of the physics engine.
     * @returns The maximum limit of the given axis, or null if the constraint hasn't been initialized yet.
     *
     */
    public getAxisMaxLimit(axis: PhysicsConstraintAxis): Nullable<number> {
        return this._physicsPlugin.getAxisMaxLimit(this, axis);
    }

    /**
     * Sets the motor type of the given axis of the constraint.
     * @param axis - The axis of the constraint.
     * @param motorType - The type of motor to use.
     */
    public setAxisMotorType(axis: PhysicsConstraintAxis, motorType: PhysicsConstraintMotorType): void {
        this._physicsPlugin.setAxisMotorType(this, axis, motorType);
    }

    /**
     * Gets the motor type of the specified axis of the constraint.
     *
     * @param axis - The axis of the constraint.
     * @returns The motor type of the specified axis, or null if the constraint hasn't been initialized yet.
     *
     */
    public getAxisMotorType(axis: PhysicsConstraintAxis): Nullable<PhysicsConstraintMotorType> {
        return this._physicsPlugin.getAxisMotorType(this, axis);
    }

    /**
     * Sets the target velocity of the motor associated with the given axis of the constraint.
     * @param axis - The axis of the constraint.
     * @param target - The target velocity of the motor.
     *
     * This method is useful for setting the target velocity of the motor associated with the given axis of the constraint.
     */
    public setAxisMotorTarget(axis: PhysicsConstraintAxis, target: number): void {
        this._physicsPlugin.setAxisMotorTarget(this, axis, target);
    }

    /**
     * Gets the target velocity of the motor associated to the given constraint axis.
     * @param axis - The constraint axis associated to the motor.
     * @returns The target velocity of the motor, or null if the constraint hasn't been initialized yet.
     *
     */
    public getAxisMotorTarget(axis: PhysicsConstraintAxis): Nullable<number> {
        return this._physicsPlugin.getAxisMotorTarget(this, axis);
    }

    /**
     * Sets the maximum force of the motor of the given axis of the constraint.
     * @param axis - The axis of the constraint.
     * @param maxForce - The maximum force of the motor.
     *
     */
    public setAxisMotorMaxForce(axis: PhysicsConstraintAxis, maxForce: number): void {
        this._physicsPlugin.setAxisMotorMaxForce(this, axis, maxForce);
    }

    /**
     * Gets the maximum force of the motor of the given axis of the constraint.
     * @param axis - The axis of the constraint.
     * @returns The maximum force of the motor, or null if the constraint hasn't been initialized yet.
     *
     */
    public getAxisMotorMaxForce(axis: PhysicsConstraintAxis): Nullable<number> {
        return this._physicsPlugin.getAxisMotorMaxForce(this, axis);
    }
}

/**
 * Represents a Ball and Socket Constraint, used to simulate a joint
 *
 * @param pivotA - The first pivot, defined locally in the first body frame
 * @param pivotB - The second pivot, defined locally in the second body frame
 * @param axisA - The axis of the first body
 * @param axisB - The axis of the second body
 * @param scene - The scene the constraint is applied to
 * @returns The Ball and Socket Constraint
 *
 * This class is useful for simulating a joint between two bodies in a physics engine.
 * It allows for the two bodies to move relative to each other in a way that mimics a ball and socket joint, such as a shoulder or hip joint.
 */
export class BallAndSocketConstraint extends PhysicsConstraint {
    constructor(pivotA: Vector3, pivotB: Vector3, axisA: Vector3, axisB: Vector3, scene: Scene) {
        super(PhysicsConstraintType.BALL_AND_SOCKET, { pivotA: pivotA, pivotB: pivotB, axisA: axisA, axisB: axisB }, scene);
    }
}

/**
 * Creates a distance constraint.
 * @param maxDistance distance between bodies
 * @param scene The scene the constraint belongs to
 * @returns DistanceConstraint
 *
 * This code is useful for creating a distance constraint in a physics engine.
 * A distance constraint is a type of constraint that keeps two objects at a certain distance from each other.
 * The scene is used to add the constraint to the physics engine.
 */
export class DistanceConstraint extends PhysicsConstraint {
    constructor(maxDistance: number, scene: Scene) {
        super(PhysicsConstraintType.DISTANCE, { maxDistance: maxDistance }, scene);
    }
}

/**
 * Creates a HingeConstraint, which is a type of PhysicsConstraint.
 *
 * @param pivotA - The first pivot point, in world space.
 * @param pivotB - The second pivot point, in world space.
 * @param scene - The scene the constraint is used in.
 * @returns The new HingeConstraint.
 *
 * This code is useful for creating a HingeConstraint, which is a type of PhysicsConstraint.
 * This constraint is used to simulate a hinge joint between two rigid bodies, allowing them to rotate around a single axis.
 */
export class HingeConstraint extends PhysicsConstraint {
    constructor(pivotA: Vector3, pivotB: Vector3, axisA: Vector3, axisB: Vector3, scene: Scene) {
        super(PhysicsConstraintType.HINGE, { pivotA: pivotA, pivotB: pivotB, axisA: axisA, axisB: axisB }, scene);
    }
}

/**
 * Creates a SliderConstraint, which is a type of PhysicsConstraint.
 *
 * @param pivotA - The first pivot of the constraint, in world space.
 * @param pivotB - The second pivot of the constraint, in world space.
 * @param axisA - The first axis of the constraint, in world space.
 * @param axisB - The second axis of the constraint, in world space.
 * @param scene - The scene the constraint belongs to.
 * @returns The created SliderConstraint.
 *
 * This code is useful for creating a SliderConstraint, which is a type of PhysicsConstraint.
 * It allows the user to specify the two pivots and two axes of the constraint in world space, as well as the scene the constraint belongs to.
 * This is useful for creating a constraint between two rigid bodies that allows them to move along a certain axis.
 */
export class SliderConstraint extends PhysicsConstraint {
    constructor(pivotA: Vector3, pivotB: Vector3, axisA: Vector3, axisB: Vector3, scene: Scene) {
        super(PhysicsConstraintType.SLIDER, { pivotA: pivotA, pivotB: pivotB, axisA: axisA, axisB: axisB }, scene);
    }
}

/**
 * Creates a LockConstraint, which is a type of PhysicsConstraint.
 *
 * @param pivotA - The first pivot of the constraint in local space.
 * @param pivotB - The second pivot of the constraint in local space.
 * @param axisA - The first axis of the constraint in local space.
 * @param axisB - The second axis of the constraint in local space.
 * @param scene - The scene the constraint belongs to.
 * @returns The created LockConstraint.
 *
 * This code is useful for creating a LockConstraint, which is a type of PhysicsConstraint.
 * It takes in two pivots and two axes in local space, as well as the scene the constraint belongs to, and creates a LockConstraint.
 */
export class LockConstraint extends PhysicsConstraint {
    constructor(pivotA: Vector3, pivotB: Vector3, axisA: Vector3, axisB: Vector3, scene: Scene) {
        super(PhysicsConstraintType.LOCK, { pivotA: pivotA, pivotB: pivotB, axisA: axisA, axisB: axisB }, scene);
    }
}

/**
 * Creates a PrismaticConstraint, which is a type of PhysicsConstraint.
 *
 * @param pivotA - The first pivot of the constraint in local space.
 * @param pivotB - The second pivot of the constraint in local space.
 * @param axisA - The first axis of the constraint in local space.
 * @param axisB - The second axis of the constraint in local space.
 * @param scene - The scene the constraint belongs to.
 * @returns The created LockConstraint.
 *
 * This code is useful for creating a PrismaticConstraint, which is a type of PhysicsConstraint.
 * It takes in two pivots and two axes in local space, as well as the scene the constraint belongs to, and creates a PrismaticConstraint.
 */
export class PrismaticConstraint extends PhysicsConstraint {
    constructor(pivotA: Vector3, pivotB: Vector3, axisA: Vector3, axisB: Vector3, scene: Scene) {
        super(PhysicsConstraintType.PRISMATIC, { pivotA: pivotA, pivotB: pivotB, axisA: axisA, axisB: axisB }, scene);
    }
}

/**
 * Creates a SpringConstraint, which is a type of Physics6DoFConstraint. This constraint applies a force at the ends which is proportional
 * to the distance between ends, and a stiffness and damping factor. The force is calculated as (stiffness * positionError) - (damping * velocity)
 *
 * @param pivotA - The first pivot of the constraint in local space.
 * @param pivotB - The second pivot of the constraint in local space.
 * @param axisA - The first axis of the constraint in local space.
 * @param axisB - The second axis of the constraint in local space.
 * @param minDistance - The minimum distance between the two pivots.
 * @param maxDistance - The maximum distance between the two pivots.
 * @param stiffness - The stiffness of the spring.
 * @param damping - The damping of the spring.
 * @param scene - The scene the constraint belongs to.
 * @returns The created SpringConstraint.
 */
export class SpringConstraint extends Physics6DoFConstraint {
    constructor(pivotA: Vector3, pivotB: Vector3, axisA: Vector3, axisB: Vector3, minDistance: number, maxDistance: number, stiffness: number, damping: number, scene: Scene) {
        super({ pivotA, pivotB, axisA, axisB }, [{ axis: PhysicsConstraintAxis.LINEAR_DISTANCE, minLimit: minDistance, maxLimit: maxDistance, stiffness, damping }], scene);
    }
}
