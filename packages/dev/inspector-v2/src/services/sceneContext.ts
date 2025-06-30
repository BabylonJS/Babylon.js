import type { IReadonlyObservable, Nullable, Scene } from "core/index";

import type { IService } from "../modularity/serviceDefinition";

export const SceneContextIdentity = Symbol("SceneScontext");

/**
 * SceneContext provides the current scene, but could have different implementations depending on the context (e.g. inspector, sandbox, etc.)
 */
export interface ISceneContext extends IService<typeof SceneContextIdentity> {
    /**
     * Gets the current scene.
     */
    readonly currentScene: Nullable<Scene>;

    /**
     * Observable that fires whenever the current scene changes.
     */
    readonly currentSceneObservable: IReadonlyObservable<Nullable<Scene>>;
}
