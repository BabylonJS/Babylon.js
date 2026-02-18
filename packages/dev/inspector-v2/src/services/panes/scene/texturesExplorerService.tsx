import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { IWatcherService } from "../../watcherService";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { ImageEditRegular, ImageRegular } from "@fluentui/react-icons";

import { DynamicTexture } from "core/Materials/Textures/dynamicTexture";
import { Observable } from "core/Misc/observable";
import { SceneContextIdentity } from "../../sceneContext";
import { WatcherServiceIdentity } from "../../watcherService";
import { DefaultSectionsOrder } from "./defaultSectionsMetadata";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

export const TextureExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext, IWatcherService]> = {
    friendlyName: "Texture Explorer",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity, WatcherServiceIdentity],
    factory: (sceneExplorerService, sceneContext, watcherService) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return undefined;
        }

        const sectionRegistration = sceneExplorerService.addSection({
            displayName: "Textures",
            order: DefaultSectionsOrder.Textures,
            getRootEntities: () => scene.textures.filter((texture) => texture.getClassName() !== "AdvancedDynamicTexture"),
            getEntityDisplayInfo: (texture) => {
                const onChangeObservable = new Observable<void>();

                const displayNameHookToken = watcherService.watchProperty(texture, "displayName", () => onChangeObservable.notifyObservers());

                const nameHookToken = watcherService.watchProperty(texture, "name", () => onChangeObservable.notifyObservers());

                return {
                    get name() {
                        return texture.displayName || texture.name || `${texture.getClassName() || "Unnamed Texture"} (${texture.uniqueId})`;
                    },
                    onChange: onChangeObservable,
                    dispose: () => {
                        nameHookToken.dispose();
                        displayNameHookToken.dispose();
                        onChangeObservable.clear();
                    },
                };
            },
            entityIcon: ({ entity: texture }) => (texture instanceof DynamicTexture ? <ImageEditRegular /> : <ImageRegular />),
            getEntityAddedObservables: () => [scene.onNewTextureAddedObservable],
            getEntityRemovedObservables: () => [scene.onTextureRemovedObservable],
        });

        return {
            dispose: () => {
                sectionRegistration.dispose();
            },
        };
    },
};
