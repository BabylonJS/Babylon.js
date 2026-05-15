/**
 * Re-exports WebSocket and WebSocketServer from the ws package.
 *
 * ws is a CJS module with different shapes for default and namespace imports.
 * This module normalizes those imports and re-exports them as merged type+value pairs.
 */
import WebSocketDefault, * as wsNamespace from "ws";

export const WebSocket = WebSocketDefault;
export type WebSocket = import("ws").WebSocket;

export const WebSocketServer = (
    wsNamespace as unknown as {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        WebSocketServer: new (options?: import("ws").ServerOptions) => import("ws").WebSocketServer;
    }
).WebSocketServer;
export type WebSocketServer = import("ws").WebSocketServer;
