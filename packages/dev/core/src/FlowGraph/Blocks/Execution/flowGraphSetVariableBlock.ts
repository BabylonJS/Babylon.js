import { RichTypeString, RichTypeAny } from "../../flowGraphRichTypes";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../flowGraphWithOnDoneExecutionBlock";
import { RegisterClass } from "core/Misc/typeStore";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";

/**
 * Block to set a variable.
 * @experimental
 */
export class FlowGraphSetVariableBlock<T> extends FlowGraphWithOnDoneExecutionBlock {
    /**
     * Input connection: The name of the variable to set.
     */
    public readonly variableName: FlowGraphDataConnection<string>;
    /**
     * Input connection: The value to set on the variable.
     */
    public readonly input: FlowGraphDataConnection<T>;

    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);

        this.variableName = this._registerDataInput("variableName", RichTypeString);
        this.input = this._registerDataInput("input", RichTypeAny);
    }

    public _execute(context: FlowGraphContext): void {
        const variableNameValue = this.variableName.getValue(context);
        const inputValue = this.input.getValue(context);
        context.setVariable(variableNameValue, inputValue);
        this.onDone._activateSignal(context);
    }

    public getClassName(): string {
        return "FGSetVariableBlock";
    }
}
RegisterClass("FGSetVariableBlock", FlowGraphSetVariableBlock);
