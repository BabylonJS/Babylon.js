import type { PhysicsBody } from "./physicsBody";
import type { PhysicsMaterial } from "./physicsMaterial";
import type { PhysicsShape } from "./PhysicsShape";
import { Logger } from "../Misc/logger";
/**
 *
 */
export class PhysicsImpostor {
    /**
     *
     */
    public body: PhysicsBody;

    /**
     *
     */
    public shape: PhysicsShape;

    public material: PhysicsMaterial;

    constructor(
        /**
         * The physics-enabled object used as the physics imposter
         */
        public object: IPhysicsEnabledObject,
        /**
         * The type of the physics imposter
         */
        public type: number,
        private _options: PhysicsImpostorParameters = { mass: 0 },
        private _scene?: Scene
    ) {
        //sanity check!
        if (!this.object) {
            Logger.Error("No object was provided. A physics object is obligatory");
            return;
        }
        if (this.object.parent && _options.mass !== 0) {
            Logger.Warn("A physics impostor has been created for an object which has a parent. Babylon physics currently works in local space so unexpected issues may occur.");
        }

        // Legacy support for old syntax.
        if (!this._scene && object.getScene) {
            this._scene = object.getScene();
        }
        // TODO
    }
}
