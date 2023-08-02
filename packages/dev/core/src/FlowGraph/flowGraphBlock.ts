import type { FlowGraph } from "./flowGraph";
import { FlowGraphConnectionType } from "./flowGraphConnectionType";
import { FlowGraphDataConnection } from "./flowGraphDataConnection";
import { makeValueContainer } from "./valueContainer";

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

    protected _registerDataInput<T>(name: string, defaultValue: T): { connectionPoint: FlowGraphDataConnection<T>; valueSetter: (value: T) => void } {
        const inputValueContainer = makeValueContainer(defaultValue);
        const input = new FlowGraphDataConnection<T>(name, FlowGraphConnectionType.Input, this, inputValueContainer);
        this.dataInputs.push(input);
        return { connectionPoint: input, valueSetter: inputValueContainer.setValue };
    }

    protected _registerDataOutput<T>(name: string, defaultValue: T): { connectionPoint: FlowGraphDataConnection<T>; valueSetter: (value: T) => void } {
        const outputValueContainer = makeValueContainer(defaultValue);
        const output = new FlowGraphDataConnection<T>(name, FlowGraphConnectionType.Output, this, outputValueContainer);
        this.dataOutputs.push(output);
        return { connectionPoint: output, valueSetter: outputValueContainer.setValue };
    }
}
