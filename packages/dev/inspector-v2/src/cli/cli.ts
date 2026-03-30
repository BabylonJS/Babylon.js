import { spawn } from "child_process";
import { parseArgs } from "util";
import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";
import ws from "ws";
import { loadConfig } from "./config.js";
import type { CliRequest, CliResponse, CommandsResponse, SessionsResponse } from "./protocol.js";

type WebSocket = ws;

const config = loadConfig();

const HELP_TEXT = `babylon-inspector — Interact with running Babylon.js scenes from the terminal.

USAGE
  babylon-inspector [options]

OPTIONS
  --help                   Show this help message.
  --sessions               List active browser sessions connected to the bridge.
  --stop                   Stop the bridge process.
  --commands <session-id>  List commands available from a specific session.
                           Use --<command-id> --help for help on a specific command.

CONFIGURATION
  Place a .babyloninspector JSON file anywhere in the directory parent chain:
    { "browserPort": 4400, "cliPort": 4401 }

EXAMPLES
  babylon-inspector --sessions
  babylon-inspector --commands 1
`;

interface ParsedArgs {
    help: boolean;
    sessions: boolean;
    stop: boolean;
    commands?: string;
    bridgeScript?: string;
}

function parseCliArgs(): ParsedArgs {
    const { values } = parseArgs({
        options: {
            help: { type: "boolean", default: false },
            sessions: { type: "boolean", default: false },
            stop: { type: "boolean", default: false },
            commands: { type: "string" },
            "bridge-script": { type: "string" },
        },
        strict: false,
        allowPositionals: true,
    });

    return {
        help: !!values.help,
        sessions: !!values.sessions,
        stop: !!values.stop,
        commands: values.commands as string | undefined,
        bridgeScript: values["bridge-script"] as string | undefined,
    };
}

function connectToBridge(port: number): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
        const socket = new ws(`ws://127.0.0.1:${port}`);
        socket.on("open", () => resolve(socket));
        socket.on("error", (err) => reject(err));
    });
}

function sendAndReceive<T extends CliResponse>(socket: WebSocket, message: CliRequest): Promise<T> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error("Timeout waiting for bridge response."));
        }, 15000);

        socket.once("message", (data) => {
            clearTimeout(timeout);
            try {
                resolve(JSON.parse(data.toString()) as T);
            } catch {
                reject(new Error("Failed to parse bridge response."));
            }
        });

        socket.send(JSON.stringify(message));
    });
}

function spawnBridge(bridgeScript?: string): void {
    const bridgePath = bridgeScript
        ? resolve(bridgeScript)
        : join(dirname(fileURLToPath(import.meta.url)), "inspector-bridge.mjs");
    const child = spawn(process.execPath, [bridgePath], {
        detached: true,
        stdio: "ignore",
    });
    child.unref();
}

async function ensureBridge(port: number, bridgeScript?: string, maxRetries = 10, retryDelayMs = 500): Promise<WebSocket> {
    try {
        return await connectToBridge(port);
    } catch {
        // Bridge not running — spawn it.
        spawnBridge(bridgeScript);
    }

    for (let i = 0; i < maxRetries; i++) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        try {
            return await connectToBridge(port);
        } catch {
            // Keep retrying.
        }
    }

    throw new Error(`Unable to connect to the Inspector bridge on port ${port} after spawning it.`);
}

async function main(): Promise<void> {
    const args = parseCliArgs();

    if (args.help) {
        console.log(HELP_TEXT);
        return;
    }

    if (args.sessions) {
        const socket = await ensureBridge(config.cliPort, args.bridgeScript);
        try {
            const response = await sendAndReceive<SessionsResponse>(socket, { type: "sessions" });
            if (response.sessions.length === 0) {
                console.log("No active sessions.");
            } else {
                console.log("Active sessions:");
                for (const session of response.sessions) {
                    console.log(`  [${session.id}] ${session.name} (connected: ${session.connectedAt})`);
                }
            }
        } finally {
            socket.close();
        }
        return;
    }

    if (args.stop) {
        try {
            const socket = await connectToBridge(config.cliPort);
            await sendAndReceive(socket, { type: "stop" });
            socket.close();
            console.log("Bridge stopped.");
        } catch {
            console.log("Bridge is not running.");
        }
        return;
    }

    if (args.commands !== undefined) {
        const sessionId = parseInt(args.commands, 10);
        if (isNaN(sessionId)) {
            console.error("Error: --commands requires a numeric session id.");
            process.exitCode = 1;
            return;
        }

        const socket = await ensureBridge(config.cliPort, args.bridgeScript);
        try {
            const response = await sendAndReceive<CommandsResponse>(socket, { type: "commands", sessionId });
            if (response.error) {
                console.error(`Error: ${response.error}`);
                process.exitCode = 1;
                return;
            }
            if (!response.commands || response.commands.length === 0) {
                console.log("No commands available for this session.");
            } else {
                console.log(`Commands for session ${sessionId}:`);
                for (const cmd of response.commands) {
                    console.log(`  --${cmd.id}    ${cmd.description}`);
                    if (cmd.args && cmd.args.length > 0) {
                        for (const arg of cmd.args) {
                            console.log(`      --${arg.name}${arg.required ? " (required)" : ""}    ${arg.description}`);
                        }
                    }
                }
            }
        } finally {
            socket.close();
        }
        return;
    }

    // No recognized option — show help.
    console.log(HELP_TEXT);
}

main().catch((error: unknown) => {
    console.error(`Error: ${error}`);
    process.exitCode = 1;
});
