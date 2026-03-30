import type { IDisposable } from "core/index";
import type { ServiceDefinition } from "../../modularity/serviceDefinition";

import type { IInspectableCommandRegistry, InspectableCommandDescriptor } from "./inspectableCommandRegistry";

import { Logger } from "core/Misc/logger";
import { InspectableCommandRegistryIdentity } from "./inspectableCommandRegistry";

/**
 * Options for the inspectable bridge service.
 */
export interface InspectableBridgeServiceOptions {
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
export function MakeInspectableBridgeServiceDefinition(options: InspectableBridgeServiceOptions): ServiceDefinition<[IInspectableCommandRegistry], []> {
    return {
        friendlyName: "Inspectable Bridge Service",
        produces: [InspectableCommandRegistryIdentity],
        factory: () => {
            const commands = new Map<string, InspectableCommandDescriptor>();
            let ws: WebSocket | null = null;
            let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
            let disposed = false;

            function connect() {
                if (disposed) {
                    return;
                }

                try {
                    ws = new WebSocket(`ws://localhost:${options.port}`);
                } catch {
                    scheduleReconnect();
                    return;
                }

                ws.onopen = () => {
                    ws?.send(JSON.stringify({ type: "register", name: options.name }));
                };

                ws.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data as string);
                        handleMessage(message);
                    } catch {
                        Logger.Warn("InspectableBridgeService: Failed to parse message from bridge.");
                    }
                };

                ws.onclose = () => {
                    ws = null;
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

            function handleMessage(message: { type: string; requestId?: string; commandId?: string; args?: Record<string, string> }) {
                switch (message.type) {
                    case "listCommands": {
                        const commandList = Array.from(commands.values()).map((cmd) => ({
                            id: cmd.id,
                            description: cmd.description,
                            args: cmd.args,
                        }));
                        ws?.send(
                            JSON.stringify({
                                type: "commandListResponse",
                                requestId: message.requestId,
                                commands: commandList,
                            })
                        );
                        break;
                    }
                    case "execCommand": {
                        const command = commands.get(message.commandId ?? "");
                        if (!command) {
                            ws?.send(
                                JSON.stringify({
                                    type: "commandResponse",
                                    requestId: message.requestId,
                                    error: `Unknown command: ${message.commandId}`,
                                })
                            );
                            break;
                        }
                        command
                            .execute(message.args ?? {})
                            .then((result) => {
                                ws?.send(
                                    JSON.stringify({
                                        type: "commandResponse",
                                        requestId: message.requestId,
                                        result,
                                    })
                                );
                            })
                            .catch((error: unknown) => {
                                ws?.send(
                                    JSON.stringify({
                                        type: "commandResponse",
                                        requestId: message.requestId,
                                        error: String(error),
                                    })
                                );
                            });
                        break;
                    }
                }
            }

            // Initiate connection.
            connect();

            const registry: IInspectableCommandRegistry & IDisposable = {
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
                dispose: () => {
                    disposed = true;
                    if (reconnectTimer !== null) {
                        clearTimeout(reconnectTimer);
                        reconnectTimer = null;
                    }
                    commands.clear();
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
