import type { FlowGraph } from "./flowGraph";
import { FlowGraphConnectionType } from "./flowGraphConnectionType";
import { FlowGraphDataConnection } from "./flowGraphDataConnection";

/**
 * @experimental
 * A block in a flow graph. The most basic form
 * of a block has inputs and outputs that contain
 * data.
 */
export class FlowGraphBlock {
    /**
     * The name of the block.
     */
    public name: string;
    /**
     * The data inputs of the block.
     */
    public readonly dataInputs: FlowGraphDataConnection<any>[] = [];
    /**
     * The data outputs of the block.
     */
    public readonly dataOutputs: FlowGraphDataConnection<any>[] = [];
    /**
     * The graph that this block belongs to.
     */
    private _graph: FlowGraph;

    protected constructor(graph: FlowGraph) {
        this._graph = graph;
        this._graph._addBlock(this);
    }

    /**
     * @internal
     */
    public _updateOutputs(): void {
        // empty by default, overriden in data blocks
    }

    protected _registerDataInput<T>(name: string, defaultValue: T): FlowGraphDataConnection<T> {
        const input = new FlowGraphDataConnection<T>(name, FlowGraphConnectionType.Input, this, defaultValue);
        this.dataInputs.push(input);
        return input;
    }

    protected _registerDataOutput<T>(name: string, defaultValue: T): FlowGraphDataConnection<T> {
        const output = new FlowGraphDataConnection<T>(name, FlowGraphConnectionType.Output, this, defaultValue);
        this.dataOutputs.push(output);
        return output;
    }
}
