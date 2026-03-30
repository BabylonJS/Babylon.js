import ws from "ws";
import { loadConfig } from "./config.js";

type WebSocket = ws;
type WebSocketServerType = ws.Server;

interface Session {
    id: number;
    name: string;
    connectedAt: string;
    ws: WebSocket;
}

let nextSessionId = 1;
const sessions = new Map<number, Session>();
const pendingBrowserRequests = new Map<string, (response: string) => void>();
let requestCounter = 0;

function generateRequestId(): string {
    return `bridge-req-${++requestCounter}`;
}

function startBridge(): void {
    const config = loadConfig();

    // Browser-facing WebSocket server.
    const browserWss = new ws.Server({ host: "127.0.0.1", port: config.browserPort });

    // CLI-facing WebSocket server.
    const cliWss = new ws.Server({ host: "127.0.0.1", port: config.cliPort });

    console.log(`Inspector bridge started.`);
    console.log(`  Browser port: ${config.browserPort}`);
    console.log(`  CLI port:     ${config.cliPort}`);

    browserWss.on("connection", (socket) => {
        let session: Session | null = null;

        socket.on("message", (data) => {
            let message: { type: string; name?: string; requestId?: string; commands?: unknown; result?: string; error?: string };
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
                        name: message.name ?? "Unknown",
                        connectedAt: new Date().toISOString(),
                        ws: socket,
                    };
                    sessions.set(id, session);
                    console.log(`Session ${id} registered: "${session.name}"`);
                    break;
                }
                case "commandListResponse":
                case "commandResponse": {
                    // Forward response back to the CLI that requested it.
                    const requestId = message.requestId;
                    if (requestId) {
                        const resolve = pendingBrowserRequests.get(requestId);
                        if (resolve) {
                            pendingBrowserRequests.delete(requestId);
                            resolve(JSON.stringify(message));
                        }
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
        socket.on("message", (data) => {
            let message: { type: string; sessionId?: number; commandId?: string; args?: Record<string, string> };
            try {
                message = JSON.parse(data.toString());
            } catch {
                return;
            }

            switch (message.type) {
                case "sessions": {
                    const sessionList = Array.from(sessions.values()).map((s) => ({
                        id: s.id,
                        name: s.name,
                        connectedAt: s.connectedAt,
                    }));
                    socket.send(JSON.stringify({ type: "sessionsResponse", sessions: sessionList }));
                    break;
                }
                case "commands": {
                    const session = sessions.get(message.sessionId ?? -1);
                    if (!session) {
                        socket.send(JSON.stringify({ type: "commandsResponse", error: `No session with id ${message.sessionId}` }));
                        break;
                    }
                    const requestId = generateRequestId();
                    session.ws.send(JSON.stringify({ type: "listCommands", requestId }));
                    waitForBrowserResponse(requestId).then(
                        (response) => socket.send(response),
                        () => socket.send(JSON.stringify({ type: "commandsResponse", error: "Timeout waiting for browser response" }))
                    );
                    break;
                }
                case "exec": {
                    const session = sessions.get(message.sessionId ?? -1);
                    if (!session) {
                        socket.send(JSON.stringify({ type: "execResponse", error: `No session with id ${message.sessionId}` }));
                        break;
                    }
                    const requestId = generateRequestId();
                    session.ws.send(
                        JSON.stringify({
                            type: "execCommand",
                            requestId,
                            commandId: message.commandId,
                            args: message.args,
                        })
                    );
                    waitForBrowserResponse(requestId).then(
                        (response) => socket.send(response),
                        () => socket.send(JSON.stringify({ type: "execResponse", error: "Timeout waiting for browser response" }))
                    );
                    break;
                }
                case "stop": {
                    socket.send(JSON.stringify({ type: "stopResponse", success: true }));
                    shutdown(browserWss, cliWss);
                    break;
                }
            }
        });
    });

    process.on("SIGTERM", () => shutdown(browserWss, cliWss));
    process.on("SIGINT", () => shutdown(browserWss, cliWss));
}

function waitForBrowserResponse(requestId: string, timeoutMs = 30000): Promise<string> {
    return new Promise((resolve, reject) => {
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

function shutdown(browserWss: WebSocketServerType, cliWss: WebSocketServerType): void {
    console.log("Inspector bridge shutting down.");

    for (const session of sessions.values()) {
        session.ws.close();
    }
    sessions.clear();

    browserWss.close();
    cliWss.close();

    process.exit(0);
}

startBridge();
