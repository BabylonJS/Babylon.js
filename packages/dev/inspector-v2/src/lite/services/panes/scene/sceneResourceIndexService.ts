import { type IReadonlyObservable } from "core/index";
import { type Material, type SceneContext } from "@babylonjs/lite";
import { Observable } from "core/Misc/observable";
import { type ServiceDefinition, type IService } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { type IEngineContext, EngineContextIdentity } from "../../../engineContext";
import { type IWatcherService, WatcherServiceIdentity } from "../../../../services/watcherService";
import { SceneResourceIndex, type IMaterialResourceRecord, type ISceneResourceSnapshot, type ITextureResourceRecord } from "./sceneResources";

/**
 * The unique identity for the Inspector-owned Lite scene resource index.
 * @internal
 */
export const SceneResourceIndexServiceIdentity = Symbol("SceneResourceIndex");

/**
 * Provides the resource index owned by one Lite Inspector instance.
 * @internal
 */
export interface ISceneResourceIndexService extends IService<typeof SceneResourceIndexServiceIdentity> {
    /** Notifies after the index has applied a topology change. */
    readonly onChanged: IReadonlyObservable<void>;
    /** Notifies once while the service is being disposed. */
    readonly onDisposed: IReadonlyObservable<void>;
    /** Whether this service can still refresh and publish snapshots. */
    readonly isDisposed: boolean;
    /** Returns resources reachable from the given scene. */
    getSceneSnapshot(scene: SceneContext): ISceneResourceSnapshot;
    /** Returns a source material record when it is reachable. */
    getMaterialRecord(material: Material): IMaterialResourceRecord | undefined;
    /** Returns an exact texture wrapper record when it is reachable. */
    getTextureRecord(texture: object): ITextureResourceRecord | undefined;
    /** Rebuilds the index immediately and notifies mounted consumers. */
    refresh(): void;
}

/**
 * Creates one disposable Lite scene resource index per Inspector service container.
 * @internal
 */
export const SceneResourceIndexServiceDefinition: ServiceDefinition<[ISceneResourceIndexService], [IEngineContext, IWatcherService]> = {
    friendlyName: "Babylon Lite Scene Resource Index",
    produces: [SceneResourceIndexServiceIdentity],
    consumes: [EngineContextIdentity, WatcherServiceIdentity],
    factory: (engineContext, watcherService) => {
        const index = new SceneResourceIndex(engineContext.engine);
        const onChanged = new Observable<void>();
        const onDisposed = new Observable<void>();
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
            SceneResourceIndex.AreTopologySnapshotsEqual
        );

        return {
            getSceneSnapshot: (scene) => index.getSceneSnapshot(scene),
            getMaterialRecord: (material) => index.getMaterialRecord(material),
            getTextureRecord: (texture) => index.getTextureRecord(texture),
            onChanged,
            onDisposed,
            get isDisposed() {
                return isDisposed;
            },
            refresh: () => {
                if (!isDisposed) {
                    index.refresh();
                    onChanged.notifyObservers();
                }
            },
            dispose: () => {
                if (isDisposed) {
                    return;
                }

                isDisposed = true;
                topologyWatcher.dispose();
                onDisposed.notifyObservers();
                onDisposed.clear();
                index.dispose();
                onChanged.clear();
            },
        };
    },
};
