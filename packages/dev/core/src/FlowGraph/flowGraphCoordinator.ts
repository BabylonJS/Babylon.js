import { Observable } from "core/Misc/observable";
import type { Scene } from "../scene";
import { FlowGraph } from "./flowGraph";
import type { IPathToObjectConverter } from "../ObjectModel/objectModelInterfaces";
import { defaultValueParseFunction } from "./serialization";
import type { IObjectAccessor } from "./typeDefinitions";

/**
 * @experimental
 * Parameters used to create a flow graph engine.
 */
export interface IFlowGraphCoordinatorConfiguration {
    /**
     * The scene that the flow graph engine belongs to.
     */
    scene: Scene;
}

/**
 * @experimental
 * Parameters used to parse a flow graph coordinator.
 */
export interface FlowGraphCoordinatorParseOptions {
    /**
     * A function that will be called to parse the value of a property.
     * @param key the key of the property
     * @param serializationObject the serialization object where the property is located
     * @param scene the scene that the block is being parsed in
     */
    valueParseFunction?: (key: string, serializationObject: any, scene: Scene) => any;
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
 */
export class FlowGraphCoordinator {
    /**
     * @internal
     * A list of all the coordinators per scene. Will be used by the inspector
     */
    public static readonly SceneCoordinators: Map<Scene, FlowGraphCoordinator[]> = new Map();

    private readonly _flowGraphs: FlowGraph[] = [];

    private _customEventsMap: Map<string, Observable<any>> = new Map();

    public constructor(
        /**
         * the configuration of the block
         */
        public config: IFlowGraphCoordinatorConfiguration
    ) {
        // When the scene is disposed, dispose all graphs currently running on it.
        this.config.scene.onDisposeObservable.add(() => {
            this.dispose();
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
        this._flowGraphs.forEach((graph) => graph.start());
    }

    /**
     * Disposes all graphs
     */
    public dispose() {
        this._flowGraphs.forEach((graph) => graph.dispose());
        this._flowGraphs.length = 0;

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
        this._flowGraphs.forEach((graph) => {
            const serializedGraph = {};
            graph.serialize(serializedGraph, valueSerializeFunction);
            serializationObject._flowGraphs.push(serializedGraph);
        });
    }

    /**
     * Parses a serialized coordinator.
     * @param serializedObject the object to parse
     * @param options the options to use when parsing
     * @returns the parsed coordinator
     */
    public static Parse(serializedObject: any, options: FlowGraphCoordinatorParseOptions) {
        const valueParseFunction = options.valueParseFunction ?? defaultValueParseFunction;
        const coordinator = new FlowGraphCoordinator({ scene: options.scene });
        serializedObject._flowGraphs?.forEach((serializedGraph: any) => {
            FlowGraph.Parse(serializedGraph, { coordinator, valueParseFunction, pathConverter: options.pathConverter });
        });
        return coordinator;
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
            observable = new Observable<any>();
            this._customEventsMap.set(id, observable);
        }
        return observable;
    }

    /**
     * Notifies the observable for the given event id with the given data.
     * @param id the id of the event
     * @param data the data to send with the event
     */
    public notifyCustomEvent(id: string, data: any) {
        const observable = this._customEventsMap.get(id);
        if (observable) {
            observable.notifyObservers(data);
        }
    }
}
