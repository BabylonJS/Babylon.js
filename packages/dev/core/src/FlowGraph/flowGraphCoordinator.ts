import type { Observer } from "core/Misc/observable";
import { Observable } from "core/Misc/observable";
import type { Scene } from "../scene";
import { FlowGraph } from "./flowGraph";
import type { IPathToObjectConverter } from "../ObjectModel/objectModelInterfaces";
import type { IObjectAccessor } from "./typeDefinitions";
import type { IAssetContainer } from "core/IAssetContainer";
import { Logger } from "core/Misc/logger";

/**
 * Parameters used to create a flow graph engine.
 */
export interface IFlowGraphCoordinatorConfiguration {
    /**
     * The scene that the flow graph engine belongs to.
     */
    scene: Scene;
}

/**
 * Parameters used to parse a flow graph coordinator.
 */
export interface FlowGraphCoordinatorParseOptions {
    /**
     * A function that will be called to parse the value of a property.
     * @param key the key of the property
     * @param serializationObject the serialization object where the property is located
     * @param scene the scene that the block is being parsed in
     */
    valueParseFunction?: (key: string, serializationObject: any, assetsContainer: IAssetContainer, scene: Scene) => any;
    /**
     * The path converter to use to convert the path to an object accessor.
     */
    pathConverter: IPathToObjectConverter<IObjectAccessor>;
    /**
     * The scene that the flow graph coordinator belongs to.
     */
    scene: Scene;
}
/**
 * This class holds all of the existing flow graphs and is responsible for creating new ones.
 * It also handles starting/stopping multiple graphs and communication between them through an Event Coordinator
 * This is the entry point for the flow graph system.
 * @experimental This class is still in development and is subject to change.
 */
export class FlowGraphCoordinator {
    /**
     * The maximum number of events per type.
     * This is used to limit the number of events that can be created in a single scene.
     * This is to prevent infinite loops.
     */
    public static MaxEventsPerType: number = 30;

    /**
     * The maximum number of execution of a specific event in a single frame.
     */
    public static MaxEventTypeExecutionPerFrame: number = 30;
    /**
     * @internal
     * A list of all the coordinators per scene. Will be used by the inspector
     */
    public static readonly SceneCoordinators: Map<Scene, FlowGraphCoordinator[]> = new Map();

    /**
     * When set to true (default) custom events will be dispatched synchronously.
     * This means that the events will be dispatched immediately when they are triggered.
     */
    public dispatchEventsSynchronously: boolean = true;

    private readonly _flowGraphs: FlowGraph[] = [];

    private _customEventsMap: Map<string, Observable<any>> = new Map();

    private _eventExecutionCounter: Map<string, number> = new Map();

    private _disposeObserver: Observer<Scene>;
    private _onBeforeRenderObserver: Observer<Scene>;
    private _executeOnNextFrame: { id: string; data?: any; uniqueId: number }[] = [];
    private _eventUniqueId: number = 0;

    public constructor(
        /**
         * the configuration of the block
         */
        public config: IFlowGraphCoordinatorConfiguration
    ) {
        // When the scene is disposed, dispose all graphs currently running on it.
        this._disposeObserver = this.config.scene.onDisposeObservable.add(() => {
            this.dispose();
        });

        this._onBeforeRenderObserver = this.config.scene.onBeforeRenderObservable.add(() => {
            // Reset the event execution counter at the beginning of each frame.
            this._eventExecutionCounter.clear();
            // duplicate the _executeOnNextFrame array to avoid modifying it while iterating over it
            const executeOnNextFrame = this._executeOnNextFrame.slice(0);
            if (executeOnNextFrame.length) {
                // Execute the events that were triggered on the next frame.
                for (const event of executeOnNextFrame) {
                    this.notifyCustomEvent(event.id, event.data, false);
                    // remove the event from the array
                    const index = this._executeOnNextFrame.findIndex((e) => e.uniqueId === event.uniqueId);
                    if (index !== -1) {
                        this._executeOnNextFrame.splice(index, 1);
                    }
                }
            }
        });

        // Add itself to the SceneCoordinators list for the Inspector.
        const coordinators = FlowGraphCoordinator.SceneCoordinators.get(this.config.scene) ?? [];
        coordinators.push(this);
    }

