/* eslint-disable @typescript-eslint/naming-convention */

import { GetMcpEditorSessionUrl, McpEditorSessionServer } from "@tools/mcp-server-core";
import { type MaterialGraphManager } from "./materialGraph.js";

let _manager: MaterialGraphManager | null = null;
let _sessionServer: McpEditorSessionServer | null = null;

function _getSessionServer(): McpEditorSessionServer {
    if (!_sessionServer) {
        _sessionServer = new McpEditorSessionServer(
            {
                serverName: "NME MCP Session Server",
                documentKind: "node-material",
                getDocument: (session) => _manager?.exportJSON(session.name),
                setDocument: (session, document) => {
                    if (!_manager) {
                        return "Material manager is not available";
                    }
                    const result = _manager.importJSON(session.name, document);
                    return result && result !== "OK" ? result : undefined;
                },
            },
            {
                defaultPort: 3001,
                legacyDocumentRoutes: ["material"],
                statusTitle: "NME MCP Session Server",
            }
        );
    }

    return _sessionServer;
}

/**
 * Whether the session server is currently running.
 * @returns True if running, false otherwise.
 */
export function isSessionServerRunning(): boolean {
    return _sessionServer?.isRunning() ?? false;
}

/**
 * Create a new session for a material.
 * @param materialName - The name of the material to associate with this session.
 * @returns The new or existing session ID.
 */
export function createSession(materialName: string): string {
    return _getSessionServer().createSession(materialName).id;
}

/**
 * Get the session ID for a given material, if one exists.
 * @param materialName - The name of the material.
 * @returns The session ID, or undefined if no session exists for this material.
 */
export function getSessionForMaterial(materialName: string): string | undefined {
    return _sessionServer?.getSessionIdForName(materialName);
}

/**
 * Get the full session URL.
 * @param sessionId - The session ID.
 * @param port - The port the server is running on.
 * @returns The full URL to access this session.
 */
export function getSessionUrl(sessionId: string, port: number): string {
    return GetMcpEditorSessionUrl(sessionId, port);
}

/**
 * Push the latest material JSON to all SSE subscribers of a session.
 * @param sessionId - The session ID to notify.
 */
export function notifyMaterialUpdate(sessionId: string): void {
    _sessionServer?.notifySessionUpdate(sessionId);
}

/**
 * Start the session server if not already running.
 * @param manager - The MaterialGraphManager instance.
 * @param port - Port to listen on. Tries the configured port range if in use.
 * @returns The port the server is listening on.
 */
export async function startSessionServer(manager: MaterialGraphManager, port: number = 3001): Promise<number> {
    _manager = manager;
    return await _getSessionServer().startAsync(port);
}

/**
 * Stop the session server.
 */
export async function stopSessionServer(): Promise<void> {
    if (!_sessionServer) {
        return;
    }
    await _sessionServer.stopAsync();
}

/**
 * Close a single session.
 * @param sessionId - The session ID to close.
 * @returns True if the session existed and was closed, false otherwise.
 */
export function closeSession(sessionId: string): boolean {
    return _sessionServer?.closeSession(sessionId) ?? false;
}

/**
 * Close a session by material name.
 * @param materialName - The material name whose session should be closed.
 * @returns True if a session was closed, false if none existed.
 */
export function closeSessionForMaterial(materialName: string): boolean {
    return _sessionServer?.closeSessionForName(materialName) ?? false;
}

/**
 * Returns the port the session server is running on.
 * @returns The port number, or 0 if the server is not running.
 */
export function getSessionServerPort(): number {
    return _sessionServer?.getPort() ?? 0;
}
