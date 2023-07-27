import type { FlowGraphBlock } from "./flowGraphBlock";
import { FlowGraphEventBlock } from "./flowGraphEventBlock";

/**
 * @experimental
 * Class used to represent a flow graph.
 * A flow graph is a graph of blocks that can be used to create complex logic.
 * Blocks can be added to the graph and connected to each other.
 * The graph can then be started, which will start the execution of the blocks.
 */
export class FlowGraph {
    private _blocks: FlowGraphBlock[] = [];
    private _eventBlocks: FlowGraphEventBlock[] = [];

    public addBlock(block: FlowGraphBlock): void {
        this._blocks.push(block);
        if (block instanceof FlowGraphEventBlock) {
            this._eventBlocks.push(block);
        }
    }

    public findBlockByName(name: string): FlowGraphBlock | undefined {
        return this._blocks.find((block) => block.name === name);
    }

    public start() {
        this._eventBlocks.forEach((block) => {
            block.init();
            block.start();
        });
    }
}
