const DocumentRoute = "document";

/**
 * Options used to open an MCP editor session event stream.
 */
export interface IMcpEditorSessionEventSourceOptions {
    /** Base session URL, such as `http://localhost:3001/session/<id>`. */
    sessionUrl: string;
    /** Called whenever the server sends a document update. */
    onDocument: (document: unknown) => void;
    /** Called when the server explicitly closes the session. */
    onSessionClosed: (reason: string) => void;
    /** Called when the EventSource reports a connection error. */
    onConnectionError: () => void;
}

/**
 * Normalize a user-provided MCP editor session URL.
 * @param sessionUrl - The URL entered by the user or returned by an MCP tool.
 * @returns The URL without trailing slash characters.
 */
export function NormalizeMcpEditorSessionUrl(sessionUrl: string): string {
    return sessionUrl.replace(/\/+$/, "");
}

/**
 * Open an EventSource for server-to-editor MCP session updates.
 * @param options - Event stream options and callbacks.
 * @returns The opened EventSource. Call `CloseMcpEditorSessionEventSource` to disconnect it.
 */
export function OpenMcpEditorSessionEventSource(options: IMcpEditorSessionEventSourceOptions): EventSource {
    const normalizedUrl = NormalizeMcpEditorSessionUrl(options.sessionUrl);
    const eventSource = new EventSource(`${normalizedUrl}/events`);

    eventSource.onmessage = (event) => {
        try {
            options.onDocument(JSON.parse(event.data));
        } catch {
            // Ignore malformed document updates and keep the live session open.
        }
    };

    eventSource.addEventListener("session-closed", (event) => {
        options.onSessionClosed(ReadSessionClosedReason(event));
        eventSource.close();
    });

    eventSource.onerror = () => {
        options.onConnectionError();
        eventSource.close();
    };

    return eventSource;
}

/**
 * Close an MCP editor session EventSource if one is active.
 * @param eventSource - EventSource to close.
 */
export function CloseMcpEditorSessionEventSource(eventSource: EventSource | null | undefined): void {
    eventSource?.close();
}

/**
 * Post a document JSON payload to an MCP editor session.
 * @param sessionUrl - Base session URL, such as `http://localhost:3001/session/<id>`.
 * @param document - Serialized JSON document to send to the MCP server.
 * @param legacyDocumentRoute - Optional compatibility route to try when `/document` is unavailable.
 * @returns The final fetch response from the standard or compatibility route.
 */
export async function PostMcpEditorSessionDocumentAsync(sessionUrl: string, document: string, legacyDocumentRoute?: string): Promise<Response> {
    const normalizedUrl = NormalizeMcpEditorSessionUrl(sessionUrl);
    const response = await PostDocumentToRouteAsync(normalizedUrl, DocumentRoute, document);
    if (response.ok || !legacyDocumentRoute || (response.status !== 404 && response.status !== 405)) {
        return response;
    }

    return await PostDocumentToRouteAsync(normalizedUrl, legacyDocumentRoute.replace(/^\//, ""), document);
}

async function PostDocumentToRouteAsync(sessionUrl: string, route: string, document: string): Promise<Response> {
    const headers = new Headers();
    headers.set("Content-Type", "application/json");

    return await fetch(`${sessionUrl}/${route}`, {
        method: "POST",
        headers,
        body: document,
    });
}

function ReadSessionClosedReason(event: Event): string {
    try {
        const data = JSON.parse((event as MessageEvent).data);
        return typeof data.reason === "string" ? data.reason : "Session closed by MCP server";
    } catch {
        return "Session closed by MCP server";
    }
}
