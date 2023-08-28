import type { Observer } from "../Misc/observable";
import type { Nullable } from "../types";
import type { Scene } from "../scene";
import type { FlowGraphBlock } from "./flowGraphBlock";
import { FlowGraphEventBlock } from "./flowGraphEventBlock";
import { FlowGraphExecutionBlock } from "./flowGraphExecutionBlock";
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

    private _blocks: FlowGraphBlock[] = [];
    private _sceneDisposeObserver: Nullable<Observer<Scene>>;
    private _scene: Scene;
    private _executionContexts: Array<FlowGraphContext> = [];

    public constructor(params: FlowGraphParams) {
        this._scene = params.scene;
        this._sceneDisposeObserver = this._scene.onDisposeObservable.add(this.dispose.bind(this));
    }

    public get scene() {
        return this._scene;
    }

    public createContext() {
        const context = this.variableDefinitions.getContext();
        this._executionContexts.push(context);
        return context;
    }

    /**
     * @internal
     * @param block
     */
    public _addBlock(block: FlowGraphBlock): void {
        this._blocks.push(block);
    }

    /**
     * Starts the flow graph.
     */
    public start() {
        if (this._executionContexts.length === 0) {
            this.createContext();
        }
        for (const context of this._executionContexts) {
            for (const block of this._blocks) {
                if (block instanceof FlowGraphEventBlock) {
                    block._startListening(context);
                }
            }
        }
    }

    /**
     * Disposes of the flow graph.
     */
    public dispose() {
        for (const context of this._executionContexts) {
            for (const block of this._blocks) {
                if (block instanceof FlowGraphExecutionBlock) {
                    block._cancelPendingTasks(context);
                }
            }
        }
        this._executionContexts.length = 0;
        this._blocks.length = 0;
        this._scene.onDisposeObservable.remove(this._sceneDisposeObserver);
        this._sceneDisposeObserver = null;
    }
}
