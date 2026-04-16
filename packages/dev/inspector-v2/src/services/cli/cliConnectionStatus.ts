import { type IReadonlyObservable } from "core/index";
import { type IService } from "shared-ui-components/modularTool/modularity/serviceDefinition";

/**
 * The service identity for the CLI connection status.
 */
export const CliConnectionStatusIdentity = Symbol("CliConnectionStatus");

/**
 * Provides the connection status and enable/disable control for the Inspector CLI bridge.
 */
export interface ICliConnectionStatus extends IService<typeof CliConnectionStatusIdentity> {
    /**
     * Whether the bridge is enabled. When true, the bridge actively tries to
     * maintain a WebSocket connection. When false, the bridge is disconnected
     * and idle.
     */
    isEnabled: boolean;

    /**
     * Whether the bridge WebSocket is currently connected.
     */
    readonly isConnected: boolean;

    /**
     * Observable that fires when either {@link isEnabled} or {@link isConnected} changes.
     */
    readonly onConnectionStatusChanged: IReadonlyObservable<void>;
}
