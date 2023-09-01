import { RichTypeString, RichTypeAny } from "../../flowGraphRichTypes";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../flowGraphWithOnDoneExecutionBlock";

/**
 * @experimental
 */
export class FlowGraphSetVariableBlock<T> extends FlowGraphWithOnDoneExecutionBlock {
    public readonly variableName: FlowGraphDataConnection<string>;
    public readonly input: FlowGraphDataConnection<T>;

    constructor() {
        super();

        this.variableName = this._registerDataInput("variableName", RichTypeString);
        this.input = this._registerDataInput("input", RichTypeAny);
    }

    public _execute(context: FlowGraphContext): void {
        const variableNameValue = this.variableName.getValue(context);
        context.setVariable(variableNameValue, this.input.getValue(context));
        this.onDone._activateSignal(context);
    }
}
