import { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { getRichTypeFromValue } from "core/FlowGraph/flowGraphRichTypes";

export interface IFlowGraphConstantBlockConfiguration<T> {
    value: T;
}
/**
 * @experimental
 * Block that returns a constant value.
 */
export class FlowGraphConstantBlock<T> extends FlowGraphBlock {
    public readonly output: FlowGraphDataConnection<T>;

    constructor(private _config: IFlowGraphConstantBlockConfiguration<T>) {
        super();

        this.output = this._registerDataOutput("output", getRichTypeFromValue(_config.value));
    }

    public _updateOutputs(_context: FlowGraphContext): void {
        this.output.value = this._config.value;
    }
}
