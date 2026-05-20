import * as crypto from "node:crypto";
import * as http from "node:http";

const DefaultProtocolName = "babylon-mcp-editor-session";
const DefaultProtocolVersion = "1.0";
const DefaultHost = "127.0.0.1";
const DefaultPublicHostname = "localhost";
const DefaultPort = 3001;
const DefaultPortRange = 10;
const DefaultKeepAliveIntervalMs = 15_000;

/**
 * A live document session shared between an MCP server and an editor.
 */
export interface IMcpEditorSession {
    /** Unique session identifier used in HTTP routes. */
    id: string;
    /** Graph or document kind, such as `node-material`. */
    kind: string;
    /** MCP-server-local document name. */
    name: string;
    /** Creation timestamp in milliseconds since epoch. */
    createdAt: number;
    /** Last update timestamp in milliseconds since epoch. */
    updatedAt: number;
    /** Monotonic revision number incremented on document updates. */
    revision: number;
}

/**
 * Adapter implemented by each MCP server to connect the generic session server
 * to that server's graph/document manager.
 */
export interface IMcpEditorSessionAdapter {
    /** Human-readable server name used in status and health output. */
    serverName: string;
    /** Stable document kind handled by this MCP server. */
    documentKind: string;
    /**
     * Export the current JSON document for a session.
     * @param session - Session whose document should be read.
     * @returns The JSON document, or undefined if it is unavailable.
     */
    getDocument(session: IMcpEditorSession): string | undefined | Promise<string | undefined>;
    /**
     * Import a JSON document pushed by an editor.
     * @param session - Session whose document should be updated.
     * @param document - Raw JSON document posted by the editor.
     * @returns Undefined/void on success, or an error message on failure.
     */
    setDocument(session: IMcpEditorSession, document: string): string | void | Promise<string | void>;
}

/**
 * Options for the shared MCP/editor session server.
 */
export interface IMcpEditorSessionServerOptions {
    /** Default port to use when no port is passed to start. */
    defaultPort?: number;
    /** Number of sequential ports to try. Defaults to 10. */
    portRange?: number;
    /** Host interface to bind. Defaults to 127.0.0.1. */
    host?: string;
    /** Hostname used in generated URLs. Defaults to localhost. */
    publicHostname?: string;
    /** Protocol version reported from /health. */
    protocolVersion?: string;
    /** SSE keepalive interval in milliseconds. */
    keepAliveIntervalMs?: number;
    /** Access-Control-Allow-Origin value. Defaults to *. */
    corsOrigin?: string;
    /** Compatibility routes that should behave like /document, without leading slash. */
    legacyDocumentRoutes?: string[];
    /** Additional capability names reported from /health. */
    capabilities?: string[];
    /** Optional status-page title. */
    statusTitle?: string;
    /** Stable local workspace identity reported from /health. Defaults to a hash of the current working directory. */
    workspaceId?: string;
    /** Per-server owner identity reported from /health. Defaults to a random process-local value. */
    ownerId?: string;
}

/**
 * Adapter implemented by an MCP server to bind the shared session controller to
 * that server's graph/document manager.
 */
export interface IMcpEditorSessionControllerAdapter<Manager> {
    /** Human-readable server name used in status and health output. */
    serverName: string;
    /** Stable document kind handled by this MCP server. */
    documentKind: string;
    /** Error returned if an editor posts a document before a manager is attached. */
    managerUnavailableMessage?: string;
    /**
     * Export the current JSON document for a session.
     * @param manager - MCP server graph/document manager.
     * @param session - Session whose document should be read.
     * @returns The JSON document, or undefined if unavailable.
     */
    getDocument(manager: Manager, session: IMcpEditorSession): string | undefined | Promise<string | undefined>;
    /**
     * Import a JSON document pushed by an editor.
     * @param manager - MCP server graph/document manager.
     * @param session - Session whose document should be updated.
     * @param document - Raw JSON document posted by the editor.
     * @returns Undefined/void on success, or an error message on failure.
     */
    setDocument(manager: Manager, session: IMcpEditorSession, document: string): string | void | Promise<string | void>;
}

/**
 * Health payload returned by the shared session server.
 */
