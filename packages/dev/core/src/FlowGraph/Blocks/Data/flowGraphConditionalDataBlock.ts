import type { FlowGraphContext } from "../../flowGraphContext";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { RichTypes } from "../../flowGraphRichTypes";

/**
 * @experimental
 * Block that returns a value based on a condition.
 */
export class FlowGraphConditionalDataBlock<T> extends FlowGraphBlock {
    public readonly condition: FlowGraphDataConnection<boolean>;
    public readonly trueValue: FlowGraphDataConnection<T>;
    public readonly falseValue: FlowGraphDataConnection<T>;

    public readonly output: FlowGraphDataConnection<T>;

    constructor() {
        super();

        this.condition = this._registerDataInput("condition", RichTypes.Boolean);
        this.trueValue = this._registerDataInput("trueValue", RichTypes.Any);
        this.falseValue = this._registerDataInput("falseValue", RichTypes.Any);

        this.output = this._registerDataOutput("output", RichTypes.Any);
    }

    /**
     * @internal
     */
    public _updateOutputs(context: FlowGraphContext): void {
        this.output.value = this.condition.getValue(context) ? this.trueValue.getValue(context) : this.falseValue.getValue(context);
    }
}
