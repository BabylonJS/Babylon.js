import { type IDisposable } from "core/index";

import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type IShellService, ShellServiceIdentity } from "shared-ui-components/modularTool/services/shellService";

import { GraphEditor } from "../graphEditor";
import { type IGlobalStateService, GlobalStateServiceIdentity } from "./globalStateService";

/**
 * Phase 1 (passthrough) central content service.
 *
 * Registers the existing legacy `<GraphEditor />` class component as the shell's central
 * content. Subsequent phases will decompose this into a leaner central component plus
 * dedicated side-pane services for the node list, property tab, scene preview, etc.
 */
export const CentralGraphServiceDefinition: ServiceDefinition<[], [IShellService, IGlobalStateService]> = {
    friendlyName: "Central Graph Service",
    consumes: [ShellServiceIdentity, GlobalStateServiceIdentity],
    factory: (shellService, globalStateService) => {
        const registration = shellService.addCentralContent({
            key: "FlowGraphEditor",
            component: () => <GraphEditor globalState={globalStateService.globalState} />,
        });

        return {
            dispose: () => {
                registration.dispose();
            },
        };
    },
};
