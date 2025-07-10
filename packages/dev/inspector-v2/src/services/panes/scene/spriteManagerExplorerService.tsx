import type { ISpriteManager, Sprite } from "core/index";
import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { LayerDiagonalPersonRegular, PersonSquareRegular } from "@fluentui/react-icons";

import { Observable } from "core/Misc";
import { InterceptProperty } from "../../../instrumentation/propertyInstrumentation";
import { SceneContextIdentity } from "../../sceneContext";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

import "core/Sprites/spriteSceneComponent";

function IsSpriteManager(entity: unknown): entity is ISpriteManager {
    return (entity as ISpriteManager).sprites !== undefined;
}

function IsSprite(entity: unknown): entity is Sprite {
    return (entity as Sprite).manager !== undefined;
}

export const SpriteManagerHierarchyServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext]> = {
    friendlyName: "Sprite Manager Hierarchy",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity],
    factory: (sceneExplorerService, sceneContext) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return void 0;
        }

        const sectionRegistration = sceneExplorerService.addSection<ISpriteManager | Sprite>({
            displayName: "Sprite Managers",
            order: 700,
            predicate: (entity) => IsSpriteManager(entity) || IsSprite(entity),
            getRootEntities: () => scene.spriteManagers ?? [],
            getEntityChildren: (spriteEntity) => (IsSpriteManager(spriteEntity) ? spriteEntity.sprites : ([] as ISpriteManager[])),
            getEntityParent: (spriteEntity) => (IsSprite(spriteEntity) ? spriteEntity.manager : null),
            getEntityDisplayInfo: (spriteEntity) => {
                const onChangeObservable = new Observable<void>();

                const nameHookToken = InterceptProperty(spriteEntity, "name", {
                    afterSet: () => onChangeObservable.notifyObservers(),
                });

                return {
                    get name() {
                        return spriteEntity.name;
                    },
                    onChange: onChangeObservable,
                    dispose: () => {
                        nameHookToken.dispose();
                        onChangeObservable.clear();
                    },
                };
            },
            entityIcon: ({ entity: spriteEntity }) => (IsSpriteManager(spriteEntity) ? <LayerDiagonalPersonRegular /> : <PersonSquareRegular />),
            getEntityAddedObservables: () => [scene.onNewSpriteManagerAddedObservable],
            getEntityRemovedObservables: () => [scene.onSpriteManagerRemovedObservable],
        });

        return {
            dispose: () => {
                sectionRegistration.dispose();
            },
        };
    },
};
