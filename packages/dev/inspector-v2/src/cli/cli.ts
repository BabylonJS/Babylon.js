/* eslint-disable no-console */
import { spawn } from "child_process";
import { parseArgs } from "util";
import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";
import ws from "ws";
import { LoadConfig } from "./config.js";
import type { CliRequest, CliResponse, CommandsResponse, ExecResponse, SessionsResponse } from "./protocol.js";

type WebSocket = ws;

const Config = LoadConfig();

const HELP_TEXT = `babylon-inspector — Interact with running Babylon.js scenes from the terminal.

USAGE
  babylon-inspector [options]
  babylon-inspector --command [session-id] <command-id> [--arg value ...]

OPTIONS
  --help                   Show this help message.
  --sessions               List active browser sessions connected to the bridge.
  --stop                   Stop the bridge process.
  --commands [session-id]  List available commands.
  --command [session-id] <command-id> [--arg value ...]
                           Execute a command. Use --command <id> --help to
                           see its arguments.

  Session id is optional when only one session is active.

CONFIGURATION
  Place a .babyloninspector JSON file anywhere in the directory parent chain:
    { "browserPort": 4400, "cliPort": 4401 }

EXAMPLES
  babylon-inspector --sessions
  babylon-inspector --commands
  babylon-inspector --command query-mesh --help
  babylon-inspector --command query-mesh --uniqueId 42
  babylon-inspector --command 1 query-mesh --uniqueId 42
`;

const KnownOptions = new Set(["help", "sessions", "stop", "commands", "command", "bridge-script"]);

interface IParsedArgs {
    /** Whether the user requested help. */
    help: boolean;
    /** Whether the user requested the sessions list. */
    sessions: boolean;
    /** Whether the user requested the bridge to stop. */
    stop: boolean;
    /** Whether the user requested the commands list. */
    commands: boolean;
    /** Whether the user is executing a command. */
    command: boolean;
    /** Optional path to the bridge script. */
    bridgeScript?: string;
    /** Remaining positional and unknown arguments. */
    rest: string[];
}

function ParseCliArgs(): IParsedArgs {
    const { values, tokens } = parseArgs({
        options: {
            help: { type: "boolean", default: false },
            sessions: { type: "boolean", default: false },
            stop: { type: "boolean", default: false },
            commands: { type: "boolean", default: false },
            command: { type: "boolean", default: false },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "bridge-script": { type: "string" },
        },
        strict: false,
        allowPositionals: true,
        tokens: true,
    });

    // Collect positionals and unknown --key value pairs from the token stream.
    const rest: string[] = [];
    if (tokens) {
        let pendingOptionName: string | null = null;
        for (const token of tokens) {
            if (token.kind === "option" && !KnownOptions.has(token.name)) {
                if (pendingOptionName !== null) {
                    rest.push(`--${pendingOptionName}`);
                }
                if (token.value !== undefined) {
                    rest.push(`--${token.name}`, token.value);
                } else {
                    pendingOptionName = token.name;
                }
                continue;
            }
            if (token.kind === "positional" && pendingOptionName !== null) {
                rest.push(`--${pendingOptionName}`, token.value);
                pendingOptionName = null;
                continue;
            }
            if (token.kind === "positional") {
                rest.push(token.value);
            }
        }
        if (pendingOptionName !== null) {
            rest.push(`--${pendingOptionName}`);
        }
    }

    return {
        help: !!values.help,
        sessions: !!values.sessions,
        stop: !!values.stop,
        commands: !!values.commands,
        command: !!values.command,
        bridgeScript: values["bridge-script"] as string | undefined,
        rest,
    };
}

async function ConnectToBridge(port: number): Promise<WebSocket> {
    return await new Promise((resolve, reject) => {
        const socket = new ws(`ws://127.0.0.1:${port}`);
        socket.on("open", () => resolve(socket));
        socket.on("error", (err) => reject(err));
    });
}

