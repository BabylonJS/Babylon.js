import { type IDisposable, type Nullable } from "core/index";
import { Logger } from "core/Misc/logger";
import { Observable } from "core/Misc/observable";
import { type Scene } from "core/scene";
import { type WeaklyTypedServiceDefinition, ServiceContainer } from "shared-ui-components/modularTool/modularity/serviceContainer";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { EntityQueryServiceDefinition } from "./services/cli/entityQueryService";
import { MakeInspectableBridgeServiceDefinition } from "./services/cli/inspectableBridgeService";
import { PerfTraceCommandServiceDefinition } from "./services/cli/perfTraceCommandService";
import { ScreenshotCommandServiceDefinition } from "./services/cli/screenshotCommandService";
import { ShaderCommandServiceDefinition } from "./services/cli/shaderCommandService";
import { StatsCommandServiceDefinition } from "./services/cli/statsCommandService";
import { type ISceneContext, SceneContextIdentity } from "./services/sceneContext";

const DefaultPort = 4400;

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

    /**
     * Whether the CLI bridge should automatically start trying to connect
     * when the inspectable session is created. Defaults to false.
     */
    autoStart?: boolean;

    /**
     * Additional service definitions to register with the inspectable container.
     * These are added in a separate call from the built-in services and are removed
     * when the returned token is disposed.
     */
    serviceDefinitions?: readonly WeaklyTypedServiceDefinition[];
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

/**
 * @internal
 * An internal token that also exposes the underlying ServiceContainer,
 * allowing ShowInspector to use it as a parent container.
 */
export type InternalInspectableToken = InspectableToken & {
    /**
     * The ServiceContainer backing this inspectable session.
     */
    readonly serviceContainer: ServiceContainer;
};

// Track shared state per scene: the service container, ref count, and teardown logic.
type InspectableState = {
    refCount: number;
    serviceContainer: ServiceContainer;
    sceneDisposeObserver: { remove: () => void };
    fullyDispose: () => void;
    /** Resolves when the built-in services have been initialized. Rejects if initialization fails. */
    readyPromise: Promise<void>;
};

const InspectableStates = new Map<Scene, InspectableState>();

/**
 * @internal
 * Internal implementation that returns an {@link InternalInspectableToken} with access
 * to the underlying ServiceContainer. Used by ShowInspector to set up a parent container relationship.
 */
export function _StartInspectable(scene: Scene, options?: Partial<InspectableOptions>): InternalInspectableToken {
    let state = InspectableStates.get(scene);

    if (!state) {
        const port = options?.port ?? DefaultPort;
        const name = options?.name ?? (typeof document !== "undefined" ? document.title : "Babylon.js Scene");

        const serviceContainer = new ServiceContainer("InspectableContainer");

        const fullyDispose = () => {
            InspectableStates.delete(scene);
            serviceContainer.dispose();
            sceneDisposeObserver.remove();
        };

        // Initialize the service container asynchronously.
        const sceneContextServiceDefinition: ServiceDefinition<[ISceneContext], []> = {
            friendlyName: "Inspectable Scene Context",
            produces: [SceneContextIdentity],
            factory: () => ({
                currentScene: scene,
                currentSceneObservable: new Observable<Nullable<Scene>>(),
            }),
        };

        const readyPromise = (async () => {
            await serviceContainer.addServicesAsync(
                sceneContextServiceDefinition,
                MakeInspectableBridgeServiceDefinition({
                    port,
                    name,
                    autoStart: options?.autoStart ?? false,
                }),
                EntityQueryServiceDefinition,
                ScreenshotCommandServiceDefinition,
                ShaderCommandServiceDefinition,
                StatsCommandServiceDefinition,
                PerfTraceCommandServiceDefinition
            );
        })();

        state = {
            refCount: 0,
            serviceContainer,
            sceneDisposeObserver: { remove: () => {} },
            fullyDispose,
            readyPromise,
        };

        const capturedState = state;

        InspectableStates.set(scene, state);

        // Auto-dispose when the scene is disposed.
        const sceneDisposeObserver = scene.onDisposeObservable.addOnce(() => {
            capturedState.refCount = 0;
            capturedState.fullyDispose();
        });
        state.sceneDisposeObserver = sceneDisposeObserver;

        // Handle initialization failure (guard against already-disposed state).
        void (async () => {
            try {
                await readyPromise;
            } catch (error: unknown) {
                if (InspectableStates.has(scene)) {
                    Logger.Error(`Failed to initialize Inspectable: ${error}`);
                    capturedState.refCount = 0;
                    capturedState.fullyDispose();
                }
            }
        })();
    }

    state.refCount++;
    const { serviceContainer } = state;
    const owningState = state;

    // If additional service definitions were provided, add them in a separate call
    // so they can be independently removed when this token is disposed.
    let extraServicesDisposable: IDisposable | undefined;
    const extraAbortController = new AbortController();
    const extraServiceDefinitions = options?.serviceDefinitions;
    if (extraServiceDefinitions && extraServiceDefinitions.length > 0) {
        // Wait for the built-in services to be ready, then add the extra ones.
        void (async () => {
            try {
                await owningState.readyPromise;
                extraServicesDisposable = await serviceContainer.addServicesAsync(...extraServiceDefinitions, extraAbortController.signal);
            } catch (error: unknown) {
                if (!extraAbortController.signal.aborted) {
                    Logger.Error(`Failed to add extra inspectable services: ${error}`);
                }
            }
        })();
    }

    let disposed = false;
    const token: InternalInspectableToken = {
        get isDisposed() {
            return disposed;
        },
        get serviceContainer() {
            return serviceContainer;
        },
        dispose() {
            if (disposed) {
                return;
            }
            disposed = true;

            // Abort any in-flight extra service initialization and remove already-added extra services.
            extraAbortController.abort();
            extraServicesDisposable?.dispose();

            owningState.refCount--;
            if (owningState.refCount <= 0) {
                owningState.fullyDispose();
            }
        },
    };

    return token;
}

/**
 * Makes a scene inspectable by connecting it to the Inspector CLI bridge.
 * This creates a headless {@link ServiceContainer} (no UI) and registers the
 * {@link InspectableBridgeService} which opens a WebSocket to the bridge and
 * exposes a command registry for CLI-invocable commands.
 *
 * Multiple callers may call this for the same scene. Each returned token is
 * ref-counted — the underlying connection is only torn down when all tokens
 * have been disposed. Additional {@link InspectableOptions.serviceDefinitions}
 * passed by each caller are added to the shared container and removed when
 * that caller's token is disposed.
 *
 * @param scene The scene to make inspectable.
 * @param options Optional configuration.
 * @returns An {@link InspectableToken} that can be disposed to disconnect.
 * @experimental
 */
export function StartInspectable(scene: Scene, options?: Partial<InspectableOptions>): InspectableToken {
    return _StartInspectable(scene, options);
}
