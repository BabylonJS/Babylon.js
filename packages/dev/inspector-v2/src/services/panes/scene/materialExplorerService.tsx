// eslint-disable-next-line import/no-internal-modules
import type { Observer } from "core/index";

import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { ISceneExplorerService } from "./sceneExplorerService";

import { PaintBrushRegular } from "@fluentui/react-icons";

import { SceneExplorerServiceIdentity } from "./sceneExplorerService";

export const MaterialExplorerServiceDefinition: ServiceDefinition<[], [ISceneExplorerService]> = {
    friendlyName: "Material Hierarchy",
    consumes: [SceneExplorerServiceIdentity],
    factory: (sceneExplorerService) => {
        const sectionRegistration = sceneExplorerService.addSection({
            displayName: "Materials",
            order: 2,
            getRootEntities: (scene) => scene.materials,
            getEntityDisplayName: (material) => material.name,
            entityIcon: () => <PaintBrushRegular />,
            watch: (scene, onAdded, onRemoved) => {
                const observers: Observer<any>[] = [];

                observers.push(
                    scene.onNewMaterialAddedObservable.add((material) => {
                        onAdded(material);
                    })
                );

                observers.push(
                    scene.onMaterialRemovedObservable.add((material) => {
                        onRemoved(material);
                    })
                );

                return {
                    dispose: () => {
                        for (const observer of observers) {
                            observer.remove();
                        }
                    },
                };
            },
        });

        return {
            dispose: () => {
                sectionRegistration.dispose();
            },
        };
    },
};
