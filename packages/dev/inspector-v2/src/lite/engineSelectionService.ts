import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { type ISelectionService, SelectionServiceIdentity } from "../services/selectionService";
import { type IEngineContext, EngineContextIdentity } from "./engineContext";

/**
 * Selects the engine by default when the Babylon Lite Inspector starts.
 *
 * The selection service itself is product agnostic (it starts with no selection), so this Babylon Lite
 * specific service owns the notion of "the engine is what is selected when nothing else is". It does not
 * produce a service contract: it only wires the engine context to the selection service at startup.
 */
export const EngineSelectionServiceDefinition: ServiceDefinition<[], [IEngineContext, ISelectionService]> = {
    friendlyName: "Babylon Lite Engine Selection",
    consumes: [EngineContextIdentity, SelectionServiceIdentity],
    factory: (engineContext, selectionService) => {
        // Only set the default selection if nothing was deliberately selected before this service was created.
        if (!selectionService.selectedEntity) {
            selectionService.selectedEntity = engineContext.engine;
        }
    },
};
