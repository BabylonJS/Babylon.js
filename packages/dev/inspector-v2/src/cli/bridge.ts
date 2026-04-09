/* eslint-disable no-console */
import { fileURLToPath } from "url";
import { type WebSocket, WebSocketServer } from "./webSocket.js";
import { LoadConfig } from "./config.js";
import { type BrowserRequest, type BrowserResponse, type CliRequest, type CliResponse, type SessionInfo } from "./protocol.js";

interface ISession extends SessionInfo {
    /** The WebSocket connection for this session. */
    ws: WebSocket;
}

/**
 * Configuration for starting the bridge.
 */
export interface IBridgeConfig {
    /** WebSocket port for browser sessions. Use 0 for OS-assigned port. */
    browserPort: number;
    /** WebSocket port for CLI connections. Use 0 for OS-assigned port. */
    cliPort: number;
    /** Timeout in ms for waiting for an initial session on a sessions request. Defaults to 5000. */
    sessionWaitTimeoutMs?: number;
}

/**
 * Handle returned by {@link startBridge} to control and inspect the running bridge.
 */
export interface IBridgeHandle {
    /** The actual port the browser WebSocket server is listening on. */
    browserPort: number;
    /** The actual port the CLI WebSocket server is listening on. */
    cliPort: number;
    /** Shuts down the bridge, closing all connections and servers. */
    shutdown: () => void;
}

/**
 * Starts the Inspector bridge with the given configuration.
 * @param config The ports to listen on. Use port 0 for OS-assigned ports.
 * @returns A promise that resolves with a handle to control the running bridge.
 */
