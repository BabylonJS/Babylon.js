import { type IDisposable } from "core/index";
import { Observable } from "core/Misc/observable";
import { type BrowserRequest, type BrowserResponse, type CommandInfo } from "../../cli/protocol";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type ICliConnectionStatus, CliConnectionStatusIdentity } from "./cliConnectionStatus";
import { type IInspectableCommandRegistry, type InspectableCommandDescriptor, InspectableCommandRegistryIdentity } from "./inspectableCommandRegistry";

import { Logger } from "core/Misc/logger";

/**
 * Options for the inspectable bridge service.
 */
export interface IInspectableBridgeServiceOptions {
    /**
     * The WebSocket port for the bridge's browser port.
     */
    port: number;

    /**
     * The session display name sent to the bridge.
     */
    name: string;

    /**
     * Whether to automatically start connecting when the service is created.
     */
    autoStart: boolean;
}

/**
 * Creates the service definition for the InspectableBridgeService.
 * @param options The options for connecting to the bridge.
 * @returns A service definition that produces an IInspectableCommandRegistry.
 */
export function MakeInspectableBridgeServiceDefinition(options: IInspectableBridgeServiceOptions): ServiceDefinition<[IInspectableCommandRegistry, ICliConnectionStatus], []> {
    return {
        friendlyName: "Inspectable Bridge Service",
        produces: [InspectableCommandRegistryIdentity, CliConnectionStatusIdentity],
        factory: () => {
            const commands = new Map<string, InspectableCommandDescriptor>();
            let ws: WebSocket | null = null;
            let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
            let disposed = false;
            let enabled = options.autoStart;
            let connected = false;
            const onConnectionStatusChanged = new Observable<void>();

            function notifyStatusChanged() {
                onConnectionStatusChanged.notifyObservers();
            }

            function setConnected(value: boolean) {
                if (connected !== value) {
                    connected = value;
                    notifyStatusChanged();
                }
            }

            function sendToBridge(message: BrowserRequest) {
                ws?.send(JSON.stringify(message));
            }

            function connect() {
                if (disposed || !enabled) {
                    return;
                }

                try {
                    // NOTE: The browser unconditionally logs a console error for failed WebSocket
                    // connections at the network level. This cannot be suppressed from JavaScript.
                    ws = new WebSocket(`ws://127.0.0.1:${options.port}`);
                } catch {
                    ws = null;
                    setConnected(false);
                    Logger.Warn(`InspectableBridgeService: Failed to create WebSocket connection on port ${options.port}.`);
                    scheduleReconnect();
                    return;
                }

                ws.onopen = () => {
                    setConnected(true);
                    sendToBridge({ type: "register", name: options.name });
                };

                ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data as string);
                        void handleMessage(message);
                    } catch {
                        Logger.Warn("InspectableBridgeService: Failed to parse message from bridge.");
                    }
                };

                ws.onclose = () => {
                    ws = null;
                    setConnected(false);
                    scheduleReconnect();
                };

                ws.onerror = () => {
                    // onclose will fire after onerror, which handles reconnection.
                };
            }

            function disconnect() {
                if (reconnectTimer !== null) {
                    clearTimeout(reconnectTimer);
                    reconnectTimer = null;
                }
                if (ws) {
                    ws.onclose = null;
                    ws.close();
                    ws = null;
                }
                setConnected(false);
            }

            function scheduleReconnect() {
                if (disposed || !enabled || reconnectTimer !== null) {
                    return;
                }
                reconnectTimer = setTimeout(() => {
                    reconnectTimer = null;
                    connect();
                }, 3000);
            }

            async function handleMessage(message: BrowserResponse) {
                switch (message.type) {
                    case "listCommands": {
                        const commandList: CommandInfo[] = Array.from(commands.values()).map((cmd) => ({
                            id: cmd.id,
                            description: cmd.description,
                            args: cmd.args,
                        }));
                        sendToBridge({
                            type: "commandListResponse",
                            requestId: message.requestId,
                            commands: commandList,
                        });
                        break;
                    }
                    case "execCommand": {
                        const command = commands.get(message.commandId);
                        if (!command) {
                            sendToBridge({
                                type: "commandResponse",
                                requestId: message.requestId,
                                error: `Unknown command: ${message.commandId}`,
                            });
                            break;
                        }
                        try {
                            const result = await command.executeAsync(message.args);
                            sendToBridge({
                                type: "commandResponse",
                                requestId: message.requestId,
                                result,
                            });
                        } catch (error: unknown) {
                            sendToBridge({
                                type: "commandResponse",
                                requestId: message.requestId,
                                error: String(error),
                            });
                        }
                        break;
                    }
                }
            }

            if (enabled) {
                connect();
            }

            const registry: IInspectableCommandRegistry & ICliConnectionStatus & IDisposable = {
                addCommand(descriptor: InspectableCommandDescriptor): IDisposable {
                    if (commands.has(descriptor.id)) {
                        throw new Error(`Command '${descriptor.id}' is already registered.`);
                    }
                    commands.set(descriptor.id, descriptor);
                    return {
                        dispose: () => {
                            commands.delete(descriptor.id);
                        },
                    };
                },
                get isEnabled() {
                    return enabled;
                },
                set isEnabled(value: boolean) {
                    if (enabled !== value) {
                        enabled = value;
                        if (enabled) {
                            connect();
                        } else {
                            disconnect();
                        }
                        notifyStatusChanged();
                    }
                },
                get isConnected() {
                    return connected;
                },
                onConnectionStatusChanged,
                dispose: () => {
                    disposed = true;
                    enabled = false;
                    disconnect();
                    commands.clear();
                    onConnectionStatusChanged.clear();
                },
            };

            return registry;
        },
    };
}
