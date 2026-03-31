import { type IDisposable, type Nullable } from "core/index";
import { Logger } from "core/Misc/logger";
import { Observable } from "core/Misc/observable";
import { type Scene } from "core/scene";
import { ServiceContainer } from "./modularity/serviceContainer";
import { type ServiceDefinition } from "./modularity/serviceDefinition";
import { EntityQueryServiceDefinition } from "./services/cli/entityQueryService";
import { MakeInspectableBridgeServiceDefinition } from "./services/cli/inspectableBridgeService";
import { PerfTraceCommandServiceDefinition } from "./services/cli/perfTraceCommandService";
import { ScreenshotCommandServiceDefinition } from "./services/cli/screenshotCommandService";
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

// Track shared state per scene: the service container, ref count, and teardown logic.
type InspectableState = {
    refCount: number;
    serviceContainer: ServiceContainer;
    sceneDisposeObserver: { remove: () => void };
    fullyDispose: () => void;
};

const InspectableStates = new Map<Scene, InspectableState>();

/**
 * Makes a scene inspectable by connecting it to the Inspector CLI bridge.
 * This creates a headless {@link ServiceContainer} (no UI) and registers the
 * {@link InspectableBridgeService} which opens a WebSocket to the bridge and
 * exposes a command registry for CLI-invocable commands.
 *
 * Multiple callers may call this for the same scene. Each returned token is
 * ref-counted — the underlying connection is only torn down when all tokens
 * have been disposed.
 *
 * @param scene The scene to make inspectable.
 * @param options Optional configuration.
 * @returns An {@link InspectableToken} that can be disposed to disconnect.
 */
export function StartInspectable(scene: Scene, options?: Partial<InspectableOptions>): InspectableToken {
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

        state = {
            refCount: 0,
            serviceContainer,
            sceneDisposeObserver: { remove: () => {} },
            fullyDispose,
        };

        InspectableStates.set(scene, state);

        // Auto-dispose when the scene is disposed.
        const capturedState = state;
        const sceneDisposeObserver = scene.onDisposeObservable.addOnce(() => {
            capturedState.refCount = 0;
            capturedState.fullyDispose();
        });
        state.sceneDisposeObserver = sceneDisposeObserver;

        // Initialize the service container asynchronously.
        const sceneContextServiceDefinition: ServiceDefinition<[ISceneContext], []> = {
            friendlyName: "Inspectable Scene Context",
            produces: [SceneContextIdentity],
            factory: () => ({
                currentScene: scene,
                currentSceneObservable: new Observable<Nullable<Scene>>(),
            }),
        };

        void (async () => {
            try {
                await serviceContainer.addServicesAsync(
                    sceneContextServiceDefinition,
                    MakeInspectableBridgeServiceDefinition({
                        port,
                        name,
                    }),
                    EntityQueryServiceDefinition,
                    ScreenshotCommandServiceDefinition,
                    StatsCommandServiceDefinition,
                    PerfTraceCommandServiceDefinition
                );
            } catch (error: unknown) {
                Logger.Error(`Failed to initialize Inspectable: ${error}`);
                capturedState.refCount = 0;
                capturedState.fullyDispose();
            }
        })();
    }

    state.refCount++;
    const owningState = state;

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
            owningState.refCount--;
            if (owningState.refCount <= 0) {
                owningState.fullyDispose();
            }
        },
    };

    return token;
}
