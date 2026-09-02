import { type EngineContext } from "@babylonjs/lite";

import { type IService } from "shared-ui-components/modularTool/modularity/serviceDefinition";

/**
 * The unique identity symbol for the Babylon Lite engine context service.
 */
export const EngineContextIdentity = Symbol("EngineContext");

/**
 * EngineContext provides the Babylon Lite engine being inspected. It is the Babylon Lite counterpart of
 * `ISceneContext` (which provides the current `Scene` to Babylon.js Inspector services), and it is the
 * shared dependency for all Babylon Lite specific Inspector services.
 *
 * The engine is fixed for the lifetime of the Inspector session (a new Inspector is created for each
 * engine), so unlike `ISceneContext` there is no change observable.
 */
export interface IEngineContext extends IService<typeof EngineContextIdentity> {
    /**
     * Gets the Babylon Lite engine being inspected.
     */
    readonly engine: EngineContext;
}
