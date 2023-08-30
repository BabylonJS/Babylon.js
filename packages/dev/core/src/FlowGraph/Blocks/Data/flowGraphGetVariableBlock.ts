import type { FlowGraphContext } from "../../flowGraphContext";
import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { RichTypes } from "../../flowGraphRichTypes";

/**
 * @experimental
 */
export class FlowGraphGetVariableBlock<T> extends FlowGraphBlock {
    public readonly variableName: FlowGraphDataConnection<string>;
    public readonly output: FlowGraphDataConnection<T>;

    constructor() {
        super();

        this.variableName = this._registerDataInput("variableName", RichTypes.String);
        this.output = this._registerDataOutput("output", RichTypes.Any);
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
