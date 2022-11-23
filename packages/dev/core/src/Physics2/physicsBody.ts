import type { IPhysicsEnginePlugin, MassProperties } from "./IPhysicsEngine";
import type { PhysicsShape } from "./PhysicsShape";
import type { Vector3 } from "../Maths/math.vector";

/**
 *
 */
export class PhysicsBody {
    /** @internal */
    public _pluginData: any = {};

    private _physicsPlugin: IPhysicsEnginePlugin;

    /**
     *
     * @param shape
     */
    public setShape(shape: PhysicsShape): void {
        this._physicsPlugin.setShape(this, shape);
    }

    /**
     *
     * @returns
     */
    public getShape(): PhysicsShape {
        return this._physicsPlugin.getShape(this);
    }

    /**
     *
     * @param group
     */
    public setFilterGroup(group: number): void {
        this._physicsPlugin.setFilterGroup(this, group);
    }

    /**
     *
     * @returns
     */
    public getFilterGroup(): number {
        return this._physicsPlugin.getFilterGroup(this);
    }

    /**
     *
     * @param eventMask
     */
    public setEventMask(eventMask: number): void {
        this._physicsPlugin.setEventMask(this, eventMask);
    }

    /**
     *
     * @returns
     */
    public getEventMask(): number {
        return this._physicsPlugin.getEventMask(this);
    }

    /**
     *
     * @param massProps
     */
    public setMassProperties(massProps: MassProperties): void {
        this._physicsPlugin.setMassProperties(this, massProps);
    }

    /**
     *
     * @returns
     */
    public getMassProperties(): MassProperties {
        return this._physicsPlugin.getMassProperties(this);
    }

    /**
     *
     * @param damping
     */
    public setLinearDamping(damping: number): void {
        this._physicsPlugin.setLinearDamping(this, damping);
    }

    /**
     *
     * @returns
     */
    public getLinearDamping(): number {
        return this._physicsPlugin.getLinearDamping(this);
    }

    /**
     *
     * @param damping
     */
    public setAngularDamping(damping: number): void {
        this._physicsPlugin.setAngularDamping(this, damping);
    }

    /**
     *
     * @returns
     */
    public getAngularDamping(): number {
        return this._physicsPlugin.getAngularDamping(this);
    }

    /**
     *
     * @param linVel
     */
    public setLinearVelocity(linVel: Vector3): void {
        this._physicsPlugin.setLinearVelocity(this, linVel);
    }

    /**
     *
     * @returns
     */
    public getLinearVelocity(): Vector3 {
        return this._physicsPlugin.getLinearVelocity(this);
    }

    /**
     *
     * @param angVel
     */
    public setAngularVelocity(angVel: Vector3): void {
        this._physicsPlugin.setAngularVelocity(this, angVel);
    }

    /**
     *
     * @returns
     */
    public getAngularVelocity(): Vector3 {
        return this._physicsPlugin.getAngularVelocity(this);
    }

    /**
     *
     * @param location
     * @param impulse
     */
    public applyImpulse(location: Vector3, impulse: Vector3): void {
        this._physicsPlugin.applyImpulse(this, location, impulse);
    }

    /**
     *
     */
    public dispose() {
        this._physicsPlugin.disposeBody(this);
    }
}
