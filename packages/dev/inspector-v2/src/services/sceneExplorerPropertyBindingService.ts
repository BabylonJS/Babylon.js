import type { ServiceDefinition } from "../modularity/serviceDefinition";

import { SceneExplorerService } from "./panes/sceneExplorerService";
import { PropertiesService } from "./panes/properties/propertiesService";

export const SceneExplorerPropertyBindingServiceDefinition: ServiceDefinition<[], [SceneExplorerService, PropertiesService]> = {
    friendlyName: "Scene Explorer Property Binding",
    tags: ["diagnostics"],
    consumes: [SceneExplorerService, PropertiesService],
    factory: (sceneExplorerService, propertiesService) => {
        const observer = sceneExplorerService.onSelectedEntityChanged.add(() => {
            propertiesService.boundEntity = sceneExplorerService.selectedEntity;
        });

        return {
            dispose: () => observer.remove(),
        };
    },
};
