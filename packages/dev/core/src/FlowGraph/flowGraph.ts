import type { FlowGraphBlock } from "./flowGraphBlock";
import { FlowGraphEventBlock } from "./flowGraphEventBlock";

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
        this._eventBlocks.forEach((block) => block.start());
    }
}
