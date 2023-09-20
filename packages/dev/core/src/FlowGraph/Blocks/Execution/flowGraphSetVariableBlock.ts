import { RichTypeString, RichTypeAny } from "../../flowGraphRichTypes";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { FlowGraphWithOnDoneExecutionBlock } from "../../flowGraphWithOnDoneExecutionBlock";

export interface IFlowGraphSetVariableBlockParameter<T> {
    variableName?: string;
    input?: T;
}
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

    constructor(private _params?: IFlowGraphSetVariableBlockParameter<T>) {
        super();

        this.variableName = this._registerDataInput("variableName", RichTypeString);
        this.input = this._registerDataInput("input", RichTypeAny);
    }

    public _execute(context: FlowGraphContext): void {
        const variableNameValue = this.variableName.getValue(context) ?? this._params?.variableName ?? "variable";
        const inputValue = this.input.getValue(context) ?? this._params?.input;
        context.setVariable(variableNameValue, inputValue);
        this.onDone._activateSignal(context);
    }
}
