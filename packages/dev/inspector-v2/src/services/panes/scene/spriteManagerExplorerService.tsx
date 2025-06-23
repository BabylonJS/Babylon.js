import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneExplorerService } from "./sceneExplorerService";
import type { ISceneContext } from "../../../services/sceneContext";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";
import { SceneContextIdentity } from "../../../services/sceneContext";

import { ImageRegular } from "@fluentui/react-icons";

import type { ISpriteManager, Sprite } from "core/Sprites";

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
        if (sceneContext.currentScene?.spriteManagers !== undefined) {
            const sectionRegistration = sceneExplorerService.addSection<ISpriteManager | Sprite>({
                displayName: "Sprite Managers",
                order: 3,
                getRootEntities: (scene) => scene.spriteManagers ?? ([] as ISpriteManager[]),
                getEntityChildren: (sm) => (IsSpriteManager(sm) ? sm.sprites : ([] as ISpriteManager[])),
                getEntityParent: (sprite) => (IsSprite(sprite) ? sprite.manager : null),
                getEntityDisplayName: (sm) => sm.name || `Unnamed Sprite Manager (${sm.uniqueId})`,
                entityIcon: () => <ImageRegular />,
                getEntityAddedObservables: (scene) => [scene.onNewSpriteManagerAddedObservable],
                getEntityRemovedObservables: (scene) => [scene.onSpriteManagerRemovedObservable],
            });

            return {
                dispose: () => {
                    sectionRegistration.dispose();
                },
            };
        } else {
            return {
                dispose: () => {},
            };
        }
    },
};
