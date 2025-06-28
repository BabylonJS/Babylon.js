import type { IDisposable, IObserver, ISpriteManager, Scene, Sprite } from "core/index";
import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { LayerDiagonalPersonRegular, PersonSquareRegular } from "@fluentui/react-icons";

import { Observable } from "core/Misc/observable";
import { InterceptProperty } from "../../../instrumentation/propertyInstrumentation";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

import "core/Sprites/spriteSceneComponent";

function IsSpriteManager(entity: ISpriteManager | Sprite): entity is ISpriteManager {
    return (entity as ISpriteManager).sprites !== undefined;
}

function IsSprite(entity: ISpriteManager | Sprite): entity is Sprite {
    return (entity as Sprite).manager !== undefined;
}

export const SpriteManagerHierarchyServiceDefinition: ServiceDefinition<[], [ISceneExplorerService]> = {
    friendlyName: "Sprite Manager Hierarchy",
    consumes: [SceneExplorerServiceIdentity],
    factory: (sceneExplorerService) => {
        const deferredObservableMap = new Map<
            Scene,
            {
                onNewSpriteManagerAddedObservable?: Observable<ISpriteManager>;
                onSpriteManagerRemovedObservable?: Observable<ISpriteManager>;
                onNewSpriteManagerAddedObserver?: IObserver;
                onSpriteManagerRemovedObserver?: IObserver;
                onNewSpriteManagerAddedObservableHook?: IDisposable;
                onSpriteManagerRemovedObservableHook?: IDisposable;
            }
        >();

        const getOrCreateDeferredObservables = (scene: Scene) => {
            let observables = deferredObservableMap.get(scene);
            if (!observables) {
                deferredObservableMap.set(scene, (observables = {}));
            }
            return observables;
        };

        const sectionRegistration = sceneExplorerService.addSection<ISpriteManager | Sprite>({
            displayName: "Sprite Managers",
            order: 3,
            getRootEntities: (scene) => {
                if (!scene.spriteManagers) {
                    const deferredObservables = getOrCreateDeferredObservables(scene);

                    deferredObservables.onNewSpriteManagerAddedObservableHook = InterceptProperty(scene, "onNewSpriteManagerAddedObservable", {
                        afterSet: () => {
                            deferredObservables.onNewSpriteManagerAddedObserver = scene.onNewSpriteManagerAddedObservable.add((spriteManager) => {
                                deferredObservables.onNewSpriteManagerAddedObservable?.notifyObservers(spriteManager);
                            });
                            scene.onDisposeObservable.addOnce(() => deferredObservables.onNewSpriteManagerAddedObserver?.remove());
                            deferredObservables.onNewSpriteManagerAddedObservableHook?.dispose();
                        },
                    });

                    deferredObservables.onSpriteManagerRemovedObservableHook = InterceptProperty(scene, "onSpriteManagerRemovedObservable", {
                        afterSet: () => {
                            deferredObservables.onSpriteManagerRemovedObserver = scene.onSpriteManagerRemovedObservable.add((spriteManager) => {
                                deferredObservables.onSpriteManagerRemovedObservable?.notifyObservers(spriteManager);
                            });
                            scene.onDisposeObservable.addOnce(() => deferredObservables.onSpriteManagerRemovedObserver?.remove());
                            deferredObservables.onSpriteManagerRemovedObservableHook?.dispose();
                        },
                    });
                }

                return scene.spriteManagers ?? ([] as ISpriteManager[]);
            },
            getEntityChildren: (spriteEntity) => (IsSpriteManager(spriteEntity) ? spriteEntity.sprites : ([] as ISpriteManager[])),
            getEntityParent: (spriteEntity) => (IsSprite(spriteEntity) ? spriteEntity.manager : null),
            getEntityDisplayName: (spriteEntity) => spriteEntity.name || `Unnamed Sprite Manager (${spriteEntity.uniqueId})`,
            entityIcon: ({ entity: spriteEntity }) => (IsSpriteManager(spriteEntity) ? <LayerDiagonalPersonRegular /> : <PersonSquareRegular />),
            getEntityAddedObservables: (scene) => {
                const deferredObservables = getOrCreateDeferredObservables(scene);
                if (!deferredObservables.onNewSpriteManagerAddedObservable) {
                    deferredObservables.onNewSpriteManagerAddedObservable = new Observable<ISpriteManager>();
                }
                return [deferredObservables.onNewSpriteManagerAddedObservable];
            },
            getEntityRemovedObservables: (scene) => {
                const deferredObservables = getOrCreateDeferredObservables(scene);
                if (!deferredObservables.onSpriteManagerRemovedObservable) {
                    deferredObservables.onSpriteManagerRemovedObservable = new Observable<ISpriteManager>();
                }
                return [deferredObservables.onSpriteManagerRemovedObservable];
            },
        });

        return {
            dispose: () => {
                sectionRegistration?.dispose();
                for (const deferredObservables of deferredObservableMap.values()) {
                    deferredObservables.onNewSpriteManagerAddedObservable?.clear();
                    deferredObservables.onSpriteManagerRemovedObservable?.clear();
                    deferredObservables.onNewSpriteManagerAddedObserver?.remove();
                    deferredObservables.onSpriteManagerRemovedObserver?.remove();
                    deferredObservables.onNewSpriteManagerAddedObservableHook?.dispose();
                    deferredObservables.onSpriteManagerRemovedObservableHook?.dispose();
                }
            },
        };
    },
};
