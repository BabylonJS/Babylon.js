import type { FlowGraphContext } from "../../flowGraphContext";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { RichTypeString, RichTypeAny } from "../../flowGraphRichTypes";

/**
 * A block that gets the value of a variable.
 * @experimental
 */
export class FlowGraphGetVariableBlock<T> extends FlowGraphBlock {
    /**
     * Input connection: The name of the variable to get.
     */
    public readonly variableName: FlowGraphDataConnection<string>;
    /**
     * Output connection: The value of the variable.
     */
    public readonly output: FlowGraphDataConnection<T>;

    /**
     * Construct a FlowGraphGetVariableBlock.
     * @param params optional construction parameters
     */
    constructor() {
        super();

        this.variableName = this._registerDataInput("variableName", RichTypeString);
        this.output = this._registerDataOutput("output", RichTypeAny);
    }

    /**
     * @internal
     */
    public _updateOutputs(context: FlowGraphContext): void {
        const variableNameValue = this.variableName.getValue(context);
        if (context.hasVariable(variableNameValue)) {
            this.output.setValue(context.getVariable(variableNameValue), context);
        }
    }
}
