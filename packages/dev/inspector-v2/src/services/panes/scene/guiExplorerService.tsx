import type { IDisposable, IObserver, Nullable } from "core/index";

import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { AppGenericRegular } from "@fluentui/react-icons";

import { Observable } from "core/Misc";
import { InterceptProperty } from "../../../instrumentation/propertyInstrumentation";
import { SceneContextIdentity } from "../../sceneContext";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

export const GuiExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext]> = {
    friendlyName: "GUI Hierarchy",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity],
    factory: (sceneExplorerService, sceneContext) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return undefined;
        }

        let disposed = false;
        let sectionRegistration: Nullable<IDisposable> = null;
        let textureAddedObserver: Nullable<IObserver> = null;

        const addSectionAsync = async () => {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            const { AdvancedDynamicTexture } = await import("gui/2D/advancedDynamicTexture");
            if (disposed || sectionRegistration) {
                return;
            }

            sectionRegistration = sceneExplorerService.addSection({
                displayName: "GUI",
                order: 900,
                predicate: (entity) => entity instanceof AdvancedDynamicTexture,
                getRootEntities: () => scene.textures.filter((texture) => texture instanceof AdvancedDynamicTexture),
                getEntityDisplayInfo: (advancedDynamicTexture) => {
                    const onChangeObservable = new Observable<void>();

                    const nameHookToken = InterceptProperty(advancedDynamicTexture, "name", {
                        afterSet: () => {
                            onChangeObservable.notifyObservers();
                        },
                    });

                    return {
                        get name() {
                            return advancedDynamicTexture.name;
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
        };

        if (scene.textures.some((texture) => texture.getClassName() === "AdvancedDynamicTexture")) {
            // If an AdvancedDynamicTexture is already present, we can register the section immediately.
            void addSectionAsync();
        } else {
            // Otherwise, we defer the registration until an AdvancedDynamicTexture is added.
            textureAddedObserver = scene.onNewTextureAddedObservable.add((texture) => {
                if (texture.getClassName() === "AdvancedDynamicTexture") {
                    textureAddedObserver?.remove();
                    void addSectionAsync();
                }
            });
        }

        return {
            dispose: () => {
                disposed = true;
                textureAddedObserver?.remove();
                sectionRegistration?.dispose();
            },
        };
    },
};
