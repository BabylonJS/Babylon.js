import { type IReadonlyObservable } from "core/index";
import { Observable } from "core/Misc/observable";
import { type ServiceDefinition, type IService } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { type IEngineContext, EngineContextIdentity } from "../../../engineContext";
import { type IWatcherService, WatcherServiceIdentity } from "../../../../services/watcherService";
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
    /** Notifies after the index has applied a topology change. */
    readonly onChanged: IReadonlyObservable<void>;
}

/**
 * Creates one disposable Lite scene resource index per Inspector service container.
 * @internal
 */
export const LiteSceneResourceIndexServiceDefinition: ServiceDefinition<[ILiteSceneResourceIndexService], [IEngineContext, IWatcherService]> = {
    friendlyName: "Babylon Lite Scene Resource Index",
    produces: [LiteSceneResourceIndexServiceIdentity],
    consumes: [EngineContextIdentity, WatcherServiceIdentity],
    factory: (engineContext, watcherService) => {
        const index = new LiteSceneResourceIndex(engineContext.engine);
        const onChanged = new Observable<void>();
        let refreshPending = false;
        let isDisposed = false;
        const topologyWatcher = watcherService.watchValue(
            () => index.getTopologySnapshot(),
            () => {
                if (refreshPending || isDisposed) {
                    return;
                }

                refreshPending = true;
                queueMicrotask(() => {
                    refreshPending = false;
                    if (!isDisposed) {
                        index.refresh();
                        onChanged.notifyObservers();
                    }
                });
            },
            LiteSceneResourceIndex.AreTopologySnapshotsEqual
        );

        return {
            index,
            onChanged,
            dispose: () => {
                if (isDisposed) {
                    return;
                }

                isDisposed = true;
                topologyWatcher.dispose();
                index.dispose();
                onChanged.clear();
            },
        };
    },
};
