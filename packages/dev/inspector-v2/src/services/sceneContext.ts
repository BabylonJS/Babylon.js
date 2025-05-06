// eslint-disable-next-line import/no-internal-modules
import type { Nullable, Observable, Scene } from "core/index";

import type { Service } from "../modularity/serviceDefinition";

// SceneContext provides the current scene, but could have different implementations depending on the context (e.g. inspector, sandbox, etc.)
export const SceneContext = Symbol("SceneScontext");
export interface SceneContext extends Service<typeof SceneContext> {
    readonly currentScene: Nullable<Scene>;
    readonly currentSceneObservable: Observable<Nullable<Scene>>;
}
