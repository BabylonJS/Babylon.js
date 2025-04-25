// eslint-disable-next-line import/no-internal-modules
import type { Nullable, Observable, Scene } from "core/index";
import type { Service } from "../modularity/serviceDefinition";

export const SceneContext = Symbol("SceneScontext");
export interface SceneContext extends Service<typeof SceneContext> {
    readonly currentScene: Nullable<Scene>;
    readonly currentSceneObservable: Observable<Nullable<Scene>>;
}
