import type { FlowGraphContext } from "../../flowGraphContext";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { RichTypeBoolean, RichTypeAny } from "../../flowGraphRichTypes";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { RegisterClass } from "../../../Misc/typeStore";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";

/**
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
    public readonly onTrue: FlowGraphDataConnection<T>;
    /**
     * Input connection: The value to return if the condition is false.
     */
    public readonly onFalse: FlowGraphDataConnection<T>;

    /**
     * Output connection: The value that was returned.
     */
    public readonly output: FlowGraphDataConnection<T>;

    /**
     * Creates a new instance of the block
     * @param config optional configuration for this block
     */
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);

        this.condition = this.registerDataInput("condition", RichTypeBoolean);
        this.onTrue = this.registerDataInput("onTrue", RichTypeAny);
        this.onFalse = this.registerDataInput("onFalse", RichTypeAny);

        this.output = this.registerDataOutput("output", RichTypeAny);
    }

    /**
     * @internal
     */
    public override _updateOutputs(context: FlowGraphContext): void {
        // get the value of the condition
        const condition = this.condition.getValue(context);
        // set the value based on the condition truth-ness.
        this.output.setValue(condition ? this.onTrue.getValue(context) : this.onFalse.getValue(context), context);
    }

    /**
     * Gets the class name of this block
     * @returns the class name
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.Conditional;
    }
}
RegisterClass(FlowGraphBlockNames.Conditional, FlowGraphConditionalDataBlock);
