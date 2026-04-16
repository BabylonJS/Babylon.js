import { type IDisposable } from "core/index";
import { Observable } from "core/Misc/observable";
import { type BrowserRequest, type BrowserResponse, type CommandInfo } from "./protocol";
import { type ServiceDefinition } from "../../modularity/serviceDefinition";
import { type ICliConnectionStatus, CliConnectionStatusIdentity } from "./bridgeConnectionStatus";
import { type IBridgeCommandRegistry, type BridgeCommandDescriptor, BridgeCommandRegistryIdentity } from "./bridgeCommandRegistry";
import { Logger } from "core/Misc/logger";

/**
 * Options for the CLI bridge service.
 * @experimental
 * @internal
 */
export type BridgeServiceOptions = {
    /**
     * The WebSocket port for the bridge's browser port.
     */
    port: number;

    /**
     * The session display name sent to the bridge.
     * Can be a getter to provide a dynamic value that is re-read
     * each time the bridge queries session information.
     */
    name: string;

    /**
     * Whether to automatically start connecting when the service is created.
     */
    autoStart: boolean;
};

/**
 * Creates the service definition for the CLI Bridge Service.
 * @param options The options for connecting to the bridge.
 * @returns A service definition that produces an IBridgeCommandRegistry and ICliConnectionStatus.
 * @experimental
 * @internal
 */
export function MakeBridgeServiceDefinition(options: BridgeServiceOptions): ServiceDefinition<[IBridgeCommandRegistry, ICliConnectionStatus], []> {
    return {
        friendlyName: "CLI Bridge Service",
        produces: [BridgeCommandRegistryIdentity, CliConnectionStatusIdentity],
        factory: () => {
            const commands = new Map<string, BridgeCommandDescriptor>();
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

                // Close any existing WebSocket to avoid orphaned connections that
                // keep a stale session alive on the bridge.
                if (ws) {
                    const oldWs = ws;
                    oldWs.onopen = null;
                    oldWs.onclose = null;
                    oldWs.onmessage = null;
                    oldWs.onerror = null;
                    oldWs.close();
                    ws = null;
                }

                try {
                    // NOTE: The browser unconditionally logs a console error for failed WebSocket
                    // connections at the network level. This cannot be suppressed from JavaScript.
                    ws = new WebSocket(`ws://127.0.0.1:${options.port}`);
                } catch {
                    ws = null;
                    setConnected(false);
                    Logger.Warn(`CLIBridgeService: Failed to create WebSocket connection on port ${options.port}.`);
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
                        Logger.Warn("CLIBridgeService: Failed to parse message from bridge.");
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
                    case "getInfo": {
                        sendToBridge({
                            type: "infoResponse",
                            requestId: message.requestId,
                            name: options.name,
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

            const registry: IBridgeCommandRegistry & ICliConnectionStatus & IDisposable = {
                addCommand(descriptor: BridgeCommandDescriptor): IDisposable {
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
