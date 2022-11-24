import type { Scene } from "../scene";
import type { Vector3 } from "../Maths/math.vector";
import type { IPhysicsEnginePlugin2, JointAxis, PhysicsJointParameters } from "./IPhysicsEngine";
import { JointAxisLimitMode, JointMotorType } from "./IPhysicsEngine";
import { JointType } from "./IPhysicsEngine";
import type { PhysicsBody } from "./physicsBody";

/**
 * This is a holder class for the physics joint created by the physics plugin
 * It holds a set of functions to control the underlying joint
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine
 */
export class PhysicsJoint {
    /**
     *
     */
    public _pluginData: any = undefined;
    protected _physicsPlugin: IPhysicsEnginePlugin2 | undefined;

    /**
     *
     */
    constructor(type: JointType, options: PhysicsJointParameters, scene: Scene) {
        if (!scene) {
            return;
        }
        const physicsEngine = scene.getPhysicsEngine() as any;
        this._physicsPlugin = physicsEngine?.getPhysicsPlugin();
        this._physicsPlugin?.initJoint(this, type, options);
    }

    /**
     *
     * @param body
     */
    public setParentBody(body: PhysicsBody): void {
        this._physicsPlugin?.setParentBody(this, body);
    }

    /**
     *
     * @returns
     */
    public getParentBody(): PhysicsBody | undefined {
        return this._physicsPlugin ? this._physicsPlugin.getParentBody(this) : undefined;
    }

    /**
     *
     * @param body
     */
    public setChildBody(body: PhysicsBody): void {
        this._physicsPlugin?.setChildBody(this, body);
    }

    /**
     *
     * @returns
     */
    public getChildBody(): PhysicsBody | undefined {
        return this._physicsPlugin ? this._physicsPlugin.getChildBody(this) : undefined;
    }

    /**
     *
     * @param pivot +
     * @param axisX
     * @param axisY
     */
    public setAnchorInParent(pivot: Vector3, axisX: Vector3, axisY: Vector3): void {
        this._physicsPlugin?.setAnchorInParent(this, pivot, axisX, axisY);
    }

    /**
     *
     * @param pivot
     * @param axisX
     * @param axisY
     */
    public setAnchorInChild(pivot: Vector3, axisX: Vector3, axisY: Vector3): void {
        this._physicsPlugin?.setAnchorInChild(this, pivot, axisX, axisY);
    }

    /**
     *
     * @param isEnabled
     */
    public setEnabled(isEnabled: boolean): void {
        this._physicsPlugin?.setEnabled(this, isEnabled);
    }

    /**
     *
     * @returns
     */
    public getEnabled(): boolean {
        return this._physicsPlugin ? this._physicsPlugin.getEnabled(this) : false;
    }

    /**
     *
     * @param isEnabled
     */
    public setCollisionsEnabled(isEnabled: boolean): void {
        this._physicsPlugin?.setCollisionsEnabled(this, isEnabled);
    }

    /**
     *
     * @returns
     */
    public getCollisionsEnabled(): boolean {
        return this._physicsPlugin ? this._physicsPlugin.getCollisionsEnabled(this) : false;
    }

    /**
     *
     * @param axis
     * @param friction
     */
    public setAxisFriction(axis: JointAxis, friction: number): void {
        this._physicsPlugin?.setAxisFriction(this, axis, friction);
    }

    /**
     *
     * @param axis
     * @returns
     */
    public getAxisFriction(axis: JointAxis): number {
        return this._physicsPlugin ? this._physicsPlugin.getAxisFriction(this, axis) : 0;
    }

    /**
     *
     * @param axis
     * @param limitMode
     */
    public setAxisMode(axis: JointAxis, limitMode: JointAxisLimitMode): void {
        this._physicsPlugin?.setAxisMode(this, axis, limitMode);
    }
    /**
     *
     * @param axis
     */
    public getAxisMode(axis: JointAxis): JointAxisLimitMode {
        return this._physicsPlugin ? this._physicsPlugin.getAxisMode(this, axis) : JointAxisLimitMode.NONE;
    }