    /**
     * Creates a new flow graph and adds it to the list of existing flow graphs
     * @returns a new flow graph
     */
    public createGraph(): FlowGraph {
        const graph = new FlowGraph({ scene: this.config.scene, coordinator: this });
        this._flowGraphs.push(graph);
        return graph;
    }

    /**
     * Removes a flow graph from the list of existing flow graphs and disposes it
     * @param graph the graph to remove
     */
    public removeGraph(graph: FlowGraph) {
        const index = this._flowGraphs.indexOf(graph);
        if (index !== -1) {
            graph.dispose();
            this._flowGraphs.splice(index, 1);
        }
    }

    /**
     * Starts all graphs
     */
    public start() {
        for (const graph of this._flowGraphs) {
            graph.start();
        }
    }

    /**
     * Disposes all graphs
     */
    public dispose() {
        for (const graph of this._flowGraphs) {
            graph.dispose();
        }
        this._flowGraphs.length = 0;
        this._disposeObserver?.remove();
        this._onBeforeRenderObserver?.remove();

        // Remove itself from the SceneCoordinators list for the Inspector.
        const coordinators = FlowGraphCoordinator.SceneCoordinators.get(this.config.scene) ?? [];
        const index = coordinators.indexOf(this);
        if (index !== -1) {
            coordinators.splice(index, 1);
        }
    }

    /**
     * Serializes this coordinator to a JSON object.
     * @param serializationObject the object to serialize to
     * @param valueSerializeFunction the function to use to serialize the value
     */
    public serialize(serializationObject: any, valueSerializeFunction?: (key: string, value: any, serializationObject: any) => void) {
        serializationObject._flowGraphs = [];
        for (const graph of this._flowGraphs) {
            const serializedGraph = {};
            graph.serialize(serializedGraph, valueSerializeFunction);
            serializationObject._flowGraphs.push(serializedGraph);
        }
        serializationObject.dispatchEventsSynchronously = this.dispatchEventsSynchronously;
    }

    /**
     * Gets the list of flow graphs
     */
    public get flowGraphs() {
        return this._flowGraphs;
    }

    /**
     * Get an observable that will be notified when the event with the given id is fired.
     * @param id the id of the event
     * @returns the observable for the event
     */
    public getCustomEventObservable(id: string): Observable<any> {
        let observable = this._customEventsMap.get(id);
        if (!observable) {
            // receive event is initialized before scene start, so no need to notify if triggered. but possible!
            observable = new Observable<any>(/*undefined, true*/);
            this._customEventsMap.set(id, observable);
        }
        return observable;
    }

    /**
     * Notifies the observable for the given event id with the given data.
     * @param id the id of the event
     * @param data the data to send with the event
     * @param async if true, the event will be dispatched asynchronously
     */
    public notifyCustomEvent(id: string, data: any, async: boolean = !this.dispatchEventsSynchronously) {
        if (async) {
            this._executeOnNextFrame.push({ id, data, uniqueId: this._eventUniqueId++ });
            return;
        }
        // check if we are not exceeding the max number of events
        if (this._eventExecutionCounter.has(id)) {
            const count = this._eventExecutionCounter.get(id)!;
            this._eventExecutionCounter.set(id, count + 1);
            if (count >= FlowGraphCoordinator.MaxEventTypeExecutionPerFrame) {
                count === FlowGraphCoordinator.MaxEventTypeExecutionPerFrame && Logger.Warn(`FlowGraphCoordinator: Too many executions of event "${id}".`);
                return;
            }
        } else {
            this._eventExecutionCounter.set(id, 1);
        }
        const observable = this._customEventsMap.get(id);
        if (observable) {
            observable.notifyObservers(data);
        }
    }
}
