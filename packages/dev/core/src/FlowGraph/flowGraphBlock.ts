import type { FlowGraph } from "./flowGraph";
import { FlowGraphConnectionPointRole } from "./flowGraphConnectionPointRole";
import { FlowGraphDataConnectionPoint } from "./flowGraphDataConnectionPoint";
import type { ValueSetter } from "./valueContainer";
import { makeValueContainer } from "./valueContainer";

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

    protected _registerDataInput<T>(name: string, defaultValue: T): { connectionPoint: FlowGraphDataConnectionPoint<T>; valueSetter: ValueSetter<T> } {
        const inputValueContainer = makeValueContainer(defaultValue);
        const input = new FlowGraphDataConnectionPoint<T>(name, FlowGraphConnectionPointRole.Input, this, inputValueContainer);
        this.dataInputs.push(input);
        return { connectionPoint: input, valueSetter: inputValueContainer.setValue };
    }

    protected _registerDataOutput<T>(name: string, defaultValue: T): { connectionPoint: FlowGraphDataConnectionPoint<T>; valueSetter: ValueSetter<T> } {
        const outputValueContainer = makeValueContainer(defaultValue);
        const output = new FlowGraphDataConnectionPoint<T>(name, FlowGraphConnectionPointRole.Output, this, outputValueContainer);
        this.dataOutputs.push(output);
        return { connectionPoint: output, valueSetter: outputValueContainer.setValue };
    }
}
