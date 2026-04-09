/* eslint-disable no-console */
import { spawn } from "child_process";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";
import { WebSocket } from "./webSocket.js";
import { LoadConfig } from "./config.js";
import {
    type CliRequest,
    type CliResponse,
    type CommandArgInfo,
    type CommandInfo,
    type CommandsResponse,
    type ExecResponse,
    type SessionInfo,
    type SessionsResponse,
} from "./protocol.js";

const Config = LoadConfig();

const HELP_TEXT = `babylon-inspector — Interact with running Babylon.js scenes from the terminal.

USAGE
  babylon-inspector [options]
  babylon-inspector --command <command-id> [--arg value ...]

OPTIONS
  --help                   Show this help message.
  --session [session-id]   List active sessions, or specifies the target session.
                           A session id is only needed when multiple sessions
                           are active.
  --command [command-id]   List available commands, or execute one.
                           Use --command <id> --help to see its arguments.
  --stop                   Stop the bridge process.

CONFIGURATION
  Place a .babyloninspector JSON file anywhere in the directory parent chain:
    { "browserPort": 4400, "cliPort": 4401 }

EXAMPLES
  babylon-inspector --session
  babylon-inspector --command
  babylon-inspector --session 2 --command
  babylon-inspector --command query-mesh --help
  babylon-inspector --command query-mesh --uniqueId 42
  babylon-inspector --session 2 --command query-mesh --uniqueId 42
`;

const KnownOptions = new Set(["help", "stop", "session", "command", "bridge-script"]);

/**
 * Parsed CLI arguments for the Inspector CLI.
 */
export interface IParsedArgs {
    /** Whether the user requested help. */
    help: boolean;
    /** Whether --session was specified. */
    session: boolean;
    /** The session id value, if provided. */
    sessionId?: string;
    /** Whether the user requested the bridge to stop. */
    stop: boolean;
    /** Whether --command was specified. */
    command: boolean;
    /** Optional path to the bridge script. */
    bridgeScript?: string;
    /** Remaining positional and unknown arguments (command id + command args). */
    rest: string[];
}

/**
 * Parses the CLI arguments into a structured object.
 * @param argv Optional array of arguments to parse. Defaults to process.argv.
 * @returns The parsed arguments.
 */
