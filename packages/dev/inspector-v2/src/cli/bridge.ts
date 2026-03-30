/* eslint-disable no-console */
import ws from "ws";
import { LoadConfig } from "./config.js";
import type { BrowserRequest, BrowserResponse, CliRequest, CliResponse, SessionInfo } from "./protocol.js";

type WebSocket = ws;
type WebSocketServerType = ws.Server;

interface ISession extends SessionInfo {
    /** The WebSocket connection for this session. */
    ws: WebSocket;
}

let NextSessionId = 1;
const Sessions = new Map<number, ISession>();
const PendingBrowserRequests = new Map<string, (response: string) => void>();
let RequestCounter = 0;

function GenerateRequestId(): string {
    return `bridge-req-${++RequestCounter}`;
}

function StartBridge(): void {
    const config = LoadConfig();

    // Browser-facing WebSocket server.
    const browserWss = new ws.Server({ host: "127.0.0.1", port: config.browserPort });

    // CLI-facing WebSocket server.
    const cliWss = new ws.Server({ host: "127.0.0.1", port: config.cliPort });

    console.log(`Inspector bridge started.`);
    console.log(`  Browser port: ${config.browserPort}`);
    console.log(`  CLI port:     ${config.cliPort}`);

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
                    const id = NextSessionId++;
                    session = {
                        id,
                        name: message.name,
                        connectedAt: new Date().toISOString(),
                        ws: socket,
                    };
                    Sessions.set(id, session);
                    console.log(`Session ${id} registered: "${session.name}"`);
                    break;
                }
                case "commandListResponse":
                case "commandResponse": {
                    // Forward response back to the CLI that requested it.
                    const resolve = PendingBrowserRequests.get(message.requestId);
                    if (resolve) {
                        PendingBrowserRequests.delete(message.requestId);
                        resolve(JSON.stringify(message));
                    }
                    break;
                }
            }
        });

        socket.on("close", () => {
            if (session) {
                console.log(`Session ${session.id} disconnected: "${session.name}"`);
                Sessions.delete(session.id);
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
                    const sessionList: SessionInfo[] = Array.from(Sessions.values()).map((s) => ({
                        id: s.id,
                        name: s.name,
                        connectedAt: s.connectedAt,
                    }));
                    sendCliResponse({ type: "sessionsResponse", sessions: sessionList });
                    break;
                }
                case "commands": {
                    const session = Sessions.get(message.sessionId);
                    if (!session) {
                        sendCliResponse({ type: "commandsResponse", error: `No session with id ${message.sessionId}` });
                        break;
                    }
                    const requestId = GenerateRequestId();
                    sendBrowserRequest(session, { type: "listCommands", requestId });
                    try {
                        const response = await WaitForBrowserResponse(requestId);
                        socket.send(response);
                    } catch {
                        sendCliResponse({ type: "commandsResponse", error: "Timeout waiting for browser response" });
                    }
                    break;
                }
                case "exec": {
                    const session = Sessions.get(message.sessionId);
                    if (!session) {
                        sendCliResponse({ type: "execResponse", error: `No session with id ${message.sessionId}` });
                        break;
                    }
                    const requestId = GenerateRequestId();
                    sendBrowserRequest(session, {
                        type: "execCommand",
                        requestId,
                        commandId: message.commandId,
                        args: message.args,
                    });
                    try {
                        const response = await WaitForBrowserResponse(requestId);
                        socket.send(response);
                    } catch {
                        sendCliResponse({ type: "execResponse", error: "Timeout waiting for browser response" });
                    }
                    break;
                }
                case "stop": {
                    sendCliResponse({ type: "stopResponse", success: true });
                    Shutdown(browserWss, cliWss);
                    break;
                }
            }
        });
    });

    process.on("SIGTERM", () => Shutdown(browserWss, cliWss));
    process.on("SIGINT", () => Shutdown(browserWss, cliWss));
}

async function WaitForBrowserResponse(requestId: string, timeoutMs = 30000): Promise<string> {
    return await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            PendingBrowserRequests.delete(requestId);
            reject(new Error("Timeout"));
        }, timeoutMs);

        PendingBrowserRequests.set(requestId, (response) => {
            clearTimeout(timer);
            resolve(response);
        });
    });
}

function Shutdown(browserWss: WebSocketServerType, cliWss: WebSocketServerType): void {
    console.log("Inspector bridge shutting down.");

    for (const session of Sessions.values()) {
        session.ws.close();
    }
    Sessions.clear();

    browserWss.close();
    cliWss.close();

    process.exit(0);
}

StartBridge();
