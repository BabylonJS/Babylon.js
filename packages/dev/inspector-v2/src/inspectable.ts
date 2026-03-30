import type { IDisposable, Nullable } from "core/index";
import type { Scene } from "core/scene";
import type { ServiceDefinition } from "./modularity/serviceDefinition";
import type { ISceneContext } from "./services/sceneContext";

import { Logger } from "core/Misc/logger";
import { Observable } from "core/Misc/observable";
import { ServiceContainer } from "./modularity/serviceContainer";
import { SceneContextIdentity } from "./services/sceneContext";
import { MakeInspectableBridgeServiceDefinition } from "./services/cli/inspectableBridgeService";
import { EntityQueryServiceDefinition } from "./services/cli/entityQueryService";

const DEFAULT_PORT = 4400;

/**
 * Options for making a scene inspectable via the Inspector CLI.
 */
export type InspectableOptions = {
    /**
     * WebSocket port for the bridge's browser port. Defaults to 4400.
     */
    port?: number;

    /**
     * Session display name reported to the bridge. Defaults to `document.title`.
     */
    name?: string;
};

/**
 * A token returned by {@link StartInspectable} that can be disposed to disconnect
 * the scene from the Inspector CLI bridge.
 */
export type InspectableToken = IDisposable & {
    /**
     * Whether this token has been disposed.
     */
    readonly isDisposed: boolean;
};

// Track one token per scene so we can return the existing one or clean up on re-entry.
const InspectableTokens = new Map<Scene, InspectableToken>();

/**
 * Makes a scene inspectable by connecting it to the Inspector CLI bridge.
 * This creates a headless {@link ServiceContainer} (no UI) and registers the
 * {@link InspectableBridgeService} which opens a WebSocket to the bridge and
 * exposes a command registry for CLI-invocable commands.
 *
 * If the scene is already inspectable, the existing token is returned.
 *
 * @param scene The scene to make inspectable.
 * @param options Optional configuration.
 * @returns An {@link InspectableToken} that can be disposed to disconnect.
 */
export function StartInspectable(scene: Scene, options?: Partial<InspectableOptions>): InspectableToken {
    // If there is already an active token for this scene, return it.
    const existing = InspectableTokens.get(scene);
    if (existing && !existing.isDisposed) {
        return existing;
    }

    const port = options?.port ?? DEFAULT_PORT;
    const name = options?.name ?? (typeof document !== "undefined" ? document.title : "Babylon.js Scene");

    const serviceContainer = new ServiceContainer("InspectableContainer");

    let disposed = false;

    const token: InspectableToken = {
        get isDisposed() {
            return disposed;
        },
        dispose() {
            if (disposed) {
                return;
            }
            disposed = true;
            serviceContainer.dispose();
            InspectableTokens.delete(scene);
            sceneDisposeObserver.remove();
        },
    };

    InspectableTokens.set(scene, token);

    // Auto-dispose when the scene is disposed.
    const sceneDisposeObserver = scene.onDisposeObservable.addOnce(() => {
        token.dispose();
    });

    // Initialize the service container asynchronously.
    const sceneContextServiceDefinition: ServiceDefinition<[ISceneContext], []> = {
        friendlyName: "Inspectable Scene Context",
        produces: [SceneContextIdentity],
        factory: () => ({
            currentScene: scene,
            currentSceneObservable: new Observable<Nullable<Scene>>(),
        }),
    };

    serviceContainer
        .addServicesAsync(
            sceneContextServiceDefinition,
            MakeInspectableBridgeServiceDefinition({
                port,
                name,
            }),
            EntityQueryServiceDefinition
        )
        .catch((error: unknown) => {
            Logger.Error(`Failed to initialize InspectableBridgeService: ${error}`);
            token.dispose();
        });

    return token;
}
