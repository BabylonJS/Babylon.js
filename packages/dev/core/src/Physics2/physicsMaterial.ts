import type { IPhysicsEnginePlugin } from "./IPhysicsEngine";

/**
 *
 */
export class PhysicsMaterial {
    /**
     *
     */
    public _pluginData: any = {};

    protected _physicsPlugin: IPhysicsEnginePlugin;

    /**
     *
     * @param friction
     */
    public setFriction(friction: number): void {
        this._physicsPlugin.setFriction(this, friction);
    }

    /**
     *
     * @returns
     */
    public getFriction(): number {
        return this._physicsPlugin.getFriction(this);
    }

    /**
     *
     * @param restitution
     */
    public setRestitution(restitution: number): void {
        this._physicsPlugin.setRestitution(this, restitution);
    }

    /**
     *
     * @returns
     */
    public getRestitution(): number {
        return this._physicsPlugin.getRestitution(this);
    }

    /**
     *
     */
    public dispose(): void {
        this._physicsPlugin.disposeMaterial(this);
    }
}
