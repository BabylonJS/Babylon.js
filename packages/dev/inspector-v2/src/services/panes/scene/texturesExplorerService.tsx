import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { ImageEditRegular, ImageRegular } from "@fluentui/react-icons";

import { DynamicTexture } from "core/Materials/Textures/dynamicTexture";
import { Observable } from "core/Misc";
import { InterceptProperty } from "../../../instrumentation/propertyInstrumentation";
import { SceneContextIdentity } from "../../sceneContext";
import { DefaultSectionsOrder } from "./defaultSectionsMetadata";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

export const TextureExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext]> = {
    friendlyName: "Texture Explorer",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity],
    factory: (sceneExplorerService, sceneContext) => {
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

                const displayNameHookToken = InterceptProperty(texture, "displayName", {
                    afterSet: () => {
                        onChangeObservable.notifyObservers();
                    },
                });

                const nameHookToken = InterceptProperty(texture, "name", {
                    afterSet: () => {
                        onChangeObservable.notifyObservers();
                    },
                });

                return {
                    get name() {
                        return texture.displayName || texture.name || `${texture.constructor?.name || "Unnamed Texture"} (${texture.uniqueId})`;
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
