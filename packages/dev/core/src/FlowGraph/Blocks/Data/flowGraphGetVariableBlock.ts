import type { FlowGraphContext } from "../../flowGraphContext";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { RichTypeString, RichTypeAny } from "../../flowGraphRichTypes";

/**
 * @experimental
 */
export class FlowGraphGetVariableBlock<T> extends FlowGraphBlock {
    public readonly variableName: FlowGraphDataConnection<string>;
    public readonly output: FlowGraphDataConnection<T>;

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
            this.output.value = context.getVariable(variableNameValue);
        }
    }
}