export interface IMcpEditorSessionHealth {
    /** Stable protocol name. */
    protocol: string;
    /** Protocol version string. */
    protocolVersion: string;
    /** Human-readable server name. */
    serverName: string;
    /** Bound port, or 0 when stopped. */
    port: number;
    /** Bound host interface. */
    host: string;
    /** Public hostname used in generated URLs. */
    publicHostname: string;
    /** Document kind served by this MCP server. */
    documentKind: string;
    /** Whether the HTTP server is currently listening. */
    running: boolean;
    /** Number of active sessions. */
    activeSessionCount: number;
    /** Supported capability names. */
    capabilities: string[];
    /** Stable local workspace identity. */
    workspaceId?: string;
    /** Per-server owner identity. */
    ownerId?: string;
}

/**
 * Options for checking whether a discovered session server is compatible.
 */
export interface IMcpEditorSessionCompatibilityOptions {
    /** Expected protocol version. Defaults to the current protocol version. */
    protocolVersion?: string;
    /** Expected document kind. When omitted, any document kind is accepted. */
    documentKind?: string;
    /** Expected server name. When omitted, any server name is accepted. */
    serverName?: string;
    /** Expected local workspace identity. When omitted, any workspace identity is accepted. */
    workspaceId?: string;
    /** Expected server owner identity. When omitted, any owner identity is accepted. */
    ownerId?: string;
}

/**
 * Options for discovering an existing compatible MCP editor session server.
 */
export interface IMcpEditorSessionDiscoveryOptions extends IMcpEditorSessionCompatibilityOptions {
    /** First port to probe. Defaults to 3001. */
    startPort?: number;
    /** Number of sequential ports to probe. Defaults to 10. */
    portRange?: number;
    /** Hostname to probe. Defaults to localhost. */
    publicHostname?: string;
    /** Request timeout in milliseconds. Defaults to 500. */
    timeoutMs?: number;
}

/**
 * Result of finding an existing compatible session server.
 */
export interface IMcpEditorSessionDiscoveryResult {
    /** Port where the compatible server was found. */
    port: number;
    /** Health payload returned by the compatible server. */
    health: IMcpEditorSessionHealth;
}

/**
 * Create a session URL for a known port and session id.
 * @param sessionId - Session identifier.
 * @param port - HTTP server port.
 * @param publicHostname - Hostname to place in the URL.
 * @returns A browser-usable local session URL.
 */
export function GetMcpEditorSessionUrl(sessionId: string, port: number, publicHostname: string = DefaultPublicHostname): string {
    return `http://${publicHostname}:${port}/session/${sessionId}`;
}

/**
 * Check whether an unknown /health payload is compatible with this protocol.
 * @param health - Candidate health payload.
 * @param options - Optional compatibility constraints.
 * @returns True when the payload is compatible.
 */
export function IsCompatibleMcpEditorSessionHealth(health: unknown, options: IMcpEditorSessionCompatibilityOptions = {}): health is IMcpEditorSessionHealth {
    if (!IsRecord(health)) {
        return false;
    }

    if (health.protocol !== DefaultProtocolName || health.protocolVersion !== (options.protocolVersion ?? DefaultProtocolVersion)) {
        return false;
    }

    if (health.running !== true || typeof health.port !== "number" || typeof health.host !== "string" || typeof health.publicHostname !== "string") {
        return false;
    }

    if (typeof health.serverName !== "string" || typeof health.documentKind !== "string" || typeof health.activeSessionCount !== "number") {
        return false;
    }

    if (!Array.isArray(health.capabilities) || !health.capabilities.every((capability) => typeof capability === "string")) {
        return false;
    }

    if (health.workspaceId !== undefined && typeof health.workspaceId !== "string") {
        return false;
    }

    if (health.ownerId !== undefined && typeof health.ownerId !== "string") {
        return false;
    }

    if (options.documentKind && health.documentKind !== options.documentKind) {
        return false;
    }

    if (options.serverName && health.serverName !== options.serverName) {
        return false;
    }

    if (options.workspaceId && health.workspaceId !== options.workspaceId) {
        return false;
    }

    if (options.ownerId && health.ownerId !== options.ownerId) {
        return false;
    }

    return true;
}

/**
 * Probe a port for an MCP editor session server /health payload.
 * @param port - Port to probe.
 * @param publicHostname - Hostname to probe. Defaults to localhost.
 * @param timeoutMs - Request timeout in milliseconds. Defaults to 500.
 * @returns The parsed health payload, or undefined if no valid health payload is returned.
 */
