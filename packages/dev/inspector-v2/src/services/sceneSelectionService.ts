import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { type ISceneContext, SceneContextIdentity } from "./sceneContext";
import { type ISelectionService, SelectionServiceIdentity } from "./selectionService";

/**
 * Selects the scene by default when the Babylon.js Inspector starts.
 *
 * The selection service itself is product agnostic (it starts with no selection), so this Babylon.js
 * specific service owns the notion of "the scene is what is selected when nothing else is". It does not
 * produce a service contract: it only wires the scene context to the selection service at startup.
 */
export const SceneSelectionServiceDefinition: ServiceDefinition<[], [ISceneContext, ISelectionService]> = {
    friendlyName: "Scene Selection",
    consumes: [SceneContextIdentity, SelectionServiceIdentity],
    factory: (sceneContext, selectionService) => {
        // Only set the default selection if nothing was deliberately selected before this service was created.
        if (!selectionService.selectedEntity) {
            selectionService.selectedEntity = sceneContext.currentScene;
        }
    },
};
