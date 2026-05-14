import { type IDisposable } from "core/index";

import { type IService, type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";

import { GlobalState } from "../globalState";
import { type IFlowGraphEditorOptions } from "../flowGraphEditor";
import { SerializationTools } from "../serializationTools";

/** Service identity for the flow graph editor's GlobalState. */
export const GlobalStateServiceIdentity = Symbol("GlobalStateService");

/**
 * Service contract that exposes the editor's {@link GlobalState} to other services.
 *
 * The {@link GlobalState} class itself is large (lots of observables, helpers, mutators)
 * and intentionally not refactored as part of the Fluent port — the service simply makes
 * the existing instance available via the modular tool's service container.
 */
export interface IGlobalStateService extends IService<typeof GlobalStateServiceIdentity> {
    readonly globalState: GlobalState;
}

/**
 * Builds a {@link ServiceDefinition} for the flow graph editor's {@link GlobalState}.
 *
 * Uses a factory rather than {@link IFlowGraphEditorOptions} on a parent container because the
 * options describe instance-specific inputs to this particular editor invocation
 * (`flowGraph`, `hostScene`, `customSave`, ...), not shared parent-scoped services.
 *
 * @param options The editor options provided to `FlowGraphEditor.Show()`.
 * @param hostElement The host DOM element (popup body or caller-supplied container).
 *                    `GlobalState` needs the host element/document/window for popup-aware
 *                    behaviour and for the state manager.
 * @returns A service definition that produces an {@link IGlobalStateService}.
 */
export function MakeGlobalStateService(options: IFlowGraphEditorOptions, hostElement: HTMLElement): ServiceDefinition<[IGlobalStateService], []> {
    return {
        friendlyName: "Global State Service",
        produces: [GlobalStateServiceIdentity],
        factory: () => {
            const scene = options.hostScene ?? options.flowGraph.scene;
            const globalState = new GlobalState(scene);

            // If the flow graph belongs to a coordinator, use it for multi-graph support.
            // Otherwise the flowGraph setter will handle single-graph mode.
            const existingCoordinator = options.flowGraph.coordinator;
            if (existingCoordinator) {
                globalState.coordinator = existingCoordinator;
                const activeIndex = existingCoordinator.flowGraphs.indexOf(options.flowGraph);
                if (activeIndex >= 0) {
                    globalState.activeGraphIndex = activeIndex;
                }
            } else {
                globalState.flowGraph = options.flowGraph;
            }

            globalState.hostElement = hostElement;
            globalState.hostDocument = hostElement.ownerDocument!;
            globalState.hostScene = options.hostScene;
            globalState.customSave = options.customSave;
            globalState.hostWindow = hostElement.ownerDocument.defaultView!;
            globalState.stateManager.hostDocument = globalState.hostDocument;

            // Wire the optional load observable that callers can use to push
            // serialized graph state back into the editor at any time.
            const loadObserver = options.customLoadObservable?.add((data) => {
                const doLoadAsync = async () => {
                    await SerializationTools.DeserializeAsync(data, globalState);
                };
                void doLoadAsync();
            });

            return {
                globalState,
                dispose: () => {
                    options.customLoadObservable?.remove(loadObserver ?? null);
                },
            };
        },
    };
}
