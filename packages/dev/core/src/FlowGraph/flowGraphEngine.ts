import type { Scene } from "../scene";
import { FlowGraph } from "./flowGraph";
import { FlowGraphEventCoordinator } from "./flowGraphEventCoordinator";

export class IFlowGraphEngineConfiguration {
    scene: Scene;
}
/**
 * The FlowGraphEngine class holds all of the existing flow graphs and is responsible for creating new ones.
 * It also handles communication between them through an Event Coordinator
 */
export class FlowGraphEngine {
    private _eventCoordinator: FlowGraphEventCoordinator;
    private _flowGraphs: FlowGraph[] = [];

    constructor(private _config: IFlowGraphEngineConfiguration) {
        this._eventCoordinator = new FlowGraphEventCoordinator();
    }

    /**
     * Creates a new flow graph and adds it to the list of existing flow graphs
     * @returns a new flow graph
     */
    createGraph(): FlowGraph {
        const graph = new FlowGraph({ scene: this._config.scene, eventCoordinator: this._eventCoordinator });
        this._flowGraphs.push(graph);
        return graph;
    }

    /**
     * Starts all graphs
     */
    start() {
        this._flowGraphs.forEach((graph) => graph.start());
    }
}
