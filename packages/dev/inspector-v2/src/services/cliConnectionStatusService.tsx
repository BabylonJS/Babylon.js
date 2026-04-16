import { Body1, Button, makeStyles, tokens } from "@fluentui/react-components";
import { PlugConnectedCheckmarkRegular, PlugConnectedRegular, PlugDisconnectedRegular } from "@fluentui/react-icons";
import { useEffect, useRef, useState } from "react";

import { Link } from "shared-ui-components/fluent/primitives/link";
import { useToast } from "shared-ui-components/fluent/primitives/toast";
import { Tooltip } from "shared-ui-components/fluent/primitives/tooltip";
import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type ICliConnectionStatus, CliConnectionStatusIdentity } from "./cli/cliConnectionStatus";
import { DefaultToolbarItemOrder } from "./defaultToolbarMetadata";
import { type IShellService, ShellServiceIdentity } from "shared-ui-components/modularTool/services/shellService";

const DocUrl = "https://www.npmjs.com/package/@babylonjs/inspector#inspector-cli";

const useStyles = makeStyles({
    tooltipContent: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXS,
    },
});

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
                const classes = useStyles();
                const isEnabled = useObservableState(() => cliConnectionStatus.isEnabled, cliConnectionStatus.onConnectionStatusChanged);
                const isConnected = useObservableState(() => cliConnectionStatus.isConnected, cliConnectionStatus.onConnectionStatusChanged);
                const { showToast } = useToast();
                const isFirstRender = useRef(true);
                const [connectingIconToggle, setConnectingIconToggle] = useState(false);
                const connecting = isEnabled && !isConnected;

                useEffect(() => {
                    if (!connecting) {
                        return;
                    }
                    const interval = setInterval(() => {
                        setConnectingIconToggle((prev) => !prev);
                    }, 700);
                    return () => clearInterval(interval);
                }, [connecting]);

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

                let icon: JSX.Element;
                let statusText: string;

                if (!isEnabled) {
                    icon = <PlugDisconnectedRegular color={tokens.colorNeutralForeground4} />;
                    statusText = "Inspector CLI bridge disabled — click to connect";
                } else if (!isConnected) {
                    icon = connectingIconToggle ? (
                        <PlugConnectedRegular color={tokens.colorPaletteYellowForeground2} />
                    ) : (
                        <PlugDisconnectedRegular color={tokens.colorPaletteYellowForeground2} />
                    );
                    statusText = "Connecting to Inspector CLI bridge — click to disconnect";
                } else {
                    icon = <PlugConnectedCheckmarkRegular color={tokens.colorPaletteGreenForeground2} />;
                    statusText = "Connected to Inspector CLI bridge — click to disconnect";
                }

                const tooltipContent = (
                    <div className={classes.tooltipContent}>
                        <Body1>{statusText}</Body1>
                        <Link url={DocUrl} value="Inspector CLI documentation" />
                    </div>
                );

                // Using raw Fluent Button for custom icon coloring per connection state.
                return (
                    <Tooltip content={tooltipContent}>
                        <Button
                            appearance="subtle"
                            aria-label={statusText}
                            icon={icon}
                            onClick={() => {
                                cliConnectionStatus.isEnabled = !cliConnectionStatus.isEnabled;
                            }}
                        />
                    </Tooltip>
                );
            },
        });
    },
};
