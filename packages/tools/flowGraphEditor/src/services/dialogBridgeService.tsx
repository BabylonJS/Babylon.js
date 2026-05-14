import { type IDisposable } from "core/index";

import { Body1 } from "@fluentui/react-components";

import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type IDialogService, DialogServiceIdentity } from "shared-ui-components/modularTool/services/dialogService";

import { type IGlobalStateService, GlobalStateServiceIdentity } from "./globalStateService";

/**
 * Bridges the legacy `globalState.stateManager.onErrorMessageDialogRequiredObservable` observable
 * to the modular tool's built-in {@link IDialogService}.
 *
 * Existing call sites notify the observable to show error dialogs (legacy `MessageDialog`).
 * This service replaces the legacy renderer with the framework's `Dialog`, keeping the
 * observable-based call-site API stable.
 */
export const DialogBridgeServiceDefinition: ServiceDefinition<[], [IGlobalStateService, IDialogService]> = {
    friendlyName: "Dialog Bridge Service",
    consumes: [GlobalStateServiceIdentity, DialogServiceIdentity],
    factory: (globalStateService, dialogService) => {
        const observer = globalStateService.globalState.stateManager.onErrorMessageDialogRequiredObservable.add((message: string) => {
            dialogService.showDialog({
                type: "alert",
                intent: "error",
                title: message,
            });
        });

        return {
            dispose: () => {
                observer?.remove();
            },
        };
    },
};
