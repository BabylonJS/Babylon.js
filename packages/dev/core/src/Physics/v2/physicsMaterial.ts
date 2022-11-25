import type { Scene } from "../../scene";
import type { IPhysicsEnginePluginV2 } from "./IPhysicsEngineV2";

/**
 *
 */
export class PhysicsMaterial {
    /**
     *
     */
    public _pluginData: any = undefined;

    protected _physicsPlugin: IPhysicsEnginePluginV2;

    /**
     *
     * @param friction
     * @param restitution
     * @param scene
     */
    constructor(friction: number, restitution: number, scene: Scene) {
        this._physicsPlugin = scene.getPhysicsEngine()?.getPhysicsPlugin() as any;
        this._physicsPlugin?.initMaterial(this);
    }
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
