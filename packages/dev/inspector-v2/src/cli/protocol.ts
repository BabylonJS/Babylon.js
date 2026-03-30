// ---- Shared types ----

/**
 * Serializable description of a command argument, used in protocol messages.
 */
export type CommandArgInfo = {
    name: string;
    description: string;
    required?: boolean;
};

/**
 * Serializable description of a command, used in protocol messages.
 */
export type CommandInfo = {
    id: string;
    description: string;
    args?: CommandArgInfo[];
};

/**
 * Serializable description of a session, used in protocol messages.
 */
export type SessionInfo = {
    id: number;
    name: string;
    connectedAt: string;
};

// ---- CLI ↔ Bridge (CLI port) ----

/**
 * CLI → Bridge: Request the list of active browser sessions.
 */
export type SessionsRequest = {
    type: "sessions";
};

/**
 * CLI → Bridge: Request the list of commands available from a session.
 */
export type CommandsRequest = {
    type: "commands";
    sessionId: number;
};

/**
 * CLI → Bridge: Execute a command on a session.
 */
export type ExecRequest = {
    type: "exec";
    sessionId: number;
    commandId: string;
    args: Record<string, string>;
};

/**
 * CLI → Bridge: Stop the bridge process.
 */
export type StopRequest = {
    type: "stop";
};

/**
 * All messages that the CLI sends to the bridge.
 */
export type CliRequest = SessionsRequest | CommandsRequest | ExecRequest | StopRequest;

/**
 * Bridge → CLI: Response with the list of active sessions.
 */
export type SessionsResponse = {
    type: "sessionsResponse";
    sessions: SessionInfo[];
};

/**
 * Bridge → CLI: Response with the list of commands from a session.
 */
export type CommandsResponse = {
    type: "commandsResponse";
    commands?: CommandInfo[];
    error?: string;
};

/**
 * Bridge → CLI: Response with the result of a command execution.
 */
export type ExecResponse = {
    type: "execResponse";
    result?: string;
    error?: string;
};

/**
 * Bridge → CLI: Acknowledgement that the bridge is stopping.
 */
export type StopResponse = {
    type: "stopResponse";
    success: boolean;
};

/**
 * All messages that the bridge sends to the CLI.
 */
export type CliResponse = SessionsResponse | CommandsResponse | ExecResponse | StopResponse;

// ---- Bridge ↔ Browser (browser port) ----

/**
 * Browser → Bridge: Register a new session.
 */
export type RegisterRequest = {
    type: "register";
    name: string;
};

/**
 * Browser → Bridge: Response to a listCommands request from the bridge.
 */
export type CommandListResponse = {
    type: "commandListResponse";
    requestId: string;
    commands: CommandInfo[];
};

/**
 * Browser → Bridge: Response to an execCommand request from the bridge.
 */
export type CommandResponse = {
    type: "commandResponse";
    requestId: string;
    result?: string;
    error?: string;
};

/**
 * All messages that the browser sends to the bridge.
 */
export type BrowserRequest = RegisterRequest | CommandListResponse | CommandResponse;

/**
 * Bridge → Browser: Request the list of registered commands.
 */
export type ListCommandsRequest = {
    type: "listCommands";
    requestId: string;
};

/**
 * Bridge → Browser: Request execution of a command.
 */
export type ExecCommandRequest = {
    type: "execCommand";
    requestId: string;
    commandId: string;
    args: Record<string, string>;
};

/**
 * All messages that the bridge sends to the browser.
 */
export type BrowserResponse = ListCommandsRequest | ExecCommandRequest;
