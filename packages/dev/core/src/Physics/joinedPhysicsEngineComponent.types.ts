import { type Observable } from "../Misc/observable";
import { type Nullable } from "../types";
import { type Vector3 } from "../Maths/math.vector";
import { type IPhysicsEngine } from "./IPhysicsEngine";
import { type IPhysicsEnginePlugin as IPhysicsEnginePluginV1 } from "./v1/IPhysicsEnginePlugin";
import { type IPhysicsEnginePluginV2 } from "./v2/IPhysicsEnginePlugin";
declare module "../scene.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /** @internal (Backing field) */
        _physicsEngine: Nullable<IPhysicsEngine>;
        /** @internal */
        _physicsTimeAccumulator: number;

        /**
         * Gets the current physics engine
         * @returns a IPhysicsEngine or null if none attached
         */
        getPhysicsEngine(): Nullable<IPhysicsEngine>;

        /**
         * Enables physics to the current scene
         * @param gravity defines the scene's gravity for the physics engine. defaults to real earth gravity : (0, -9.81, 0)
         * @param plugin defines the physics engine to be used. defaults to CannonJS.
         * @returns a boolean indicating if the physics engine was initialized
         */
        enablePhysics(gravity?: Nullable<Vector3>, plugin?: IPhysicsEnginePluginV1 | IPhysicsEnginePluginV2): boolean;

        /**
         * Disables and disposes the physics engine associated with the scene
         */
        disablePhysicsEngine(): void;

        /**
         * Gets a boolean indicating if there is an active physics engine
         * @returns a boolean indicating if there is an active physics engine
         */
        isPhysicsEnabled(): boolean;

        /**
         * Deletes a physics compound impostor
         * @param compound defines the compound to delete
         */
        deleteCompoundImpostor(compound: any): void;

        /**
         * An event triggered when physic simulation is about to be run
         */
        onBeforePhysicsObservable: Observable<Scene>;

        /**
         * An event triggered when physic simulation has been done
         */
        onAfterPhysicsObservable: Observable<Scene>;
    }
}
