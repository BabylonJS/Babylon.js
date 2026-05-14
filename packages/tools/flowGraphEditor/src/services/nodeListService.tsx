import { type IDisposable } from "core/index";

import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type IShellService, ShellServiceIdentity } from "shared-ui-components/modularTool/services/shellService";

import { AppsListRegular } from "@fluentui/react-icons";

import { NodeListComponent } from "../components/nodeList/nodeListComponent";
import { type IGlobalStateService, GlobalStateServiceIdentity } from "./globalStateService";

/**
 * Phase 2 (passthrough) side-pane service that hosts the legacy `NodeListComponent` in the
 * shell's left side pane. The component is rewritten in a later phase; for now it is wrapped
 * verbatim so the layout stays parity with the legacy editor.
 */
export const NodeListServiceDefinition: ServiceDefinition<[], [IShellService, IGlobalStateService]> = {
    friendlyName: "Node List Service",
    consumes: [ShellServiceIdentity, GlobalStateServiceIdentity],
    factory: (shellService, globalStateService) => {
        const registration = shellService.addSidePane({
            key: "FlowGraphNodeList",
            title: "Nodes",
            icon: AppsListRegular,
            horizontalLocation: "left",
            verticalLocation: "top",
            teachingMoment: false,
            content: () => <NodeListComponent globalState={globalStateService.globalState} />,
        });

        return {
            dispose: () => {
                registration.dispose();
            },
        };
    },
};
