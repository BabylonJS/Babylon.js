// eslint-disable-next-line import/no-internal-modules
import type { Nullable, Observable, Scene } from "core/index";

import type { IService } from "../modularity/serviceDefinition";

// SceneContext provides the current scene, but could have different implementations depending on the context (e.g. inspector, sandbox, etc.)
export const SceneContextIdentity = Symbol("SceneScontext");
export interface ISceneContext extends IService<typeof SceneContextIdentity> {
    readonly currentScene: Nullable<Scene>;
    readonly currentSceneObservable: Observable<Nullable<Scene>>;
}
