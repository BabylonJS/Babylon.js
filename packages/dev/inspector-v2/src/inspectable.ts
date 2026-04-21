import { type IDisposable, type Nullable } from "core/index";
import { Observable } from "core/Misc/observable";
import { type Scene } from "core/scene";
import { ServiceContainer } from "shared-ui-components/modularTool/modularity/serviceContainer";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type ModularBridgeOptions, type ModularBridgeToken, MakeModularBridge } from "shared-ui-components/modularTool/modularBridge";
import { EntityQueryServiceDefinition } from "./services/cli/entityQueryService";
import { PerfTraceCommandServiceDefinition } from "./services/cli/perfTraceCommandService";
import { ScreenshotCommandServiceDefinition } from "./services/cli/screenshotCommandService";
import { ShaderCommandServiceDefinition } from "./services/cli/shaderCommandService";
import { StatsCommandServiceDefinition } from "./services/cli/statsCommandService";
import { type ISceneContext, SceneContextIdentity } from "./services/sceneContext";

const DefaultPort = 4400;

/**
 * Options for making a scene inspectable via the Inspector CLI.
 */
export type InspectableOptions =
    | (Pick<ModularBridgeOptions, "serviceDefinitions"> & {
          /**
           * An existing modular bridge token whose ServiceContainer will be used as
           * the parent for the inspectable container. The bridge already exists
           * in the bridge token's container, so bridge options are not accepted.
           * @experimental
           */
          bridgeToken: ModularBridgeToken;
          port?: never;
          name?: never;
          autoEnable?: never;
      })
    | (ModularBridgeOptions & {
          bridgeToken?: never;
      });

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
    readonly fullyDisposed: boolean;
    serviceContainer: ServiceContainer;
    fullyDispose: () => void;
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
        const disposeActions: (() => void)[] = [];

        // When a bridgeToken is provided, use its container as the parent and skip bridge creation.
        // When not, create an internal bridge container via MakeModularBridge.
        let bridgeToken: ModularBridgeToken;
        if (options?.bridgeToken) {
            bridgeToken = options.bridgeToken;
        } else {
            bridgeToken = MakeModularBridge({
                port: options?.port ?? DefaultPort,
                name: options?.name,
                autoEnable: options?.autoEnable,
            });
            disposeActions.push(() => bridgeToken.dispose());
        }

        const serviceContainer = new ServiceContainer("InspectableContainer", bridgeToken.serviceContainer);
        disposeActions.push(() => serviceContainer.dispose());

        let fullyDisposed = false;
        const fullyDispose = () => {
            InspectableStates.delete(scene);
            fullyDisposed = true;
            for (const action of disposeActions.reverse()) {
                action();
            }
        };

        // Initialize the service container.
        const sceneContextServiceDefinition: ServiceDefinition<[ISceneContext], []> = {
            friendlyName: "Inspectable Scene Context",
            produces: [SceneContextIdentity],
            factory: () => ({
                currentScene: scene,
                currentSceneObservable: new Observable<Nullable<Scene>>(),
            }),
        };

        serviceContainer.addServices(
            sceneContextServiceDefinition,
            EntityQueryServiceDefinition,
            ScreenshotCommandServiceDefinition,
            ShaderCommandServiceDefinition,
            StatsCommandServiceDefinition,
            PerfTraceCommandServiceDefinition
        );

        state = {
            refCount: 0,
            get fullyDisposed() {
                return fullyDisposed;
            },
            serviceContainer,
            fullyDispose,
        };

        const capturedState = state;

        InspectableStates.set(scene, state);

        // Auto-dispose when the scene is disposed. Use insertFirst so that
        // callbacks registered later (e.g. ShowInspector) fire before this one,
        // ensuring child containers are disposed before this parent container.
        const sceneDisposeObserver = scene.onDisposeObservable.add(
            () => {
                capturedState.refCount = 0;
                capturedState.fullyDispose();
            },
            undefined,
            true,
            undefined,
            true
        );
        disposeActions.push(() => sceneDisposeObserver.remove());
    }

    state.refCount++;
    const { serviceContainer } = state;
    const owningState = state;

    // If additional service definitions were provided, add them in a separate call
    // so they can be independently removed when this token is disposed.
    let extraServicesDisposable: IDisposable | undefined;
    const extraServiceDefinitions = options?.serviceDefinitions;
    if (extraServiceDefinitions && extraServiceDefinitions.length > 0) {
        extraServicesDisposable = serviceContainer.addServices(...extraServiceDefinitions);
    }

    let disposed = false;
    const token: InternalInspectableToken = {
        get isDisposed() {
            return disposed || owningState.fullyDisposed;
        },
        get serviceContainer() {
            return serviceContainer;
        },
        dispose() {
            if (disposed) {
                return;
            }
            disposed = true;

            // Remove extra services that were added for this token.
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
 * This creates a headless {@link ServiceContainer} (no UI) that registers
 * scene-specific CLI command services (entity query, screenshot, shader, stats, etc.).
 *
 * When {@link InspectableOptions.bridgeToken} is provided, the inspectable container
 * is created as a child of the CLI container, inheriting the bridge and command registry.
 * When not provided, a bridge container is created internally via {@link MakeModularBridge}.
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