export async function ProbeMcpEditorSessionHealthAsync(
    port: number,
    publicHostname: string = DefaultPublicHostname,
    timeoutMs: number = 500
): Promise<IMcpEditorSessionHealth | undefined> {
    return await new Promise<IMcpEditorSessionHealth | undefined>((resolve) => {
        let settled = false;
        const finish = (health: IMcpEditorSessionHealth | undefined) => {
            if (!settled) {
                settled = true;
                resolve(health);
            }
        };

        const request = http.get({ hostname: publicHostname, port, path: "/health", timeout: timeoutMs }, (response) => {
            const chunks: Buffer[] = [];
            response.on("data", (chunk: Buffer) => chunks.push(chunk));
            response.on("end", () => {
                if (response.statusCode !== 200) {
                    finish(undefined);
                    return;
                }

                try {
                    const payload = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
                    finish(IsCompatibleMcpEditorSessionHealth(payload) ? payload : undefined);
                } catch {
                    finish(undefined);
                }
            });
        });

        request.on("timeout", () => {
            request.destroy();
            finish(undefined);
        });
        request.on("error", () => finish(undefined));
    });
}

/**
 * Find a compatible MCP editor session server in a local port range.
 * @param options - Discovery and compatibility options.
 * @returns The compatible server discovery result, or undefined if none is found.
 */
export async function FindCompatibleMcpEditorSessionServerAsync(options: IMcpEditorSessionDiscoveryOptions = {}): Promise<IMcpEditorSessionDiscoveryResult | undefined> {
    const startPort = options.startPort ?? DefaultPort;
    const portRange = options.portRange ?? DefaultPortRange;
    const publicHostname = options.publicHostname ?? DefaultPublicHostname;
    const timeoutMs = options.timeoutMs ?? 500;

    for (let portCandidate = startPort; portCandidate < startPort + portRange; portCandidate++) {
        // eslint-disable-next-line no-await-in-loop
        const health = await ProbeMcpEditorSessionHealthAsync(portCandidate, publicHostname, timeoutMs);
        if (IsCompatibleMcpEditorSessionHealth(health, options)) {
            return { port: portCandidate, health };
        }
    }

    return undefined;
}

function IsRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function CreateDefaultWorkspaceId(): string {
    return crypto.createHash("sha256").update(process.cwd()).digest("hex");
}

function CreateDefaultOwnerId(): string {
    return `${process.pid}-${crypto.randomBytes(8).toString("hex")}`;
}

/**
 * Generic local HTTP/SSE session server for MCP graph editors.
 */
export class McpEditorSessionServer {
    private readonly _adapter: IMcpEditorSessionAdapter;
    private readonly _defaultPort: number;
    private readonly _portRange: number;
    private readonly _host: string;
    private readonly _publicHostname: string;
    private readonly _protocolVersion: string;
    private readonly _keepAliveIntervalMs: number;
    private readonly _corsOrigin: string;
    private readonly _legacyDocumentRoutes: Set<string>;
    private readonly _capabilities: string[];
    private readonly _statusTitle: string;
    private readonly _workspaceId: string;
    private readonly _ownerId: string;

    private _server: http.Server | null = null;
    private _port = 0;
    private _keepAliveInterval: ReturnType<typeof setInterval> | null = null;
    private readonly _sessions = new Map<string, IMcpEditorSession>();
    private readonly _sessionByName = new Map<string, string>();
    private readonly _sseClients = new Map<string, Set<http.ServerResponse>>();

