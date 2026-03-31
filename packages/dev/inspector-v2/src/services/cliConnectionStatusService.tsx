import { PlugConnectedRegular, PlugDisconnectedRegular } from "@fluentui/react-icons";

import { Button } from "shared-ui-components/fluent/primitives/button";
import { Tooltip } from "shared-ui-components/fluent/primitives/tooltip";
import { useObservableState } from "../hooks/observableHooks";
import { type ServiceDefinition } from "../modularity/serviceDefinition";
import { type ICliConnectionStatus, CliConnectionStatusIdentity } from "./cli/cliConnectionStatus";
import { DefaultToolbarItemOrder } from "./defaultToolbarMetadata";
import { type IShellService, ShellServiceIdentity } from "./shellService";

export const CliConnectionStatusServiceDefinition: ServiceDefinition<[], [IShellService, ICliConnectionStatus]> = {
    friendlyName: "CLI Connection Status",
    consumes: [ShellServiceIdentity, CliConnectionStatusIdentity],
    factory: (shellService, cliConnectionStatus) => {
        shellService.addToolbarItem({
            key: "CLI Connection Status",
            verticalLocation: "bottom",
            horizontalLocation: "right",
            order: DefaultToolbarItemOrder.Feedback - 10,
            component: () => {
                const isConnected = useObservableState(() => cliConnectionStatus.isConnected, cliConnectionStatus.onConnectionStatusChanged);

                return (
                    <Tooltip content={isConnected ? "Connected to Inspector CLI Bridge" : "Disconnected from Inspector CLI Bridge"}>
                        <Button
                            appearance="subtle"
                            icon={isConnected ? PlugConnectedRegular : PlugDisconnectedRegular}
                            onClick={() => window.open("https://www.npmjs.com/package/@babylonjs/inspector", "_blank")}
                        />
                    </Tooltip>
                );
            },
        });
    },
};
