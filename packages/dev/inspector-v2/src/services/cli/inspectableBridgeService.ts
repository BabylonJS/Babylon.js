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
            let connected = false;
            const onConnectionStatusChanged = new Observable<boolean>();

            function setConnected(value: boolean) {
                if (connected !== value) {
                    connected = value;
                    onConnectionStatusChanged.notifyObservers(value);
                }
            }

            function sendToBridge(message: BrowserRequest) {
                ws?.send(JSON.stringify(message));
            }

            function connect() {
                if (disposed) {
                    return;
                }

                try {
                    ws = new WebSocket(`ws://127.0.0.1:${options.port}`);
                } catch {
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

            function scheduleReconnect() {
                if (disposed || reconnectTimer !== null) {
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

            // Initiate connection.
            connect();

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
                get isConnected() {
                    return connected;
                },
                onConnectionStatusChanged,
                dispose: () => {
                    disposed = true;
                    if (reconnectTimer !== null) {
                        clearTimeout(reconnectTimer);
                        reconnectTimer = null;
                    }
                    commands.clear();
                    setConnected(false);
                    onConnectionStatusChanged.clear();
                    if (ws) {
                        ws.onclose = null;
                        ws.close();
                        ws = null;
                    }
                },
            };

            return registry;
        },
    };
}