export function ParseCliArgs(argv?: string[]): IParsedArgs {
    const { values, tokens } = parseArgs({
        options: {
            help: { type: "boolean", default: false },
            session: { type: "boolean", default: false },
            stop: { type: "boolean", default: false },
            command: { type: "boolean", default: false },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "bridge-script": { type: "string" },
        },
        strict: false,
        allowPositionals: true,
        tokens: true,
        ...(argv !== undefined ? { args: argv } : {}),
    });

    // Walk the token stream to extract:
    // - The first positional after --session as sessionId (if it's a number)
    // - Remaining positionals and unknown --key value pairs into rest
    let sessionId: string | undefined;
    const rest: string[] = [];

    if (tokens) {
        let expectingSessionId = false;
        let pendingOptionName: string | null = null;
        for (const token of tokens) {
            // After seeing --session, the next positional (if numeric) is the session id.
            if (token.kind === "option" && token.name === "session") {
                expectingSessionId = true;
                continue;
            }

            if (expectingSessionId && token.kind === "positional" && !isNaN(parseInt(token.value, 10))) {
                sessionId = token.value;
                expectingSessionId = false;
                continue;
            }
            expectingSessionId = false;

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
        session: !!values.session,
        sessionId,
        stop: !!values.stop,
        command: !!values.command,
        bridgeScript: values["bridge-script"] as string | undefined,
        rest,
    };
}

async function ConnectToBridge(port: number): Promise<WebSocket> {
    return await new Promise((resolve, reject) => {
        const socket = new WebSocket(`ws://127.0.0.1:${port}`);
        socket.on("open", () => resolve(socket));
        socket.on("error", (err) => reject(err));
    });
}

/**
 * Sends a JSON message to the bridge over WebSocket and waits for a response.
 * @param socket The WebSocket connection to the bridge.
 * @param message The CLI request to send.
 * @returns The parsed bridge response.
 */
export async function SendAndReceive<T extends CliResponse>(socket: WebSocket, message: CliRequest): Promise<T> {
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
 * Connects to the bridge, runs the provided callback, and closes the socket.
 * @param bridgeScript Optional path to the bridge script.
 * @param fn The callback to run with the connected socket.
 */
async function WithBridge(bridgeScript: string | undefined, fn: (socket: WebSocket) => Promise<void>): Promise<void> {
    const socket = await EnsureBridge(Config.cliPort, bridgeScript);
    try {
        await fn(socket);
    } finally {
        socket.close();
    }
}

/**
 * Resolves the session id to use. If an explicit id is provided, returns it.
 * If not, queries the bridge: returns the sole session's id when exactly one
 * is active, or errors if zero or multiple sessions are active.
 * @param socket The WebSocket connection to the bridge.
 * @param explicitId An optional explicit session id string.
 * @returns The resolved numeric session id.
 */
/**
 * Parses and validates an explicit session id string against the list of active sessions.
 * @param explicitId The session id string to validate.
 * @param sessions The list of active sessions from the bridge.
 * @returns The matching session info.
 */
export function ValidateSessionId(explicitId: string, sessions: SessionInfo[]): SessionInfo {
    const parsed = parseInt(explicitId, 10);
    if (isNaN(parsed)) {
        throw new Error("Session id must be a number.");
    }
    const match = sessions.find((s) => s.id === parsed);
    if (!match) {
        if (sessions.length === 0) {
            throw new Error(`Session ${parsed} does not exist. No active sessions.`);
        }
        const list = sessions.map((s) => `  [${s.id}] ${s.name}`).join("\n");
        throw new Error(`Session ${parsed} does not exist. Active sessions:\n${list}`);
    }
    return match;
}

/**
 * Resolves the session id to use. If an explicit id is provided, validates it
 * against the active sessions. If not, queries the bridge: returns the sole
 * session's id when exactly one is active, or errors if zero or multiple.
 * @param socket The WebSocket connection to the bridge.
 * @param explicitId An optional explicit session id string.
 * @returns The resolved numeric session id.
 */
export async function ResolveSessionId(socket: WebSocket, explicitId?: string): Promise<number> {
    const response = await SendAndReceive<SessionsResponse>(socket, { type: "sessions" });

    if (explicitId !== undefined) {
        return ValidateSessionId(explicitId, response.sessions).id;
    }

    if (response.sessions.length === 0) {
        throw new Error("No active sessions. Make sure a browser is running with StartInspectable enabled.");
    }
    if (response.sessions.length > 1) {
        const list = response.sessions.map((s) => `  [${s.id}] ${s.name}`).join("\n");
        throw new Error(`Multiple active sessions:\n${list}\nSpecify a session id with --session <session-id>`);
    }
    return response.sessions[0].id;
}

/**
 * Parses command arguments from the rest array (everything after the command id).
 * @param rest The remaining CLI tokens after the command id.
 * @param globalHelp Whether --help was specified at the top level.
 * @returns The parsed command arguments and whether help was requested.
 */
export function ParseCommandArgs(rest: string[], globalHelp: boolean): { args: Record<string, string>; wantsHelp: boolean } {
    const args: Record<string, string> = {};
    let wantsHelp = globalHelp;
    for (let i = 1; i < rest.length; i++) {
        const token = rest[i];
        if (token === "--help") {
            wantsHelp = true;
        } else if (token.startsWith("--") && i + 1 < rest.length) {
            args[token.slice(2)] = rest[++i];
        }
    }
    return { args, wantsHelp };
}

/**
 * Prints help text for a command, including its description and argument list.
 * If there are missing required arguments and help was not explicitly requested,
 * prints an error and sets a non-zero exit code.
 * @param commandId The command identifier.
 * @param descriptor The command descriptor.
 * @param missingRequired The list of missing required arguments.
 * @param wantsHelp Whether help was explicitly requested.
 */
export function PrintCommandHelp(commandId: string, descriptor: CommandInfo, missingRequired: CommandArgInfo[], wantsHelp: boolean): void {
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
}

/**
 * Handles `--session` without `--command`: lists active sessions, or shows
 * details for a specific session when an explicit id is provided.
 * @param socket The WebSocket connection to the bridge.
 * @param explicitId An optional explicit session id string.
 */
async function HandleSessions(socket: WebSocket, explicitId?: string): Promise<void> {
    const response = await SendAndReceive<SessionsResponse>(socket, { type: "sessions" });

    if (explicitId !== undefined) {
        const match = ValidateSessionId(explicitId, response.sessions);
        console.log(`  [${match.id}] ${match.name} (connected: ${match.connectedAt})`);
        return;
    }

    if (response.sessions.length === 0) {
        console.log("No active sessions.");
    } else {
        console.log("Active sessions:");
        for (const session of response.sessions) {
            console.log(`  [${session.id}] ${session.name} (connected: ${session.connectedAt})`);
        }
    }
}

/**
 * Handles `--command`: lists commands or executes one.
 * @param socket The WebSocket connection to the bridge.
 * @param args The parsed CLI arguments.
 */
async function HandleCommand(socket: WebSocket, args: IParsedArgs): Promise<void> {
    const commandId = args.rest.length > 0 ? args.rest[0] : undefined;

    if (!commandId) {
        // --command with no id: list available commands.
        const sessionId = await ResolveSessionId(socket, args.sessionId);
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
        return;
    }

    const sessionId = await ResolveSessionId(socket, args.sessionId);
    const { args: commandArgs, wantsHelp } = ParseCommandArgs(args.rest, args.help);

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
        PrintCommandHelp(commandId, descriptor, missingRequired, wantsHelp);
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
}

async function Main(): Promise<void> {
    const args = ParseCliArgs();

    if (args.help && !args.command) {
        console.log(HELP_TEXT);
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

    if (args.session && !args.command) {
        await WithBridge(args.bridgeScript, async (socket) => await HandleSessions(socket, args.sessionId));
        return;
    }

    if (args.command) {
        await WithBridge(args.bridgeScript, async (socket) => await HandleCommand(socket, args));
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
