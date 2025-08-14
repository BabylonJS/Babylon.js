import type { AdvancedDynamicTexture } from "gui/index";
import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { AppGenericRegular } from "@fluentui/react-icons";

import { Observable } from "core/Misc";
import { InterceptProperty } from "../../../instrumentation/propertyInstrumentation";
import { SceneContextIdentity } from "../../sceneContext";
import { DefaultSectionsOrder } from "./defaultSectionsMetadata";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

// Don't use instanceof in this case as we don't want to bring in the gui package just to check if the entity is an AdvancedDynamicTexture.
function IsAdvancedDynamicTexture(entity: unknown): entity is AdvancedDynamicTexture {
    return (entity as AdvancedDynamicTexture)?.constructor?.name === "AdvancedDynamicTexture";
}

export const GuiExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext]> = {
    friendlyName: "GUI Explorer",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity],
    factory: (sceneExplorerService, sceneContext) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return undefined;
        }

        const sectionRegistration = sceneExplorerService.addSection({
            displayName: "GUI",
            order: DefaultSectionsOrder.GUIs,
            getRootEntities: () => scene.textures.filter(IsAdvancedDynamicTexture),
            getEntityDisplayInfo: (texture) => {
                const onChangeObservable = new Observable<void>();

                const nameHookToken = InterceptProperty(texture, "name", {
                    afterSet: () => {
                        onChangeObservable.notifyObservers();
                    },
                });

                return {
                    get name() {
                        return texture.name;
                    },
                    onChange: onChangeObservable,
                    dispose: () => {
                        nameHookToken.dispose();
                        onChangeObservable.clear();
                    },
                };
            },
            entityIcon: () => <AppGenericRegular />,
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
