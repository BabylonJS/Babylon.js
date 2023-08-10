import type { FlowGraph } from "../../flowGraph";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";

/**
 * @experimental
 */
export interface IFlowGraphConditionalDataBlockParams<T> {
    defaultTrueValue: T;
    defaultFalseValue: T;
}

/**
 * @experimental
 * Block that returns a value based on a condition.
 */
export class FlowGraphConditionalDataBlock<T> extends FlowGraphBlock {
    public readonly condition: FlowGraphDataConnection<boolean>;
    public readonly trueValue: FlowGraphDataConnection<T>;
    public readonly falseValue: FlowGraphDataConnection<T>;

    public readonly output: FlowGraphDataConnection<T>;

    constructor(graph: FlowGraph, params: IFlowGraphConditionalDataBlockParams<T>) {
        super(graph);

        this.condition = this._registerDataInput("condition", false);
        this.trueValue = this._registerDataInput("trueValue", params.defaultTrueValue);
        this.falseValue = this._registerDataInput("falseValue", params.defaultFalseValue);

        this.output = this._registerDataOutput("output", params.defaultFalseValue);
    }

    /**
     * @internal
     */
    public _updateOutputs(): void {
        if (this.condition.value) {
            this.output.value = this.trueValue.value;
        } else {
            this.output.value = this.falseValue.value;
        }
    }
}
