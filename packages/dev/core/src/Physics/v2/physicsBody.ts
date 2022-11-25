import type { IPhysicsEnginePluginV2, MassProperties } from "./IPhysicsEngineV2";
import type { PhysicsShape } from "./physicsShape";
import { Vector3 } from "../../Maths/math.vector";
import type { Scene } from "../../scene";

/**
 *
 */
export class PhysicsBody {
    /** @internal */
    public _pluginData: any = undefined;

    private _physicsPlugin: IPhysicsEnginePluginV2 | undefined;

    /**
     *
     * @param scene
     * @returns
     */
    constructor(scene: Scene) {
        if (!scene) {
            return;
        }
        this._physicsPlugin = scene.getPhysicsEngine()?.getPhysicsPlugin() as any;
        this._physicsPlugin?.initBody(this);
    }
    /**
     *
     * @param shape
     */
    public setShape(shape: PhysicsShape): void {
        this._physicsPlugin?.setShape(this, shape);
    }

    /**
     *
     * @returns
     */
    public getShape(): PhysicsShape | undefined {
        return this._physicsPlugin ? this._physicsPlugin.getShape(this) : undefined;
    }

    /**
     *
     * @param group
     */
    public setFilterGroup(group: number): void {
        this._physicsPlugin?.setFilterGroup(this, group);
    }

    /**
     *
     * @returns
     */
    public getFilterGroup(): number {
        return this._physicsPlugin ? this._physicsPlugin.getFilterGroup(this) : 0;
    }

    /**
     *
     * @param eventMask
     */
    public setEventMask(eventMask: number): void {
        this._physicsPlugin?.setEventMask(this, eventMask);
    }

    /**
     *
     * @returns
     */
    public getEventMask(): number {
        return this._physicsPlugin ? this._physicsPlugin.getEventMask(this) : 0;
    }

    /**
     *
     * @param massProps
     */
    public setMassProperties(massProps: MassProperties): void {
        this._physicsPlugin?.setMassProperties(this, massProps);
    }

    /**
     *
     * @returns
     */
    public getMassProperties(): MassProperties | undefined {
        return this._physicsPlugin ? this._physicsPlugin.getMassProperties(this) : undefined;
    }

    /**
     *
     * @param damping
     */
    public setLinearDamping(damping: number): void {
        this._physicsPlugin?.setLinearDamping(this, damping);
    }

    /**
     *
     * @returns
     */
    public getLinearDamping(): number {
        return this._physicsPlugin ? this._physicsPlugin.getLinearDamping(this) : 0;
    }

    /**
     *
     * @param damping
     */
    public setAngularDamping(damping: number): void {
        this._physicsPlugin?.setAngularDamping(this, damping);
    }

    /**
     *
     * @returns
     */
    public getAngularDamping(): number {
        return this._physicsPlugin ? this._physicsPlugin.getAngularDamping(this) : 0;
    }

    /**
     *
     * @param linVel
     */
    public setLinearVelocity(linVel: Vector3): void {
        this._physicsPlugin?.setLinearVelocity(this, linVel);
    }

    /**
     *
     * @returns
     */
    public getLinearVelocity(): Vector3 {
        return this._physicsPlugin ? this._physicsPlugin.getLinearVelocity(this) : Vector3.Zero();
    }

    /**
     *
     * @param angVel
     */
    public setAngularVelocity(angVel: Vector3): void {
        this._physicsPlugin?.setAngularVelocity(this, angVel);
    }

    /**
     *
     * @returns
     */
    public getAngularVelocity(): Vector3 {
        return this._physicsPlugin ? this._physicsPlugin.getAngularVelocity(this) : Vector3.Zero();
    }

    /**
     *
     * @param location
     * @param impulse
     */
    public applyImpulse(location: Vector3, impulse: Vector3): void {
        this._physicsPlugin?.applyImpulse(this, location, impulse);
    }

    /**
     *
     */
    public dispose() {
        this._physicsPlugin?.disposeBody(this);
    }
}
