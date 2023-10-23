import type { Scene } from "../scene";
import { FlowGraph } from "./flowGraph";
import { FlowGraphEventCoordinator } from "./flowGraphEventCoordinator";

/**
 * @experimental
 * Parameters used to create a flow graph engine.
 */
export class IFlowGraphCoordinatorConfiguration {
    /**
     * The scene that the flow graph engine belongs to.
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

    /**
     * The event coordinator used by the flow graph coordinator.
     */
    public readonly eventCoordinator: FlowGraphEventCoordinator;
    private readonly _flowGraphs: FlowGraph[] = [];

    constructor(private _config: IFlowGraphCoordinatorConfiguration) {
        this.eventCoordinator = new FlowGraphEventCoordinator();

        // When the scene is disposed, dispose all graphs currently running on it.
        this._config.scene.onDisposeObservable.add(() => {
            this.dispose();
        });

        // Add itself to the SceneCoordinators list for the Inspector.
        const coordinators = FlowGraphCoordinator.SceneCoordinators.get(this._config.scene) ?? [];
        coordinators.push(this);
    }

    /**
     * Creates a new flow graph and adds it to the list of existing flow graphs
     * @returns a new flow graph
     */
    createGraph(): FlowGraph {
        const graph = new FlowGraph({ scene: this._config.scene, eventCoordinator: this.eventCoordinator });
        this._flowGraphs.push(graph);
        return graph;
    }

    /**
     * Removes a flow graph from the list of existing flow graphs and disposes it
     * @param graph the graph to remove
     */
    removeGraph(graph: FlowGraph) {
        const index = this._flowGraphs.indexOf(graph);
        if (index !== -1) {
            graph.dispose();
            this._flowGraphs.splice(index, 1);
        }
    }

    /**
     * Starts all graphs
     */
    start() {
        this._flowGraphs.forEach((graph) => graph.start());
    }

    /**
     * Disposes all graphs
     */
    dispose() {
        this._flowGraphs.forEach((graph) => graph.dispose());
        this._flowGraphs.length = 0;

        // Remove itself from the SceneCoordinators list for the Inspector.
        const coordinators = FlowGraphCoordinator.SceneCoordinators.get(this._config.scene) ?? [];
        const index = coordinators.indexOf(this);
        if (index !== -1) {
            coordinators.splice(index, 1);
        }
    }

    serialize(serializationObject: any, valueSerializeFunction?: (key: string, value: any, serializationObject: any) => void) {
        serializationObject._flowGraphs = [];
        this._flowGraphs.forEach((graph) => {
            const serializedGraph = {};
            graph.serialize(serializedGraph, valueSerializeFunction);
            serializationObject._flowGraphs.push(serializedGraph);
        });
    }

    public static Parse(serializedObject: any, scene: Scene, valueParseFunction?: (key: string, serializationObject: any, scene: Scene) => any) {
        const coordinator = new FlowGraphCoordinator({ scene });
        serializedObject._flowGraphs?.forEach((serializedGraph: any) => {
            FlowGraph.Parse(serializedGraph, coordinator, valueParseFunction);
        });
        return coordinator;
    }
}
