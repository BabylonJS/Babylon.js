import { type IDisposable } from "core/index";

import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type IShellService, ShellServiceIdentity } from "shared-ui-components/modularTool/services/shellService";

import { PropertyTabComponent } from "../components/propertyTab/propertyTabComponent";
import { BabylonLogo } from "../icons";
import { type IGlobalStateService, GlobalStateServiceIdentity } from "./globalStateService";

/**
 * Phase 2 (passthrough) side-pane service that hosts the legacy `PropertyTabComponent` in
 * the shell's right (top) side pane. The pane header carries the tool's name and the
 * Babylon.js logo, mirroring `packages/tools/viewer-configurator/src/configuratorService.tsx`.
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
            title: "Flow Graph Editor",
            icon: BabylonLogo,
            horizontalLocation: "right",
            verticalLocation: "top",
            teachingMoment: false,
            content: () => <PropertyTabComponent globalState={globalStateService.globalState} lockObject={globalStateService.globalState.lockObject} />,
        });

        return {
            dispose: () => {
                registration.dispose();
            },
        } satisfies IDisposable;
    },
};