async function SendAndReceive<T extends CliResponse>(socket: WebSocket, message: CliRequest): Promise<T> {
    return await new Promise((resolve, reject) => {
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

function SpawnBridge(bridgeScript?: string): void {
    const bridgePath = bridgeScript ? resolve(bridgeScript) : join(dirname(fileURLToPath(import.meta.url)), "inspector-bridge.mjs");
    const child = spawn(process.execPath, [bridgePath], {
        detached: true,
        stdio: "ignore",
    });
    child.unref();
}

async function EnsureBridge(port: number, bridgeScript?: string, maxRetries = 10, retryDelayMs = 500): Promise<WebSocket> {
    try {
        return await ConnectToBridge(port);
    } catch {
        // Bridge not running — spawn it.
        SpawnBridge(bridgeScript);
    }

    for (let i = 0; i < maxRetries; i++) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        try {
            // eslint-disable-next-line no-await-in-loop
            return await ConnectToBridge(port);
        } catch {
            // Keep retrying.
        }
    }

    throw new Error(`Unable to connect to the Inspector bridge on port ${port} after spawning it.`);
}

/**
 * Resolves the session id to use. If an explicit id is provided, returns it.
 * If not, queries the bridge: returns the sole session's id when exactly one
 * is active, or errors if zero or multiple sessions are active.
 * @param socket The WebSocket connection to the bridge.
 * @param explicitId An optional explicit session id string.
 * @returns The resolved numeric session id.
 */
async function ResolveSessionId(socket: WebSocket, explicitId?: string): Promise<number> {
    if (explicitId !== undefined) {
        const parsed = parseInt(explicitId, 10);
        if (isNaN(parsed)) {
            throw new Error("Session id must be a number.");
        }
        return parsed;
    }

    const response = await SendAndReceive<SessionsResponse>(socket, { type: "sessions" });
    if (response.sessions.length === 0) {
        throw new Error("No active sessions. Make sure a browser is running with StartInspectable enabled.");
    }
    if (response.sessions.length > 1) {
        const list = response.sessions.map((s) => `  [${s.id}] ${s.name}`).join("\n");
        throw new Error(`Multiple active sessions. Specify a session id:\n${list}`);
    }
    return response.sessions[0].id;
}

async function Main(): Promise<void> {
    const args = ParseCliArgs();

    if (args.help && !args.command) {
        console.log(HELP_TEXT);
        return;
    }

    if (args.sessions) {
        const socket = await EnsureBridge(Config.cliPort, args.bridgeScript);
        try {
            const response = await SendAndReceive<SessionsResponse>(socket, { type: "sessions" });
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
            const socket = await ConnectToBridge(Config.cliPort);
            await SendAndReceive(socket, { type: "stop" });
            socket.close();
            console.log("Bridge stopped.");
        } catch {
            console.log("Bridge is not running.");
        }
        return;
    }

    if (args.commands) {
        const socket = await EnsureBridge(Config.cliPort, args.bridgeScript);
        try {
            const sessionId = await ResolveSessionId(socket, args.rest[0]);
            const response = await SendAndReceive<CommandsResponse>(socket, { type: "commands", sessionId });
            if (response.error) {
                console.error(`Error: ${response.error}`);
                process.exitCode = 1;
                return;
            }
            if (!response.commands || response.commands.length === 0) {
                console.log("No commands available.");
            } else {
                console.log("Available commands:");
                const maxLen = Math.max(...response.commands.map((c) => c.id.length));
                for (const cmd of response.commands) {
                    console.log(`  ${cmd.id.padEnd(maxLen)}  ${cmd.description}`);
                }
                console.log("\nRun --command <id> --help to see arguments for a command.");
                console.log("Run --command <id> [--arg value ...] to execute a command.");
            }
        } finally {
            socket.close();
        }
        return;
    }

    if (args.command) {
        const socket = await EnsureBridge(Config.cliPort, args.bridgeScript);
        try {
            // Positionals in rest: [sessionId?] <commandId>
            let commandId: string | undefined;
            let argsStartIndex: number;
            let explicitSessionId: string | undefined;

            if (args.rest.length > 0 && !isNaN(parseInt(args.rest[0], 10)) && args.rest.length > 1) {
                explicitSessionId = args.rest[0];
                commandId = args.rest[1];
                argsStartIndex = 2;
            } else {
                commandId = args.rest[0];
                argsStartIndex = 1;
            }

            if (!commandId) {
                console.error("Error: --command requires a command id.");
                process.exitCode = 1;
                return;
            }

            const sessionId = await ResolveSessionId(socket, explicitSessionId);

            // Parse remaining --key value pairs into a Record.
            const commandArgs: Record<string, string> = {};
            let wantsHelp = args.help;
            for (let i = argsStartIndex; i < args.rest.length; i++) {
                const token = args.rest[i];
                if (token === "--help") {
                    wantsHelp = true;
                } else if (token.startsWith("--") && i + 1 < args.rest.length) {
                    commandArgs[token.slice(2)] = args.rest[++i];
                }
            }

            // Fetch the command descriptor to check for --help or missing required args.
            const commandsResponse = await SendAndReceive<CommandsResponse>(socket, { type: "commands", sessionId });
            const descriptor = commandsResponse.commands?.find((c) => c.id === commandId);

            if (!descriptor) {
                console.error(`Error: Unknown command "${commandId}".`);
                process.exitCode = 1;
                return;
            }

            // Check for --help or missing required arguments.
            const missingRequired = (descriptor.args ?? []).filter((a) => a.required && !(a.name in commandArgs));

            if (wantsHelp || missingRequired.length > 0) {
                if (missingRequired.length > 0 && !wantsHelp) {
                    console.error(`Missing required argument(s): ${missingRequired.map((a) => `--${a.name}`).join(", ")}\n`);
                }
                console.log(`${commandId}: ${descriptor.description}\n`);
                if (descriptor.args && descriptor.args.length > 0) {
                    console.log("Arguments:");
                    const maxLen = Math.max(...descriptor.args.map((a) => `--${a.name}${a.required ? " (required)" : ""}`.length));
                    for (const arg of descriptor.args) {
                        const label = `--${arg.name}${arg.required ? " (required)" : ""}`;
                        console.log(`  ${label.padEnd(maxLen)}  ${arg.description}`);
                    }
                }
                if (missingRequired.length > 0 && !wantsHelp) {
                    process.exitCode = 1;
                }
                return;
            }

            const response = await SendAndReceive<ExecResponse>(socket, {
                type: "exec",
                sessionId,
                commandId,
                args: commandArgs,
            });
            if (response.error) {
                console.error(`Error: ${response.error}`);
                process.exitCode = 1;
            } else {
                console.log(response.result ?? "");
            }
        } finally {
            socket.close();
        }
        return;
    }

    // No recognized option — show help.
    console.log(HELP_TEXT);
}

void (async () => {
    try {
        await Main();
    } catch (error: unknown) {
        console.error(`Error: ${error}`);
        process.exitCode = 1;
    }
})();
