import type { Observer } from "../Misc/observable";
import type { Nullable } from "../types";
import type { Scene } from "../scene";
import type { FlowGraphBlock } from "./flowGraphBlock";
import { FlowGraphEventBlock } from "./flowGraphEventBlock";

/**
 * @experimental
 * Class used to represent a flow graph.
 * A flow graph is a graph of blocks that can be used to create complex logic.
 * Blocks can be added to the graph and connected to each other.
 * The graph can then be started, which will init and start all of its event blocks.
 */
export class FlowGraph {
    private _blocks: FlowGraphBlock[] = [];
    private _sceneDisposeObserver: Nullable<Observer<Scene>>;

    public constructor(private _scene: Scene) {
        this._sceneDisposeObserver = this._scene.onDisposeObservable.add(this.dispose.bind(this));
    }

    /**
     * @internal
     * @param block
     */
    public _addBlock(block: FlowGraphBlock): void {
        this._blocks.push(block);
    }

    /**
     * Finds a block by its name.
     * @param name
     * @returns
     */
    public findBlockByName(name: string): FlowGraphBlock | undefined {
        return this._blocks.find((block) => block.name === name);
    }

    /**
     * Starts the flow graph.
     */
    public start() {
        for (const block of this._blocks) {
            if (block instanceof FlowGraphEventBlock) {
                block._startListening();
            }
        }
    }

    /**
     * Disposes of the flow graph.
     */
    public dispose() {
        for (const block of this._blocks) {
            if (block instanceof FlowGraphEventBlock) {
                block._stopListening();
            }
        }
        this._blocks.length = 0;
        this._scene.onDisposeObservable.remove(this._sceneDisposeObserver);
        this._sceneDisposeObserver = null;
    }
}
