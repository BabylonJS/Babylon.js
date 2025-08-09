import type { ISpriteManager } from "core/index";
import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { LayerDiagonalPersonRegular, PersonSquareRegular } from "@fluentui/react-icons";

import { Observable } from "core/Misc";
import { Sprite } from "core/Sprites/sprite";
import { InterceptProperty } from "../../../instrumentation/propertyInstrumentation";
import { SceneContextIdentity } from "../../sceneContext";
import { DefaultSectionsOrder } from "./defaultSectionsMetadata";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

import "core/Sprites/spriteSceneComponent";

export const SpriteManagerExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext]> = {
    friendlyName: "Sprite Manager Explorer",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity],
    factory: (sceneExplorerService, sceneContext) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return undefined;
        }

        const sectionRegistration = sceneExplorerService.addSection<Sprite | ISpriteManager>({
            displayName: "Sprite Managers",
            order: DefaultSectionsOrder.SpriteManagers,
            getRootEntities: () => scene.spriteManagers ?? [],
            getEntityChildren: (spriteEntity) => (spriteEntity instanceof Sprite ? [] : spriteEntity.sprites),
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
            entityIcon: ({ entity: spriteEntity }) => (spriteEntity instanceof Sprite ? <PersonSquareRegular /> : <LayerDiagonalPersonRegular />),
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
