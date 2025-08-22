import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { PaintBrushRegular } from "@fluentui/react-icons";

import { Observable } from "core/Misc";
import { InterceptProperty } from "../../../instrumentation/propertyInstrumentation";
import { SceneContextIdentity } from "../../sceneContext";
import { DefaultSectionsOrder } from "./defaultSectionsMetadata";
import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

export const MaterialExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, ISceneContext]> = {
    friendlyName: "Material Explorer",
    consumes: [SceneExplorerServiceIdentity, SceneContextIdentity],
    factory: (sceneExplorerService, sceneContext) => {
        const scene = sceneContext.currentScene;
        if (!scene) {
            return undefined;
        }

        const sectionRegistration = sceneExplorerService.addSection({
            displayName: "Materials",
            order: DefaultSectionsOrder.Materials,
            getRootEntities: () => [...scene.materials, ...scene.multiMaterials],
            getEntityDisplayInfo: (material) => {
                const onChangeObservable = new Observable<void>();

                const nameHookToken = InterceptProperty(material, "name", {
                    afterSet: () => {
                        onChangeObservable.notifyObservers();
                    },
                });

                return {
                    get name() {
                        return material.name;
                    },
                    onChange: onChangeObservable,
                    dispose: () => {
                        nameHookToken.dispose();
                        onChangeObservable.clear();
                    },
                };
            },
            entityIcon: () => <PaintBrushRegular />,
            getEntityAddedObservables: () => [scene.onNewMaterialAddedObservable],
            getEntityRemovedObservables: () => [scene.onMaterialRemovedObservable],
        });

        return {
            dispose: () => {
                sectionRegistration.dispose();
            },
        };
    },
};
