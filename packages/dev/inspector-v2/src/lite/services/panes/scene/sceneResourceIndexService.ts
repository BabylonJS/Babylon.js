import { type ServiceDefinition, type IService } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { type IEngineContext, EngineContextIdentity } from "../../../engineContext";
import { LiteSceneResourceIndex } from "./sceneResources";

/**
 * The unique identity for the Inspector-owned Lite scene resource index.
 * @internal
 */
export const LiteSceneResourceIndexServiceIdentity = Symbol("LiteSceneResourceIndex");

/**
 * Provides the resource index owned by one Lite Inspector instance.
 * @internal
 */
export interface ILiteSceneResourceIndexService extends IService<typeof LiteSceneResourceIndexServiceIdentity> {
    /** The index for the inspected engine. */
    readonly index: LiteSceneResourceIndex;
}

/**
 * Creates one disposable Lite scene resource index per Inspector service container.
 * @internal
 */
export const LiteSceneResourceIndexServiceDefinition: ServiceDefinition<[ILiteSceneResourceIndexService], [IEngineContext]> = {
    friendlyName: "Babylon Lite Scene Resource Index",
    produces: [LiteSceneResourceIndexServiceIdentity],
    consumes: [EngineContextIdentity],
    factory: (engineContext) => {
        const index = new LiteSceneResourceIndex(engineContext.engine);
        return {
            index,
            dispose: () => index.dispose(),
        };
    },
};
