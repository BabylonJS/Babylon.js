import type { Observer } from "../Misc/observable";
import type { Nullable } from "../types";
import type { Scene } from "../scene";
import type { FlowGraphEventBlock } from "./flowGraphEventBlock";
import { FlowGraphVariableDefinitions } from "./flowGraphVariableDefinitions";
import type { FlowGraphContext } from "./flowGraphContext";
import type { FlowGraphEventCoordinator } from "./flowGraphEventCoordinator";

/**
 * @experimental
 * Parameters used to create a flow graph.
 */
export interface FlowGraphParams {
    /**
     * The scene that the flow graph belongs to.
     */
    scene: Scene;
    /**
     * The event coordinator used by the flow graph.
     */
    eventCoordinator: FlowGraphEventCoordinator;
}
/**
 * @experimental
 * Class used to represent a flow graph.
 * A flow graph is a graph of blocks that can be used to create complex logic.
 * Blocks can be added to the graph and connected to each other.
 * The graph can then be started, which will init and start all of its event blocks.
 */
export class FlowGraph {
    /**
     * The variables defined for this graph
     */
    public variableDefinitions: FlowGraphVariableDefinitions = new FlowGraphVariableDefinitions();

    private _eventBlocks: FlowGraphEventBlock[] = [];
    private _sceneDisposeObserver: Nullable<Observer<Scene>>;
    /**
     * @internal
     */
    public readonly _scene: Scene;
    private _eventCoordinator: FlowGraphEventCoordinator;
    private _executionContexts: FlowGraphContext[] = [];

    /**
     * Construct a Flow Graph
     * @param params construction parameters. currently only the scene
     */
    public constructor(params: FlowGraphParams) {
        this._scene = params.scene;
        this._eventCoordinator = params.eventCoordinator;
        this._sceneDisposeObserver = this._scene.onDisposeObservable.add(this.dispose.bind(this));
    }

    /**
     * Create a context. A context represents one self contained execution for the graph, with its own variables.
     * @returns the context, where you can get and set variables
     */
    public createContext() {
        const context = this.variableDefinitions.generateContext({ scene: this._scene, eventCoordinator: this._eventCoordinator });
        this._executionContexts.push(context);
        return context;
    }

    /**
     * Add an event block. When the graph is started, it will start listening to events
     * from the block and execute the graph when they are triggered.
     * @param block
     */
    public addEventBlock(block: FlowGraphEventBlock): void {
        this._eventBlocks.push(block);
    }

    /**
     * Starts the flow graph. Initializes the event blocks and starts listening to events.
     */
    public start() {
        if (this._executionContexts.length === 0) {
            this.createContext();
        }
        for (const context of this._executionContexts) {
            for (const block of this._eventBlocks) {
                block._startPendingTasks(context);
            }
        }
    }

    /**
     * Disposes of the flow graph. Cancels any pending tasks and removes all event listeners.
     */
    public dispose() {
        for (const context of this._executionContexts) {
            context._clearPendingBlocks();
        }
        this._executionContexts.length = 0;
        this._eventBlocks.length = 0;
        this._scene.onDisposeObservable.remove(this._sceneDisposeObserver);
        this._sceneDisposeObserver = null;
    }
}
