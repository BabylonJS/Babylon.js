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
            getEntityAddedObservables: (scene) => [scene.onNewMaterialAddedObservable],
            getEntityRemovedObservables: (scene) => [scene.onMaterialRemovedObservable],
        });

        return {
            dispose: () => {
                sectionRegistration.dispose();
            },
        };
    },
};