    /**
     * Creates a new reusable session server instance.
     * @param adapter - MCP-server-specific document adapter.
     * @param options - Server configuration options.
     */
    public constructor(adapter: IMcpEditorSessionAdapter, options: IMcpEditorSessionServerOptions = {}) {
        this._adapter = adapter;
        this._defaultPort = options.defaultPort ?? DefaultPort;
        this._portRange = options.portRange ?? DefaultPortRange;
        this._host = options.host ?? DefaultHost;
        this._publicHostname = options.publicHostname ?? DefaultPublicHostname;
        this._protocolVersion = options.protocolVersion ?? DefaultProtocolVersion;
        this._keepAliveIntervalMs = options.keepAliveIntervalMs ?? DefaultKeepAliveIntervalMs;
        this._corsOrigin = options.corsOrigin ?? "*";
        this._legacyDocumentRoutes = new Set((options.legacyDocumentRoutes ?? []).map((route) => route.replace(/^\//, "")));
        this._capabilities = ["sse", "document-get", "document-post", "session-close", ...(options.capabilities ?? [])];
        this._statusTitle = options.statusTitle ?? adapter.serverName;
        this._workspaceId = options.workspaceId ?? CreateDefaultWorkspaceId();
        this._ownerId = options.ownerId ?? CreateDefaultOwnerId();
    }

    /**
     * Whether the HTTP server is currently listening.
     * @returns True when the server is running.
     */
    public isRunning(): boolean {
        return this._server !== null && this._server.listening;
    }

    /**
     * Start the HTTP/SSE server if it is not already running.
     * @param port - Optional first port to try.
     * @returns The port that is listening.
     */
    public async startAsync(port: number = this._defaultPort): Promise<number> {
        if (this.isRunning()) {
            return this._port;
        }

        const endPort = port + this._portRange - 1;
        this._port = await this._tryPortRangeAsync(port, endPort);
        this._keepAliveInterval = setInterval(() => {
            for (const clients of this._sseClients.values()) {
                for (const response of clients) {
                    response.write(": ping\n\n");
                }
            }
        }, this._keepAliveIntervalMs);

        return this._port;
    }

    /**
     * Stop the HTTP/SSE server and close all active sessions.
     * @returns Resolves when the server has stopped.
     */
    public async stopAsync(): Promise<void> {
        if (this._keepAliveInterval) {
            clearInterval(this._keepAliveInterval);
            this._keepAliveInterval = null;
        }

        for (const sessionId of [...this._sessions.keys()]) {
            this.closeSession(sessionId, "Session server stopped");
        }

        if (!this._server) {
            this._port = 0;
            return;
        }

        await new Promise<void>((resolve, reject) => {
            this._server!.close((error) => {
                this._server = null;
                this._port = 0;
                if (error) {
                    reject(new Error(error.message));
                    return;
                }
                resolve();
            });
        });
    }

    /**
     * Create or retrieve a session for a named document.
     * @param name - MCP-server-local document name.
     * @param kind - Optional document kind override.
     * @returns The existing or newly created session.
     */
    public createSession(name: string, kind: string = this._adapter.documentKind): IMcpEditorSession {
        const sessionKey = this._getSessionKey(kind, name);
        const existingSessionId = this._sessionByName.get(sessionKey);
        if (existingSessionId) {
            const existingSession = this._sessions.get(existingSessionId);
            if (existingSession) {
                return existingSession;
            }
        }

        const now = Date.now();
        const session: IMcpEditorSession = {
            id: crypto.randomBytes(16).toString("hex"),
            kind,
            name,
            createdAt: now,
            updatedAt: now,
            revision: 0,
        };
        this._sessions.set(session.id, session);
        this._sessionByName.set(sessionKey, session.id);
        this._sseClients.set(session.id, new Set());
        return session;
    }

    /**
     * Get an active session id by document name.
     * @param name - MCP-server-local document name.
     * @param kind - Optional document kind override.
     * @returns The session id, or undefined if no session exists.
     */
    public getSessionIdForName(name: string, kind: string = this._adapter.documentKind): string | undefined {
        return this._sessionByName.get(this._getSessionKey(kind, name));
    }

    /**
     * Get a browser-usable URL for a session.
     * @param sessionId - Session identifier.
     * @param port - Optional port override.
     * @returns The full local session URL.
     */
    public getSessionUrl(sessionId: string, port: number = this._port): string {
        return GetMcpEditorSessionUrl(sessionId, port, this._publicHostname);
    }

    /**
     * Notify connected editors that a session document changed.
     * @param sessionId - Session identifier.
     */
    public notifySessionUpdate(sessionId: string): void {
        void this._sendDocumentUpdateAsync(sessionId);
    }

    /**
     * Close one session and disconnect its editor clients.
     * @param sessionId - Session identifier.
     * @param reason - Optional reason sent to clients.
     * @returns True if a session was closed.
     */
    public closeSession(sessionId: string, reason: string = "Session closed by MCP server"): boolean {
        const session = this._sessions.get(sessionId);
        if (!session) {
            return false;
        }

        const clients = this._sseClients.get(sessionId);
        if (clients) {
            for (const response of clients) {
                response.write(`event: session-closed\ndata: ${JSON.stringify({ reason })}\n\n`);
                response.end();
            }
            clients.clear();
        }

        this._sseClients.delete(sessionId);
        this._sessions.delete(sessionId);
        this._sessionByName.delete(this._getSessionKey(session.kind, session.name));
        return true;
    }

    /**
     * Close a session by document name.
     * @param name - MCP-server-local document name.
     * @param kind - Optional document kind override.
     * @returns True if a session was closed.
     */
    public closeSessionForName(name: string, kind: string = this._adapter.documentKind): boolean {
        const sessionId = this.getSessionIdForName(name, kind);
        return sessionId ? this.closeSession(sessionId) : false;
    }

    /**
     * Get the current server port.
     * @returns Listening port, or 0 when stopped.
     */
    public getPort(): number {
        return this._port;
    }

    /**
     * Get current health information without making an HTTP request.
     * @returns The server health payload.
     */
    public getHealth(): IMcpEditorSessionHealth {
        return {
            protocol: DefaultProtocolName,
            protocolVersion: this._protocolVersion,
            serverName: this._adapter.serverName,
            port: this._port,
            host: this._host,
            publicHostname: this._publicHostname,
            documentKind: this._adapter.documentKind,
            running: this.isRunning(),
            activeSessionCount: this._sessions.size,
            capabilities: [...this._capabilities],
            workspaceId: this._workspaceId,
            ownerId: this._ownerId,
        };
    }

    private _getSessionKey(kind: string, name: string): string {
        return `${kind}:${name}`;
    }

    private async _tryPortRangeAsync(startPort: number, endPort: number): Promise<number> {
        let lastError: unknown;
        for (let portCandidate = startPort; portCandidate <= endPort; portCandidate++) {
            try {
                // eslint-disable-next-line no-await-in-loop
                await this._startOnPortAsync(portCandidate);
                return portCandidate;
            } catch (error) {
                lastError = error;
            }
        }
        throw lastError ?? new Error(`Could not find an open port between ${startPort} and ${endPort}`);
    }

    private async _startOnPortAsync(port: number): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            const server = http.createServer((request, response) => {
                void this._handleRequestAsync(request, response);
            });
            server.once("error", (error: NodeJS.ErrnoException) => {
                reject(new Error(error.message));
            });
            server.listen(port, this._host, () => {
                this._server = server;
                resolve();
            });
        });
    }

