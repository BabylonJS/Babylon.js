import type { Vector3 } from "../Maths/math.vector";
import type { IPhysicsEnginePlugin, JointAxis, JointAxisLimitMode, JointMotorType } from "./IPhysicsEngine";
import type { PhysicsBody } from "./physicsBody";

/**
 * This is a holder class for the physics joint created by the physics plugin
 * It holds a set of functions to control the underlying joint
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine
 */
export class PhysicsJoint {
    protected _physicsPlugin: IPhysicsEnginePlugin;

    //Joint Types
    /**
     *
     */

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
    public getParentBody(): PhysicsBody {
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
    public getChildBody(): PhysicsBody {
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
    public setAxisFriction(axis: JointAxis, friction: number): void {
        this._physicsPlugin.setAxisFriction(this, axis, friction);
    }

    /**
     *
     * @param axis
     * @returns
     */
    public getAxisFriction(axis: JointAxis): number {
        return this._physicsPlugin.getAxisFriction(this, axis);
    }

    /**
     *
     * @param axis
     * @param limitMode
     */
    public setAxisMode(axis: JointAxis, limitMode: JointAxisLimitMode): void {
        this._physicsPlugin.setAxisMode(this, axis, limitMode);
    }
    /**
     *
     * @param axis
     */
    public getAxisMode(axis: JointAxis): JointAxisLimitMode {
        return this._physicsPlugin.getAxisMode(this, axis);
    }

    /**
     *
     */
    public setAxisMinLimit(axis: JointAxis, minLimit: number): void {
        this._physicsPlugin.setAxisMinLimit(this, axis, minLimit);
    }

    /**
     *
     */
    public getAxisMinLimit(axis: JointAxis): number {
        return this._physicsPlugin.getAxisMinLimit(this, axis);
    }

    /**
     *
     */
    public setAxisMaxLimit(axis: JointAxis, limit: number): void {
        this._physicsPlugin.setAxisMaxLimit(this, axis, limit);
    }

    /**
     *
     */
    public getAxisMaxLimit(axis: JointAxis): number {
        return this._physicsPlugin.getAxisMaxLimit(this, axis);
    }

    /**
     *
     */
    public setAxisMotorType(axis: JointAxis, motorType: JointMotorType): void {
        this._physicsPlugin.setAxisMotorType(this, axis, motorType);
    }

    /**
     *
     */
    public getAxisMotorType(axis: JointAxis): JointMotorType {
        return this._physicsPlugin.getAxisMotorType(this, axis);
    }

    /**
     *
     */
    public setAxisMotorTarget(axis: JointAxis, target: number): void {
        this._physicsPlugin.setAxisMotorTarget(this, axis, target);
    }

    /**
     *
     */
    public getAxisMotorTarget(axis: JointAxis): number {
        return this._physicsPlugin.getAxisMotorTarget(this, axis);
    }

    /**
     *
     */
    public setAxisMotorMaxForce(axis: JointAxis, maxForce: number): void {
        this._physicsPlugin.setAxisMotorMaxForce(this, axis, maxForce);
    }

    /**
     *
     */
    public getAxisMotorMaxForce(axis: JointAxis): number {
        return this._physicsPlugin.getAxisMotorMaxForce(this, axis);
    }

    /**
     *
     */
    public dispose(): void {
        this._physicsPlugin.disposeJoint(this);
    }
}
