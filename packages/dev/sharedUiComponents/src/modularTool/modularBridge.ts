import { type IDisposable } from "core/index";
import { type WeaklyTypedServiceDefinition, ServiceContainer } from "./modularity/serviceContainer";
import { MakeBridgeServiceDefinition } from "./services/cli/bridgeService";

const DefaultPort = 4400;

/**
 * Options for creating a modular bridge container.
 * @experimental
 * @internal
 */
export type ModularBridgeOptions = {
    /**
     * WebSocket port for the bridge's browser port. Defaults to 4400.
     */
    port?: number;

    /**
     * Session display name reported to the bridge. Defaults to `document.title`.
     */
    name?: string;

    /**
     * Whether the bridge should automatically enable trying to connect.
     * Defaults to true.
     */
    autoEnable?: boolean;

    /**
     * Additional service definitions to register with the bridge container.
     */
    serviceDefinitions?: readonly WeaklyTypedServiceDefinition[];
};

/**
 * A token returned by {@link MakeModularBridge} that owns the headless
 * {@link ServiceContainer}. Dispose it to tear down the bridge and all services.
 * @experimental
 * @internal
 */
export type ModularBridgeToken = IDisposable & {
    /**
     * The headless ServiceContainer that hosts the bridge.
     */
    readonly serviceContainer: ServiceContainer;

    /**
     * Whether this token has been disposed.
     */
    readonly isDisposed: boolean;
};

/**
 * Creates a headless {@link ServiceContainer} that hosts a bridge service.
 *
 * The returned token owns the container. Dispose it to tear down the bridge.
 *
 * @param options Optional configuration for the bridge.
 * @returns A {@link ModularBridgeToken} that owns the container.
 * @experimental
 * @internal
 */
export function MakeModularBridge(options?: ModularBridgeOptions): ModularBridgeToken {
    const serviceContainer = new ServiceContainer("ModularBridgeContainer");

    const bridgeDefinition = MakeBridgeServiceDefinition({
        port: options?.port ?? DefaultPort,
        get name() {
            return options?.name ?? (typeof document !== "undefined" ? document.title : "Babylon.js Scene");
        },
        autoEnable: options?.autoEnable ?? true,
    });

    const allDefinitions: WeaklyTypedServiceDefinition[] = [bridgeDefinition];
    if (options?.serviceDefinitions) {
        allDefinitions.push(...options.serviceDefinitions);
    }

    serviceContainer.addServices(...allDefinitions);

    let disposed = false;

    return {
        get serviceContainer() {
            return serviceContainer;
        },
        get isDisposed() {
            return disposed;
        },
        dispose() {
            disposed = true;
            serviceContainer.dispose();
        },
    };
}