    private _setCorsHeaders(response: http.ServerResponse): void {
        response.setHeader("Access-Control-Allow-Origin", this._corsOrigin);
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }

    private async _handleRequestAsync(request: http.IncomingMessage, response: http.ServerResponse): Promise<void> {
        this._setCorsHeaders(response);

        if (request.method === "OPTIONS") {
            response.writeHead(204);
            response.end();
            return;
        }

        const requestUrl = new URL(request.url ?? "/", `http://${this._publicHostname}:${this._port}`);
        const pathname = requestUrl.pathname;

        if (pathname === "/" && request.method === "GET") {
            this._handleStatus(response);
            return;
        }

        if (pathname === "/health" && request.method === "GET") {
            this._writeJson(response, 200, this.getHealth());
            return;
        }

        if (pathname === "/sessions" && request.method === "GET") {
            this._writeJson(
                response,
                200,
                [...this._sessions.values()].map((session) => this._createSessionInfo(session))
            );
            return;
        }

        const sessionMatch = pathname.match(/^\/session\/([^/]+)(?:\/([^/]+))?$/);
        if (!sessionMatch) {
            this._writeText(response, 404, "Not Found");
            return;
        }

        const sessionId = sessionMatch[1];
        const route = sessionMatch[2] ?? "";
        const session = this._sessions.get(sessionId);
        if (!session) {
            this._writeJson(response, 404, { error: `Session "${sessionId}" not found` });
            return;
        }

        if (route === "" && request.method === "GET") {
            this._writeJson(response, 200, this._createSessionInfo(session));
            return;
        }

        if (route === "events" && request.method === "GET") {
            await this._handleSseAsync(session, response);
            return;
        }

        if (this._isDocumentRoute(route)) {
            if (request.method === "GET") {
                await this._handleGetDocumentAsync(session, response);
                return;
            }

            if (request.method === "POST") {
                await this._handlePostDocumentAsync(session, request, response);
                return;
            }
        }

        this._writeText(response, 404, "Not Found");
    }

