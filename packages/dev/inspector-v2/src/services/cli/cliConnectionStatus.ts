import { type IReadonlyObservable } from "core/index";
import { type IService } from "../../modularity/serviceDefinition";

/**
 * The service identity for the CLI connection status.
 */
export const CliConnectionStatusIdentity = Symbol("CliConnectionStatus");

/**
 * Provides the connection status of the Inspector CLI bridge.
 */
export interface ICliConnectionStatus extends IService<typeof CliConnectionStatusIdentity> {
    /**
     * Whether the bridge WebSocket is currently connected.
     */
    readonly isConnected: boolean;

    /**
     * Observable that fires when the connection status changes.
     */
    readonly onConnectionStatusChanged: IReadonlyObservable<boolean>;
}
