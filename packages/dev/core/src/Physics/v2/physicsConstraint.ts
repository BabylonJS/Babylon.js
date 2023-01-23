import type { Scene } from "../../scene";
import type { Vector3 } from "../../Maths/math.vector";
import type { IPhysicsEnginePluginV2, ConstraintAxis, PhysicsConstraintParameters, ConstraintAxisLimitMode, ConstraintMotorType } from "./IPhysicsEnginePlugin";
import { ConstraintType } from "./IPhysicsEnginePlugin";
import type { PhysicsBody } from "./physicsBody";

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

    /**
     * Constructs a new constraint for the physics constraint.
     * @param type The type of constraint to create.
     * @param options The options for the constraint.
     * @param scene The scene the constraint belongs to.
     *
     * This code is useful for creating a new constraint for the physics engine. It checks if the scene has a physics engine, and if the plugin version is correct.
     * If all checks pass, it initializes the constraint with the given type and options.
     */
    constructor(type: ConstraintType, options: PhysicsConstraintParameters, scene: Scene) {
        if (!scene) {
            return;
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
        this._physicsPlugin.initConstraint(this, type, options);
    }

    /**
     * Sets the parent body of this body.
     * @param body - The parent body to set.
     *
     * This method is useful for setting the parent body of a physics body in a physics engine.
     * This allows the engine to accurately simulate the motion of the body in relation to its parent body.
     * For example, if the parent body is a planet, the engine can accurately simulate the motion of the body in relation to the planet's gravity.
     */
    public setParentBody(body: PhysicsBody): void {
        this._physicsPlugin.setParentBody(this, body);
    }

    /**
     * Retrieves the parent body of the current physics constraint.
     *
     * @returns The parent body of the current physics constraint, or `undefined` if the
     * current constraint does not have a parent body.
     */
    public getParentBody(): PhysicsBody | undefined {
        return this._physicsPlugin.getParentBody(this);
    }

    /**
     * Sets the child body of the current body.
     *
     * @param body - The child body to set.
     *
     * This method is useful for setting the child body of the current body in a physics engine.
     * This allows for the creation of complex structures of bodies that interact with each other in a realistic way.
     */
    public setChildBody(body: PhysicsBody): void {
        this._physicsPlugin.setChildBody(this, body);
    }

    /**
     * Retrieves the child body of the current physics constraint.
     *
     * @returns The child body of the current physics constraint, or `undefined` if no
     * child body is present.
     */
    public getChildBody(): PhysicsBody | undefined {
        return this._physicsPlugin.getChildBody(this);
    }

    /**
     *
     * @param pivot +
     * @param axisX
     * @param axisY
     */
    public setAnchorInParent(pivot: Vector3, axisX: Vector3, axisY: Vector3): void {
        this._physicsPlugin.setAnchorInParent(this, pivot, axisX, axisY);
    }

    /**
     *
     * @param pivot
     * @param axisX
     * @param axisY
     */
    public setAnchorInChild(pivot: Vector3, axisX: Vector3, axisY: Vector3): void {
        this._physicsPlugin.setAnchorInChild(this, pivot, axisX, axisY);
    }

    /**
     *
     * @param isEnabled
     */
    public setEnabled(isEnabled: boolean): void {
        this._physicsPlugin.setEnabled(this, isEnabled);
    }

    /**
     *
     * @returns
     */
    public getEnabled(): boolean {
        return this._physicsPlugin.getEnabled(this);
    }

    /**
     *
     * @param isEnabled
     */
    public setCollisionsEnabled(isEnabled: boolean): void {
        this._physicsPlugin.setCollisionsEnabled(this, isEnabled);
    }

    /**
     *
     * @returns
     */
    public getCollisionsEnabled(): boolean {
        return this._physicsPlugin.getCollisionsEnabled(this);
    }

    /**
     *
     * @param axis
     * @param friction
     */
    public setAxisFriction(axis: ConstraintAxis, friction: number): void {
        this._physicsPlugin.setAxisFriction(this, axis, friction);
    }

    /**
     *
     * @param axis
     * @returns
     */
    public getAxisFriction(axis: ConstraintAxis): number {
        return this._physicsPlugin.getAxisFriction(this, axis);
    }

    /**
     *
     * @param axis
     * @param limitMode
     */
    public setAxisMode(axis: ConstraintAxis, limitMode: ConstraintAxisLimitMode): void {
        this._physicsPlugin.setAxisMode(this, axis, limitMode);
    }
    /**
     *
     * @param axis
     */
    public getAxisMode(axis: ConstraintAxis): ConstraintAxisLimitMode {
        return this._physicsPlugin.getAxisMode(this, axis);
    }

    /**
     *
     */
    public setAxisMinLimit(axis: ConstraintAxis, minLimit: number): void {
        this._physicsPlugin.setAxisMinLimit(this, axis, minLimit);
    }

    /**
     *
     */
    public getAxisMinLimit(axis: ConstraintAxis): number {
        return this._physicsPlugin.getAxisMinLimit(this, axis);
    }

    /**
     *
     */
    public setAxisMaxLimit(axis: ConstraintAxis, limit: number): void {
        this._physicsPlugin.setAxisMaxLimit(this, axis, limit);
    }

    /**
     *
     */
    public getAxisMaxLimit(axis: ConstraintAxis): number {
        return this._physicsPlugin.getAxisMaxLimit(this, axis);
    }

    /**
     *
     */
    public setAxisMotorType(axis: ConstraintAxis, motorType: ConstraintMotorType): void {
        this._physicsPlugin.setAxisMotorType(this, axis, motorType);
    }

    /**
     *
     */
    public getAxisMotorType(axis: ConstraintAxis): ConstraintMotorType {
        return this._physicsPlugin.getAxisMotorType(this, axis);
    }

    /**
     *
     */
    public setAxisMotorTarget(axis: ConstraintAxis, target: number): void {
        this._physicsPlugin.setAxisMotorTarget(this, axis, target);
    }

    /**
     *
     */
    public getAxisMotorTarget(axis: ConstraintAxis): number {
        return this._physicsPlugin.getAxisMotorTarget(this, axis);
    }

    /**
     *
     */
    public setAxisMotorMaxForce(axis: ConstraintAxis, maxForce: number): void {
        this._physicsPlugin.setAxisMotorMaxForce(this, axis, maxForce);
    }

    /**
     *
     */
    public getAxisMotorMaxForce(axis: ConstraintAxis): number {
        return this._physicsPlugin.getAxisMotorMaxForce(this, axis);
    }

    /**
     *
     */
    public dispose(): void {
        this._physicsPlugin.disposeConstraint(this);
    }
}