    private _handleStatus(response: http.ServerResponse): void {
        const lines = [this._statusTitle, "", `Protocol: ${DefaultProtocolName} ${this._protocolVersion}`, `Document kind: ${this._adapter.documentKind}`, ""];
        if (this._sessions.size === 0) {
            lines.push("No active sessions.");
        } else {
            lines.push("Active sessions:");
            for (const session of this._sessions.values()) {
                const clientCount = this._sseClients.get(session.id)?.size ?? 0;
                lines.push(`  ${session.id} -> ${session.name} (${clientCount} subscriber${clientCount === 1 ? "" : "s"}, revision ${session.revision})`);
            }
        }
        this._writeText(response, 200, lines.join("\n"));
    }

    private async _handleSseAsync(session: IMcpEditorSession, response: http.ServerResponse): Promise<void> {
        response.statusCode = 200;
        response.setHeader("Content-Type", "text/event-stream");
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("Connection", "keep-alive");
        response.flushHeaders();

        const clients = this._sseClients.get(session.id)!;
        clients.add(response);
        response.write(": connected\n\n");

        const document = await this._adapter.getDocument(session);
        if (document) {
            this._writeDocumentEvent(response, document);
        }

        response.on("close", () => {
            clients.delete(response);
        });
    }

    private async _handleGetDocumentAsync(session: IMcpEditorSession, response: http.ServerResponse): Promise<void> {
        const document = await this._adapter.getDocument(session);
        if (!document) {
            this._writeJson(response, 404, { error: `Document "${session.name}" not found` });
            return;
        }
        response.statusCode = 200;
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        response.setHeader("Cache-Control", "no-cache");
        response.end(document);
    }

    private async _handlePostDocumentAsync(session: IMcpEditorSession, request: http.IncomingMessage, response: http.ServerResponse): Promise<void> {
        const document = await this._readBodyAsync(request);
        try {
            JSON.parse(document);
        } catch {
            this._writeJson(response, 400, { error: "Invalid JSON" });
            return;
        }

        const result = await this._adapter.setDocument(session, document);
        if (typeof result === "string" && result.length > 0) {
            this._writeJson(response, 400, { error: result });
            return;
        }

        this._touchSession(session);
        this._writeJson(response, 200, { ok: true, revision: session.revision });
        await this._sendDocumentUpdateAsync(session.id, false);
    }

    private async _sendDocumentUpdateAsync(sessionId: string, touchSession: boolean = true): Promise<void> {
        const session = this._sessions.get(sessionId);
        if (!session) {
            return;
        }

        if (touchSession) {
            this._touchSession(session);
        }

        const clients = this._sseClients.get(sessionId);
        if (!clients || clients.size === 0) {
            return;
        }

        const document = await this._adapter.getDocument(session);
        if (!document) {
            return;
        }

        for (const response of clients) {
            this._writeDocumentEvent(response, document);
        }
    }

    private _touchSession(session: IMcpEditorSession): void {
        session.updatedAt = Date.now();
        session.revision++;
    }

    private _writeDocumentEvent(response: http.ServerResponse, document: string): void {
        const compactDocument = JSON.stringify(JSON.parse(document));
        response.write(`data: ${compactDocument}\n\n`);
    }

    private _isDocumentRoute(route: string): boolean {
        return route === "document" || this._legacyDocumentRoutes.has(route);
    }

    private _createSessionInfo(session: IMcpEditorSession): Record<string, unknown> {
        const info: Record<string, unknown> = {
            sessionId: session.id,
            kind: session.kind,
            name: session.name,
            revision: session.revision,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            eventsUrl: `/session/${session.id}/events`,
            documentUrl: `/session/${session.id}/document`,
        };

        for (const route of this._legacyDocumentRoutes) {
            info[`${route}Url`] = `/session/${session.id}/${route}`;
        }

        return info;
    }

    private async _readBodyAsync(request: http.IncomingMessage): Promise<string> {
        const chunks: Buffer[] = [];
        await new Promise<void>((resolve, reject) => {
            request.on("data", (chunk: Buffer) => chunks.push(chunk));
            request.on("end", resolve);
            request.on("error", reject);
        });
        return Buffer.concat(chunks).toString("utf-8");
    }

    private _writeJson(response: http.ServerResponse, statusCode: number, payload: unknown): void {
        response.statusCode = statusCode;
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        response.end(JSON.stringify(payload));
    }

