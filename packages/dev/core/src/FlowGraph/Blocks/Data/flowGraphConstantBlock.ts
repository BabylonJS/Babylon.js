import { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import type { FlowGraphContext } from "core/FlowGraph/flowGraphContext";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { getRichTypeFromValue } from "core/FlowGraph/flowGraphRichTypes";

/**
 * @experimental
 * Configuration for a constant block.
 */
export interface IFlowGraphConstantBlockConfiguration<T> {
    /**
     * The value of the constant.
     */
    value: T;
}
/**
 * @experimental
 * Block that returns a constant value.
 */
export class FlowGraphConstantBlock<T> extends FlowGraphBlock {
    /**
     * Output connection: The constant value.
     */
    public readonly output: FlowGraphDataConnection<T>;

    constructor(private _config: IFlowGraphConstantBlockConfiguration<T>) {
        super();

        this.output = this._registerDataOutput("output", getRichTypeFromValue(_config.value));
    }

    public _updateOutputs(context: FlowGraphContext): void {
        this.output.setValue(this._config.value, context);
    }
}
