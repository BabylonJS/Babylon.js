import type { ServiceDefinition } from "../modularity/serviceDefinition";
import type { IPropertiesService } from "./panes/properties/propertiesService";
import type { ISceneExplorerService } from "./panes/sceneExplorerService";

import { PropertiesServiceIdentity } from "./panes/properties/propertiesService";
import { SceneExplorerServiceIdentity } from "./panes/sceneExplorerService";

export const SceneExplorerPropertyBindingServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, IPropertiesService]> = {
    friendlyName: "Scene Explorer Property Binding",
    consumes: [SceneExplorerServiceIdentity, PropertiesServiceIdentity],
    factory: (sceneExplorerService, propertiesService) => {
        const observer = sceneExplorerService.onSelectedEntityChanged.add(() => {
            propertiesService.boundEntity = sceneExplorerService.selectedEntity;
        });

        return {
            dispose: () => observer.remove(),
        };
    },
};
