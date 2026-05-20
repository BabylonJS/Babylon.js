import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type IToastService, ToastServiceIdentity } from "shared-ui-components/modularTool/services/toastService";

import { type IGlobalStateService, GlobalStateServiceIdentity } from "./globalStateService";

/**
 * Bridges the legacy `globalState.onToastNotification` observable to the modular tool's
 * built-in {@link IToastService}.
 *
 * Existing call sites use `ShowToast(globalState, message, severity)` (see
 * `components/toast/toastComponent.tsx`) which notifies the observable. This service
 * replaces the legacy `<ToastContainerComponent>` renderer with the framework's
 * `ToastProvider`, keeping the call-site API stable while removing the local container.
 */
export const ToastBridgeServiceDefinition: ServiceDefinition<[], [IGlobalStateService, IToastService]> = {
    friendlyName: "Toast Bridge Service",
    consumes: [GlobalStateServiceIdentity, ToastServiceIdentity],
    factory: (globalStateService, toastService) => {
        const observer = globalStateService.globalState.onToastNotification.add((data) => {
            toastService.showToast(data.message, { intent: data.severity });
        });

        return {
            dispose: () => {
                observer?.remove();
            },
        };
    },
};
