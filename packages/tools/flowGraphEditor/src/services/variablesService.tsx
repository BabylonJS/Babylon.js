import { type IDisposable } from "core/index";

import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type IShellService, ShellServiceIdentity } from "shared-ui-components/modularTool/services/shellService";

import { BracesVariableRegular, TableSimpleRegular } from "@fluentui/react-icons";

import { VariablesPanelComponent } from "../components/variables/variablesPanelComponent";
import { type IGlobalStateService, GlobalStateServiceIdentity } from "./globalStateService";

/**
 * Hosts the {@link VariablesPanelComponent} as a left side pane named "Variables". The component
 * is reused (not duplicated) — `layout="vertical"` stacks the variable cards top-to-bottom and
 * stretches them to the pane width, and `showHeader={false}` lets the side pane's PaneHeader
 * provide the title (an "Add variable" button moves to a footer in this mode so it stays visible).
 */
export const VariablesServiceDefinition: ServiceDefinition<[], [IShellService, IGlobalStateService]> = {
    friendlyName: "Variables Service",
    consumes: [ShellServiceIdentity, GlobalStateServiceIdentity],
    factory: (shellService, globalStateService) => {
        const registration = shellService.addSidePane({
            key: "FlowGraphVariables",
            title: "Variables",
            icon: BracesVariableRegular,
            horizontalLocation: "left",
            verticalLocation: "bottom",
            teachingMoment: false,
            content: () => <VariablesPanelComponent globalState={globalStateService.globalState} layout="vertical" showHeader={false} />,
        });

        return {
            dispose: () => {
                registration.dispose();
            },
        };
    },
};
