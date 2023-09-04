import type { FlowGraphContext } from "../../flowGraphContext";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { RichTypeBoolean, RichTypeAny } from "../../flowGraphRichTypes";

/**
 * @experimental
 * Block that returns a value based on a condition.
 */
export class FlowGraphConditionalDataBlock<T> extends FlowGraphBlock {
    /**
     * Input connection: The condition to check.
     */
    public readonly condition: FlowGraphDataConnection<boolean>;
    /**
     * Input connection: The value to return if the condition is true.
     */
    public readonly trueValue: FlowGraphDataConnection<T>;
    /**
     * Input connection: The value to return if the condition is false.
     */
    public readonly falseValue: FlowGraphDataConnection<T>;

    /**
     * Output connection: The value that was returned.
     */
    public readonly output: FlowGraphDataConnection<T>;

    constructor() {
        super();

        this.condition = this._registerDataInput("condition", RichTypeBoolean);
        this.trueValue = this._registerDataInput("trueValue", RichTypeAny);
        this.falseValue = this._registerDataInput("falseValue", RichTypeAny);

        this.output = this._registerDataOutput("output", RichTypeAny);
    }

    /**
     * @internal
     */
    public _updateOutputs(context: FlowGraphContext): void {
        this.output.value = this.condition.getValue(context) ? this.trueValue.getValue(context) : this.falseValue.getValue(context);
    }
}
