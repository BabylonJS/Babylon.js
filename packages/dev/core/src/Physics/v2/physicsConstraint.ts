import type { Scene } from "../../scene";
import type { Vector3 } from "../../Maths/math.vector";
import type { IPhysicsEnginePlugin, ConstraintAxis, PhysicsConstraintParameters, ConstraintAxisLimitMode, ConstraintMotorType } from "./IPhysicsEnginePlugin";
import { ConstraintType } from "./IPhysicsEnginePlugin";
import type { PhysicsBody } from "./physicsBody";

/**
 * This is a holder class for the physics constraint created by the physics plugin
 * It holds a set of functions to control the underlying constraint
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine
 */
/** @internal */
export class PhysicsConstraint {
    /** @internal */
    /**
     *
     */
    public _pluginData: any = undefined;
    protected _physicsPlugin: IPhysicsEnginePlugin;

    /**
     *
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

        this._physicsPlugin = physicsPlugin as IPhysicsEnginePlugin;
        this._physicsPlugin.initConstraint(this, type, options);
    }

    /**
     *
     * @param body
     */
    public setParentBody(body: PhysicsBody): void {
        this._physicsPlugin.setParentBody(this, body);
    }

    /**
     *
     * @returns
     */
    public getParentBody(): PhysicsBody | undefined {
        return this._physicsPlugin.getParentBody(this);
    }

    /**
     *
     * @param body
     */
    public setChildBody(body: PhysicsBody): void {
        this._physicsPlugin.setChildBody(this, body);
    }

    /**
     *
     * @returns
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
