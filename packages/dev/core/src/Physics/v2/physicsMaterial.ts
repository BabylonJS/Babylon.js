import type { Scene } from "../../scene";
import type { IPhysicsEnginePlugin } from "./IPhysicsEnginePlugin";

/**
 *
 */
/** @internal */
export class PhysicsMaterial {
    /** @internal */
    /**
     *
     */
    public _pluginData: any = undefined;

    protected _physicsPlugin: IPhysicsEnginePlugin;

    /**
     *
     * @param friction
     * @param restitution
     * @param scene
     */
    constructor(friction: number, restitution: number, scene: Scene) {
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
        this._physicsPlugin.initMaterial(this);
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
