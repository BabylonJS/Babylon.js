import { useContext, useMemo } from "react";

import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type IShellService, ShellServiceIdentity } from "shared-ui-components/modularTool/services/shellService";
import { ToolContext } from "shared-ui-components/fluent/hoc/fluentToolWrapper";

import { PropertyTabComponent } from "../components/propertyTab/propertyTabComponent";
import { type IGlobalStateService, GlobalStateServiceIdentity } from "./globalStateService";

import { DocumentTextRegular } from "@fluentui/react-icons";

/**
 * Phase 2 (passthrough) side-pane service that hosts the legacy `PropertyTabComponent` in
 * the shell's right (top) side pane. The pane header carries the tool's name and the
 * Babylon.js logo, mirroring `packages/tools/viewer-configurator/src/configuratorService.tsx`.
 *
 * The pane content overrides the surrounding `ToolContext` with `size: "small"` so all shared
 * UI components inside (property lines, buttons, dropdowns, etc.) automatically use their
 * compact size, keeping the dense property layout regardless of the user's tool-wide compact
 * mode preference. Other ToolContext fields (toolName, disableCopy, useFluent) are inherited
 * from the surrounding `UXContextProvider`.
 *
 * The component is rewritten on top of `ExtensibleAccordion` in a later phase; for now it is
 * wrapped verbatim so the layout stays parity with the legacy editor.
 */
export const PropertyTabServiceDefinition: ServiceDefinition<[], [IShellService, IGlobalStateService]> = {
    friendlyName: "Property Tab Service",
    consumes: [ShellServiceIdentity, GlobalStateServiceIdentity],
    factory: (shellService, globalStateService) => {
        const registration = shellService.addSidePane({
            key: "FlowGraphProperties",
            title: "Properties",
            icon: DocumentTextRegular,
            horizontalLocation: "right",
            verticalLocation: "top",
            teachingMoment: false,
            content: () => {
                // Override the surrounding ToolContext so descendants pick up size: "small" without
                // affecting any siblings outside this pane.
                const parentToolContext = useContext(ToolContext);
                const toolContext = useMemo(() => ({ ...parentToolContext, size: "small" as const }), [parentToolContext]);
                return (
                    <ToolContext.Provider value={toolContext}>
                        <PropertyTabComponent globalState={globalStateService.globalState} lockObject={globalStateService.globalState.lockObject} />
                    </ToolContext.Provider>
                );
            },
        });

        return {
            dispose: () => {
                registration.dispose();
            },
        };
    },
};
