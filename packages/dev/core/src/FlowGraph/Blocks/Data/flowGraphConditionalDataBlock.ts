import type { FlowGraphContext } from "../../flowGraphContext";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphValueType } from "core/FlowGraph/flowGraphTypes";

/**
 * @experimental
 * Block that returns a value based on a condition.
 */
export class FlowGraphConditionalDataBlock extends FlowGraphBlock {
    public readonly condition: FlowGraphDataConnection;
    public readonly trueValue: FlowGraphDataConnection;
    public readonly falseValue: FlowGraphDataConnection;

    public readonly output: FlowGraphDataConnection;

    constructor() {
        super();

        this.condition = this._registerDataInput("condition", FlowGraphValueType.Boolean);
        this.trueValue = this._registerDataInput("trueValue", FlowGraphValueType.Any);
        this.falseValue = this._registerDataInput("falseValue", FlowGraphValueType.Any);

        this.output = this._registerDataOutput("output", FlowGraphValueType.Any);
    }

    /**
     * @internal
     */
    public _updateOutputs(context: FlowGraphContext): void {
        this.output.value = this.condition.getValue(context) ? this.trueValue.getValue(context) :  this.falseValue.getValue(context);
    }
}
