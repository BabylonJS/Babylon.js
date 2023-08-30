import type { Observer } from "../Misc/observable";
import type { Nullable } from "../types";
import type { Scene } from "../scene";
import type { FlowGraphEventBlock } from "./flowGraphEventBlock";
import { FlowGraphVariableDefinitions } from "./flowGraphVariableDefinitions";
import type { FlowGraphContext } from "./flowGraphContext";

export interface FlowGraphParams {
    scene: Scene;
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
    public readonly _scene: Scene;
    private _executionContexts: FlowGraphContext[] = [];

    public constructor(params: FlowGraphParams) {
        this._scene = params.scene;
        this._sceneDisposeObserver = this._scene.onDisposeObservable.add(this.dispose.bind(this));
    }

    public createContext() {
        const context = this.variableDefinitions.generateContext();
        context._setGraphVariable("scene", this._scene);
        this._executionContexts.push(context);
        return context;
    }

    /**
     * @param block
     */
    public addEventBlock(block: FlowGraphEventBlock): void {
        this._eventBlocks.push(block);
    }

    /**
     * Starts the flow graph.
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
     * Disposes of the flow graph.
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