export async function StartBridge(config: IBridgeConfig): Promise<IBridgeHandle> {
    let nextSessionId = 1;
    const sessions = new Map<number, ISession>();
    const pendingBrowserRequests = new Map<string, (response: string) => void>();
    const sessionAddedListeners: (() => void)[] = [];
    let requestCounter = 0;

    function generateRequestId(): string {
        return `bridge-req-${++requestCounter}`;
    }

    const sessionWaitTimeout = config.sessionWaitTimeoutMs ?? 5000;

    async function waitForSession(): Promise<void> {
        if (sessions.size > 0) {
            return;
        }
        return await new Promise<void>((resolve) => {
            const timer = setTimeout(() => {
                const index = sessionAddedListeners.indexOf(listener);
                if (index !== -1) {
                    sessionAddedListeners.splice(index, 1);
                }
                resolve();
            }, sessionWaitTimeout);

            const listener = () => {
                clearTimeout(timer);
                const index = sessionAddedListeners.indexOf(listener);
                if (index !== -1) {
                    sessionAddedListeners.splice(index, 1);
                }
                resolve();
            };
            sessionAddedListeners.push(listener);
        });
    }

    async function waitForBrowserResponse(requestId: string, timeoutMs = 30000): Promise<string> {
        return await new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                pendingBrowserRequests.delete(requestId);
                reject(new Error("Timeout"));
            }, timeoutMs);

            pendingBrowserRequests.set(requestId, (response) => {
                clearTimeout(timer);
                resolve(response);
            });
        });
    }

    // Browser-facing WebSocket server.
    const browserWss = new WebSocketServer({ host: "127.0.0.1", port: config.browserPort });

    // CLI-facing WebSocket server.
    const cliWss = new WebSocketServer({ host: "127.0.0.1", port: config.cliPort });

    browserWss.on("connection", (socket) => {
        let session: ISession | null = null;

        socket.on("message", (data) => {
            let message: BrowserRequest;
            try {
                message = JSON.parse(data.toString());
            } catch {
                return;
            }

            switch (message.type) {
                case "register": {
                    const id = nextSessionId++;
                    session = {
                        id,
                        name: message.name,
                        connectedAt: new Date().toISOString(),
                        ws: socket,
                    };
                    sessions.set(id, session);
                    console.log(`Session ${id} registered: "${session.name}"`);
                    for (const listener of sessionAddedListeners.splice(0)) {
                        listener();
                    }
                    break;
                }
                case "commandListResponse":
                case "commandResponse": {
                    // Forward response back to the CLI that requested it.
                    const resolve = pendingBrowserRequests.get(message.requestId);
                    if (resolve) {
                        pendingBrowserRequests.delete(message.requestId);
                        resolve(JSON.stringify(message));
                    }
                    break;
                }
            }
        });

        socket.on("close", () => {
            if (session) {
                console.log(`Session ${session.id} disconnected: "${session.name}"`);
                sessions.delete(session.id);
            }
        });
    });

    cliWss.on("connection", (socket) => {
        socket.on("message", async (data) => {
            let message: CliRequest;
            try {
                message = JSON.parse(data.toString());
            } catch {
                return;
            }

            function sendCliResponse(response: CliResponse) {
                socket.send(JSON.stringify(response));
            }

            function sendBrowserRequest(target: ISession, request: BrowserResponse) {
                target.ws.send(JSON.stringify(request));
            }

            switch (message.type) {
                case "sessions": {
                    // Wait for at least one session to connect before responding.
                    await waitForSession();
                    const sessionList: SessionInfo[] = Array.from(sessions.values()).map((s) => ({
                        id: s.id,
                        name: s.name,
                        connectedAt: s.connectedAt,
                    }));
                    sendCliResponse({ type: "sessionsResponse", sessions: sessionList });
                    break;
                }
                case "commands": {
                    const session = sessions.get(message.sessionId);
                    if (!session) {
                        sendCliResponse({ type: "commandsResponse", error: `No session with id ${message.sessionId}` });
                        break;
                    }
                    const requestId = generateRequestId();
                    sendBrowserRequest(session, { type: "listCommands", requestId });
                    try {
                        const response = await waitForBrowserResponse(requestId);
                        socket.send(response);
                    } catch {
                        sendCliResponse({ type: "commandsResponse", error: "Timeout waiting for browser response" });
                    }
                    break;
                }
                case "exec": {
                    const session = sessions.get(message.sessionId);
                    if (!session) {
                        sendCliResponse({ type: "execResponse", error: `No session with id ${message.sessionId}` });
                        break;
                    }
                    const requestId = generateRequestId();
                    sendBrowserRequest(session, {
                        type: "execCommand",
                        requestId,
                        commandId: message.commandId,
                        args: message.args,
                    });
                    try {
                        const response = await waitForBrowserResponse(requestId);
                        socket.send(response);
                    } catch {
                        sendCliResponse({ type: "execResponse", error: "Timeout waiting for browser response" });
                    }
                    break;
                }
                case "stop": {
                    sendCliResponse({ type: "stopResponse", success: true });
                    shutdown();
                    break;
                }
            }
        });
    });

    function shutdown(): void {
        console.log("Inspector bridge shutting down.");

        for (const session of sessions.values()) {
            session.ws.close();
        }
        sessions.clear();

        browserWss.close();
        cliWss.close();
    }

    // Wait for both servers to be listening before returning.
    await Promise.all([new Promise<void>((resolve) => browserWss.on("listening", resolve)), new Promise<void>((resolve) => cliWss.on("listening", resolve))]);

    const actualBrowserPort = (browserWss.address() as import("net").AddressInfo).port;
    const actualCliPort = (cliWss.address() as import("net").AddressInfo).port;

    console.log(`Inspector bridge started.`);
    console.log(`  Browser port: ${actualBrowserPort}`);
    console.log(`  CLI port:     ${actualCliPort}`);

    return {
        browserPort: actualBrowserPort,
        cliPort: actualCliPort,
        shutdown,
    };
}

// Auto-start when run directly (not when imported for testing).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    void (async () => {
        const handle = await StartBridge(LoadConfig());
        process.on("SIGTERM", () => handle.shutdown());
        process.on("SIGINT", () => handle.shutdown());
    })();
}
