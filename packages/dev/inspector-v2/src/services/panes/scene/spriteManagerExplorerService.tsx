import type { IDisposable, ISpriteManager, Nullable, Sprite } from "core/index";
import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneExplorerService } from "./sceneExplorerService";
import type { ISceneContext } from "../../../services/sceneContext";

import { ImageRegular } from "@fluentui/react-icons";

import { InterceptProperty } from "../../../instrumentation/propertyInstrumentation";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";
import { SceneContextIdentity } from "../../../services/sceneContext";

import "core/Sprites/spriteSceneComponent";

function IsSpriteManager(entity: ISpriteManager | Sprite): entity is ISpriteManager {
    return (entity as ISpriteManager).sprites !== undefined;
}

function IsSprite(entity: ISpriteManager | Sprite): entity is Sprite {
    return (entity as Sprite).manager !== undefined;
}

export const SpriteManagerHierarchyServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext]> = {
    friendlyName: "Sprite Manager Hierarchy",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity],
    factory: (sceneExplorerService, sceneContext) => {
        let sectionRegistration: Nullable<IDisposable> = null;
        let spriteManagerHook: Nullable<IDisposable> = null;

        const registerSpriteManagerSection = () => {
            if (!sectionRegistration) {
                sectionRegistration = sceneExplorerService.addSection<ISpriteManager | Sprite>({
                    displayName: "Sprite Managers",
                    order: 3,
                    getRootEntities: (scene) => {
                        return scene.spriteManagers ?? ([] as ISpriteManager[]);
                    },
                    getEntityChildren: (spriteEntity) => (IsSpriteManager(spriteEntity) ? spriteEntity.sprites : ([] as ISpriteManager[])),
                    getEntityParent: (spriteEntity) => (IsSprite(spriteEntity) ? spriteEntity.manager : null),
                    getEntityDisplayName: (spriteEntity) => spriteEntity.name || `Unnamed Sprite Manager (${spriteEntity.uniqueId})`,
                    entityIcon: () => <ImageRegular />,
                    getEntityAddedObservables: (scene) => [scene.onNewSpriteManagerAddedObservable],
                    getEntityRemovedObservables: (scene) => [scene.onSpriteManagerRemovedObservable],
                });
            }
        };

        if (sceneContext.currentScene) {
            // Scene.spriteManagers initialization is deferred until the first SpriteManager is created.
            if (sceneContext.currentScene.spriteManagers) {
                registerSpriteManagerSection();
            } else {
                spriteManagerHook = InterceptProperty(sceneContext.currentScene, "spriteManagers", {
                    afterSet: registerSpriteManagerSection,
                });
            }
        }

        return {
            dispose: () => {
                sectionRegistration?.dispose();
                spriteManagerHook?.dispose();
            },
        };
    },
};
