import { Button, tokens } from "@fluentui/react-components";
import { PlugConnectedRegular, PlugDisconnectedRegular } from "@fluentui/react-icons";
import { useEffect, useRef } from "react";

import { useToast } from "shared-ui-components/fluent/primitives/toast";
import { Tooltip } from "shared-ui-components/fluent/primitives/tooltip";
import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type ICliConnectionStatus, CliConnectionStatusIdentity } from "./cli/cliConnectionStatus";
import { DefaultToolbarItemOrder } from "./defaultToolbarMetadata";
import { type IShellService, ShellServiceIdentity } from "shared-ui-components/modularTool/services/shellService";

export const CliConnectionStatusServiceDefinition: ServiceDefinition<[], [IShellService, ICliConnectionStatus]> = {
    friendlyName: "CLI Connection Status",
    consumes: [ShellServiceIdentity, CliConnectionStatusIdentity],
    factory: (shellService, cliConnectionStatus) => {
        shellService.addToolbarItem({
            key: "CLI Connection Status",
            verticalLocation: "bottom",
            horizontalLocation: "right",
            teachingMoment: false,
            order: DefaultToolbarItemOrder.CliStatus,
            component: () => {
                const isConnected = useObservableState(() => cliConnectionStatus.isConnected, cliConnectionStatus.onConnectionStatusChanged);
                const { showToast } = useToast();
                const isFirstRender = useRef(true);

                useEffect(() => {
                    if (isFirstRender.current) {
                        isFirstRender.current = false;
                        return;
                    }
                    if (isConnected) {
                        showToast("Inspector bridge connected.", { intent: "success" });
                    } else {
                        showToast("Inspector bridge disconnected.", { intent: "warning" });
                    }
                }, [isConnected, showToast]);

                // Using raw Fluent Button to pass color directly to the icon.
                return (
                    <Tooltip content={isConnected ? "Connected to Inspector CLI Bridge" : "Disconnected from Inspector CLI Bridge"}>
                        <Button
                            appearance="subtle"
                            icon={
                                isConnected ? (
                                    <PlugConnectedRegular color={tokens.colorPaletteGreenForeground2} />
                                ) : (
                                    <PlugDisconnectedRegular color={tokens.colorPaletteRedForeground2} />
                                )
                            }
                            onClick={() => window.open("https://www.npmjs.com/package/@babylonjs/inspector", "_blank")}
                        />
                    </Tooltip>
                );
            },
        });
    },
};