    /**
     *
     */
    public setAxisMinLimit(axis: JointAxis, minLimit: number): void {
        this._physicsPlugin?.setAxisMinLimit(this, axis, minLimit);
    }

    /**
     *
     */
    public getAxisMinLimit(axis: JointAxis): number {
        return this._physicsPlugin ? this._physicsPlugin.getAxisMinLimit(this, axis) : 0;
    }

    /**
     *
     */
    public setAxisMaxLimit(axis: JointAxis, limit: number): void {
        this._physicsPlugin?.setAxisMaxLimit(this, axis, limit);
    }

    /**
     *
     */
    public getAxisMaxLimit(axis: JointAxis): number {
        return this._physicsPlugin ? this._physicsPlugin.getAxisMaxLimit(this, axis) : 0;
    }

    /**
     *
     */
    public setAxisMotorType(axis: JointAxis, motorType: JointMotorType): void {
        this._physicsPlugin?.setAxisMotorType(this, axis, motorType);
    }

    /**
     *
     */
    public getAxisMotorType(axis: JointAxis): JointMotorType {
        return this._physicsPlugin ? this._physicsPlugin.getAxisMotorType(this, axis) : JointMotorType.NONE;
    }

    /**
     *
     */
    public setAxisMotorTarget(axis: JointAxis, target: number): void {
        this._physicsPlugin?.setAxisMotorTarget(this, axis, target);
    }

    /**
     *
     */
    public getAxisMotorTarget(axis: JointAxis): number {
        return this._physicsPlugin ? this._physicsPlugin.getAxisMotorTarget(this, axis) : 0;
    }

    /**
     *
     */
    public setAxisMotorMaxForce(axis: JointAxis, maxForce: number): void {
        this._physicsPlugin?.setAxisMotorMaxForce(this, axis, maxForce);
    }

    /**
     *
     */
    public getAxisMotorMaxForce(axis: JointAxis): number {
        return this._physicsPlugin ? this._physicsPlugin.getAxisMotorMaxForce(this, axis) : 0;
    }

    /**
     *
     */
    public dispose(): void {
        this._physicsPlugin?.disposeJoint(this);
    }
}

/**
 *
 */
export class PhysicsJointBallAndSocket extends PhysicsJoint {
    constructor(pivotA: Vector3, pivotB: Vector3, axisA: Vector3, axisB: Vector3, scene: Scene) {
        super(JointType.BALL_AND_SOCKET, { pivotA: pivotA, pivotB: pivotB, axisA: axisA, axisB: axisB }, scene);
    }
}

/**
 *
 */
export class PhysicsJointDistance extends PhysicsJoint {
    constructor(pivotA: Vector3, pivotB: Vector3, axisA: Vector3, axisB: Vector3, scene: Scene) {
        super(JointType.DISTANCE, { pivotA: pivotA, pivotB: pivotB, axisA: axisA, axisB: axisB }, scene);
    }
}

/**
 *
 */
export class PhysicsJointHinge extends PhysicsJoint {
    constructor(pivotA: Vector3, pivotB: Vector3, axisA: Vector3, axisB: Vector3, scene: Scene) {
        super(JointType.HINGE, { pivotA: pivotA, pivotB: pivotB, axisA: axisA, axisB: axisB }, scene);
    }
}

/**
 *
 */
export class PhysicsJointSlider extends PhysicsJoint {
    constructor(pivotA: Vector3, pivotB: Vector3, axisA: Vector3, axisB: Vector3, scene: Scene) {
        super(JointType.SLIDER, { pivotA: pivotA, pivotB: pivotB, axisA: axisA, axisB: axisB }, scene);
    }
}

/**
 *
 */
export class PhysicsJointLock extends PhysicsJoint {
    constructor(pivotA: Vector3, pivotB: Vector3, axisA: Vector3, axisB: Vector3, scene: Scene) {
        super(JointType.LOCK, { pivotA: pivotA, pivotB: pivotB, axisA: axisA, axisB: axisB }, scene);
    }
}
