import type { FlowGraph } from "./flowGraph";
import { FlowGraphDataConnectionPoint, FlowGraphConnectionPointDirection } from "./flowGraphConnectionPoint";

/**
 * @experimental
 * A block in a flow graph. The most basic form
 * of a block has inputs and outputs that contain
 * data.
 */
export abstract class FlowGraphBlock {
    /**
     * The name of the block.
     */
    public name: string;
    /**
     * The data inputs of the block.
     */
    public readonly dataInputs: FlowGraphDataConnectionPoint<any>[] = [];
    /**
     * The data outputs of the block.
     */
    public readonly dataOutputs: FlowGraphDataConnectionPoint<any>[] = [];
    /**
     * The graph that this block belongs to.
     */
    private _graph: FlowGraph;

    constructor(graph: FlowGraph) {
        this._graph = graph;
        this._graph._addBlock(this);
    }

    protected _registerDataInput<T>(name: string, defaultValue: T): FlowGraphDataConnectionPoint<T> {
        const input = new FlowGraphDataConnectionPoint<T>(name, FlowGraphConnectionPointDirection.Input, this, defaultValue);
        this.dataInputs.push(input);
        return input;
    }

    protected _registerDataOutput<T>(name: string, defaultValue: T): FlowGraphDataConnectionPoint<T> {
        const output = new FlowGraphDataConnectionPoint<T>(name, FlowGraphConnectionPointDirection.Output, this, defaultValue);
        this.dataOutputs.push(output);
        return output;
    }
}
