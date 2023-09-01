import type { FlowGraphContext } from "../../flowGraphContext";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { RichTypeBoolean, RichTypeAny } from "../../flowGraphRichTypes";

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
