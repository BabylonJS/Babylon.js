import type { FlowGraph } from "../../flowGraph";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";

/**
 * @experimental
 * Block that returns a value based on a condition.
 */
export class FlowGraphConditionalDataBlock<T> extends FlowGraphBlock {
    public readonly condition: FlowGraphDataConnection<boolean>;
    public readonly trueValue: FlowGraphDataConnection<T>;
    public readonly falseValue: FlowGraphDataConnection<T>;

    public readonly output: FlowGraphDataConnection<T>;

    constructor(graph: FlowGraph, defaultTrueValue: T, defaultFalseValue: T) {
        super(graph);

        this.condition = this._registerDataInput("condition", false);
        this.trueValue = this._registerDataInput("trueValue", defaultTrueValue);
        this.falseValue = this._registerDataInput("falseValue", defaultFalseValue);

        this.output = this._registerDataOutput("output", defaultFalseValue);
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
