// ---- Shared types ----

/**
 * Serializable description of a command argument, used in protocol messages.
 */
export type CommandArgInfo = {
    /** The name of the argument. */
    name: string;
    /** A human-readable description of the argument. */
    description: string;
    /** Whether this argument is required. */
    required?: boolean;
};

/**
 * Serializable description of a command, used in protocol messages.
 */
export type CommandInfo = {
    /** A unique identifier for the command. */
    id: string;
    /** A human-readable description of the command. */
    description: string;
    /** The arguments this command accepts. */
    args?: CommandArgInfo[];
};

/**
 * Serializable description of a session, used in protocol messages.
 */
export type SessionInfo = {
    /** The numeric session identifier. */
    id: number;
    /** The display name of the session. */
    name: string;
    /** ISO 8601 timestamp of when the session connected. */
    connectedAt: string;
};

// ---- CLI ↔ Bridge (CLI port) ----

/**
 * CLI → Bridge: Request the list of active browser sessions.
 */
export type SessionsRequest = {
    /** The message type discriminator. */
    type: "sessions";
};

/**
 * CLI → Bridge: Request the list of commands available from a session.
 */
export type CommandsRequest = {
    /** The message type discriminator. */
    type: "commands";
    /** The session to query for commands. */
    sessionId: number;
};

/**
 * CLI → Bridge: Execute a command on a session.
 */
export type ExecRequest = {
    /** The message type discriminator. */
    type: "exec";
    /** The session to execute the command on. */
    sessionId: number;
    /** The identifier of the command to execute. */
    commandId: string;
    /** Key-value pairs of arguments for the command. */
    args: Record<string, string>;
};

/**
 * CLI → Bridge: Stop the bridge process.
 */
export type StopRequest = {
    /** The message type discriminator. */
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
    /** The message type discriminator. */
    type: "sessionsResponse";
    /** The list of active sessions. */
    sessions: SessionInfo[];
};

/**
 * Bridge → CLI: Response with the list of commands from a session.
 */
export type CommandsResponse = {
    /** The message type discriminator. */
    type: "commandsResponse";
    /** The list of available commands, if successful. */
    commands?: CommandInfo[];
    /** An error message, if the request failed. */
    error?: string;
};

/**
 * Bridge → CLI: Response with the result of a command execution.
 */
export type ExecResponse = {
    /** The message type discriminator. */
    type: "execResponse";
    /** The result of the command execution, if successful. */
    result?: string;
    /** An error message, if the execution failed. */
    error?: string;
};

/**
 * Bridge → CLI: Acknowledgement that the bridge is stopping.
 */
export type StopResponse = {
    /** The message type discriminator. */
    type: "stopResponse";
    /** Whether the bridge stopped successfully. */
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
    /** The message type discriminator. */
    type: "register";
    /** The display name for this session. */
    name: string;
};

/**
 * Browser → Bridge: Response to a listCommands request from the bridge.
 */
export type CommandListResponse = {
    /** The message type discriminator. */
    type: "commandListResponse";
    /** The identifier of the original request. */
    requestId: string;
    /** The list of registered commands. */
    commands: CommandInfo[];
};

/**
 * Browser → Bridge: Response to an execCommand request from the bridge.
 */
export type CommandResponse = {
    /** The message type discriminator. */
    type: "commandResponse";
    /** The identifier of the original request. */
    requestId: string;
    /** The result of the command execution, if successful. */
    result?: string;
    /** An error message, if the execution failed. */
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
    /** The message type discriminator. */
    type: "listCommands";
    /** A unique identifier for this request. */
    requestId: string;
};

/**
 * Bridge → Browser: Request execution of a command.
 */
export type ExecCommandRequest = {
    /** The message type discriminator. */
    type: "execCommand";
    /** A unique identifier for this request. */
    requestId: string;
    /** The identifier of the command to execute. */
    commandId: string;
    /** Key-value pairs of arguments for the command. */
    args: Record<string, string>;
};

/**
 * All messages that the bridge sends to the browser.
 */
export type BrowserResponse = ListCommandsRequest | ExecCommandRequest;