/**
 *
 */
/** @internal */
export class PhysicsConstraintBallAndSocket extends PhysicsConstraint {
    /** @internal */
    constructor(pivotA: Vector3, pivotB: Vector3, axisA: Vector3, axisB: Vector3, scene: Scene) {
        super(ConstraintType.BALL_AND_SOCKET, { pivotA: pivotA, pivotB: pivotB, axisA: axisA, axisB: axisB }, scene);
    }
}

/**
 *
 */
/** @internal */
export class PhysicsConstraintDistance extends PhysicsConstraint {
    /** @internal */
    constructor(pivotA: Vector3, pivotB: Vector3, axisA: Vector3, axisB: Vector3, scene: Scene) {
        super(ConstraintType.DISTANCE, { pivotA: pivotA, pivotB: pivotB, axisA: axisA, axisB: axisB }, scene);
    }
}

/**
 *
 */
/** @internal */
export class PhysicsConstraintHinge extends PhysicsConstraint {
    /** @internal */
    constructor(pivotA: Vector3, pivotB: Vector3, axisA: Vector3, axisB: Vector3, scene: Scene) {
        super(ConstraintType.HINGE, { pivotA: pivotA, pivotB: pivotB, axisA: axisA, axisB: axisB }, scene);
    }
}

/**
 *
 */
/** @internal */
export class PhysicsConstraintSlider extends PhysicsConstraint {
    /** @internal */
    constructor(pivotA: Vector3, pivotB: Vector3, axisA: Vector3, axisB: Vector3, scene: Scene) {
        super(ConstraintType.SLIDER, { pivotA: pivotA, pivotB: pivotB, axisA: axisA, axisB: axisB }, scene);
    }
}

/**
 *
 */
/** @internal */
export class PhysicsConstraintLock extends PhysicsConstraint {
    /** @internal */
    constructor(pivotA: Vector3, pivotB: Vector3, axisA: Vector3, axisB: Vector3, scene: Scene) {
        super(ConstraintType.LOCK, { pivotA: pivotA, pivotB: pivotB, axisA: axisA, axisB: axisB }, scene);
    }
}