    private _writeText(response: http.ServerResponse, statusCode: number, text: string): void {
        response.statusCode = statusCode;
        response.setHeader("Content-Type", "text/plain; charset=utf-8");
        response.end(text);
    }
}

/**
 * Small reusable controller that binds a graph/document manager to the shared
 * HTTP/SSE editor session server.
 */
export class McpEditorSessionController<Manager> {
    private readonly _adapter: IMcpEditorSessionControllerAdapter<Manager>;
    private readonly _options: IMcpEditorSessionServerOptions;
    private _manager: Manager | null = null;
    private _sessionServer: McpEditorSessionServer | null = null;

    /**
     * Creates a controller for one MCP server's document kind.
     * @param adapter - Manager/document adapter callbacks.
     * @param options - Shared session server options.
     */
    public constructor(adapter: IMcpEditorSessionControllerAdapter<Manager>, options: IMcpEditorSessionServerOptions = {}) {
        this._adapter = adapter;
        this._options = options;
    }

    /**
     * Whether the session server is currently running.
     * @returns True if running, false otherwise.
     */
    public isRunning(): boolean {
        return this._sessionServer?.isRunning() ?? false;
    }

    /**
     * Start the session server if not already running.
     * @param manager - The MCP server graph/document manager.
     * @param port - Optional first port to try.
     * @returns The port the server is listening on.
     */
    public async startAsync(manager: Manager, port?: number): Promise<number> {
        this._manager = manager;
        return await this._getSessionServer().startAsync(port);
    }

    /**
     * Stop the session server.
     */
    public async stopAsync(): Promise<void> {
        if (!this._sessionServer) {
            return;
        }
        await this._sessionServer.stopAsync();
    }

    /**
     * Create a new session for a document.
     * @param name - MCP-server-local document name.
     * @returns The new or existing session ID.
     */
    public createSession(name: string): string {
        return this._getSessionServer().createSession(name).id;
    }

    /**
     * Get the session ID for a given document, if one exists.
     * @param name - MCP-server-local document name.
     * @returns The session ID, or undefined if no session exists for this document.
     */
    public getSessionIdForName(name: string): string | undefined {
        return this._sessionServer?.getSessionIdForName(name);
    }

    /**
     * Get the full session URL.
     * @param sessionId - The session ID.
     * @param port - Optional port override.
     * @returns The full URL to access this session.
     */
    public getSessionUrl(sessionId: string, port?: number): string {
        return this._getSessionServer().getSessionUrl(sessionId, port);
    }

    /**
     * Push the latest document JSON to all SSE subscribers of a session.
     * @param sessionId - The session ID to notify.
     */
    public notifySessionUpdate(sessionId: string): void {
        this._sessionServer?.notifySessionUpdate(sessionId);
    }

    /**
     * Close a single session.
     * @param sessionId - The session ID to close.
     * @returns True if the session existed and was closed, false otherwise.
     */
    public closeSession(sessionId: string): boolean {
        return this._sessionServer?.closeSession(sessionId) ?? false;
    }

    /**
     * Close a session by document name.
     * @param name - MCP-server-local document name.
     * @returns True if a session was closed, false if none existed.
     */
    public closeSessionForName(name: string): boolean {
        return this._sessionServer?.closeSessionForName(name) ?? false;
    }

    /**
     * Returns the port the session server is running on.
     * @returns The port number, or 0 if the server is not running.
     */
    public getPort(): number {
        return this._sessionServer?.getPort() ?? 0;
    }

    /**
     * Get current health information without making an HTTP request.
     * @returns The server health payload.
     */
    public getHealth(): IMcpEditorSessionHealth {
        return this._getSessionServer().getHealth();
    }

    private _getSessionServer(): McpEditorSessionServer {
        if (!this._sessionServer) {
            this._sessionServer = new McpEditorSessionServer(
                {
                    serverName: this._adapter.serverName,
                    documentKind: this._adapter.documentKind,
                    getDocument: (session): string | undefined | Promise<string | undefined> => (this._manager ? this._adapter.getDocument(this._manager, session) : undefined),
                    setDocument: (session, document): string | void | Promise<string | void> => {
                        if (!this._manager) {
                            return this._adapter.managerUnavailableMessage ?? "Document manager is not available";
                        }
                        return this._adapter.setDocument(this._manager, session, document);
                    },
                },
                this._options
            );
        }

        return this._sessionServer;
    }
}
