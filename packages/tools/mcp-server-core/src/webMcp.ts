/**
 * Registration status for a browser editor's WebMCP tools.
 */
export type WebMcpRegistrationStatus = "unsupported" | "registering" | "registered" | "error";

/**
 * JSON-compatible object supplied to a WebMCP tool.
 */
export type WebMcpInput = Record<string, unknown>;

/**
 * Options supplied by the browser for one WebMCP tool execution.
 */
export interface IWebMcpToolExecuteOptions {
    /** Signal used to cancel the current tool execution. */
    signal: AbortSignal;
}

/**
 * Tool annotations currently defined by the WebMCP proposal.
 */
export interface IWebMcpToolAnnotations {
    /** Indicates that the tool does not modify state. */
    readOnlyHint?: boolean;
    /** Indicates that the result may contain content not controlled by the application. */
    untrustedContentHint?: boolean;
    /** Indicates that invoking the tool may have consequences outside the current document. */
    consequentialHint?: boolean;
}

/**
 * Imperative WebMCP tool definition.
 */
export interface IWebMcpTool {
    /** Stable tool identifier. */
    name: string;
    /** Human-readable tool title. */
    title?: string;
    /** Description used by agents to select and invoke the tool. */
    description: string;
    /** JSON Schema describing the tool input object. */
    inputSchema?: Record<string, unknown>;
    /** Optional behavioral annotations. */
    annotations?: IWebMcpToolAnnotations;
    /**
     * Executes the tool.
     * @param input - Validated tool input supplied by the agent.
     * @param options - Options supplied for the current tool execution.
     * @returns A JSON-serializable result.
     */
    execute: (input: WebMcpInput, options: IWebMcpToolExecuteOptions) => unknown | Promise<unknown>;
}

/**
 * Minimal WebMCP model context surface used by Babylon.js editors.
 */
export interface IWebMcpModelContext {
    /**
     * Registers a tool until the provided signal is aborted.
     * @param tool - Tool definition to register.
     * @param options - Registration lifetime options.
     */
    registerTool(tool: IWebMcpTool, options?: { signal?: AbortSignal }): Promise<void>;
}

interface IWebMcpDocument extends Document {
    modelContext?: IWebMcpModelContext;
}

/**
 * Checks whether a document exposes the imperative WebMCP API.
 * @param document - Document hosting the editor.
 * @returns True when the document can register WebMCP tools.
 */
export function IsWebMcpSupported(document: Document): boolean {
    return typeof (document as IWebMcpDocument).modelContext?.registerTool === "function";
}

/**
 * Registers a set of WebMCP tools against a document.
 * @param document - Document hosting the editor.
 * @param tools - Tools to register.
 * @param signal - Signal controlling the lifetime of every registration.
 * @returns False when WebMCP is unsupported, otherwise true after all tools register.
 */
export async function RegisterWebMcpToolsAsync(document: Document, tools: readonly IWebMcpTool[], signal: AbortSignal): Promise<boolean> {
    const modelContext = (document as IWebMcpDocument).modelContext;
    if (!modelContext || typeof modelContext.registerTool !== "function") {
        return false;
    }

    await Promise.all(
        tools.map(async (tool) => {
            await modelContext.registerTool(tool, { signal });
        })
    );
    return true;
}

/**
 * Rejects a WebMCP mutation while a legacy editor session owns MCP writes.
 * @param legacySessionConnected - Whether the editor is connected to a legacy MCP session.
 */
export function AssertWebMcpMutationAllowed(legacySessionConnected: boolean): void {
    if (legacySessionConnected) {
        throw new Error("This editor is connected to a legacy MCP session. Disconnect that session or perform the mutation through the connected MCP server.");
    }
}
