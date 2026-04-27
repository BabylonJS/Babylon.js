/**
 * Re-exports WebSocket and WebSocketServer from the ws package.
 *
 * ws is a CJS module — named exports like WebSocketServer aren't available
 * at runtime when Node auto-detects ESM from tsc output. This module works
 * around that by extracting them from the default export and re-exporting
 * them as merged type+value pairs.
 */
import ws from "ws";

export const WebSocket = ws;
export type WebSocket = import("ws").WebSocket;

export const WebSocketServer = (
    ws as unknown as {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Server: new (options?: import("ws").ServerOptions) => import("ws").WebSocketServer;
    }
).Server;
export type WebSocketServer = import("ws").WebSocketServer;
